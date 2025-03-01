import dotenv from 'dotenv';
import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import { OAuth2Client } from 'google-auth-library';
import {
  createUser,
  updateIsEmailVerified,
  findPhoneNumber,
  updateUserPhoneNumber,
  fetchUserImage,
  deleteUserImage,
  updateImgageURL,
  findUserByEmail,
  findAdminByEmail,
  findUserById,
  updateUserPassword,
  updateUserEmail,
  deactivateUser,
  selectToReactivateUser,
  reactivateUser,
  createAddress,
  updateUserPushToken
} from '../repository/user';
import { createKYC, findUserKYC } from '../repository/kyc';
import { BadRequestError, ConflictError, ResourceNotFoundError } from '../errors';
import type { Address, Contact_US, KYC, User, User_Image } from '../interfaces';
import { SMS_STATUS } from '../constants';
import { hashPassword, comparePassword, respond, JWT, sendOtpToUser, verifyOtp, logger } from '../utilities';
// import {
//   accountVerificationTemplate,
//   accountDeactivationTemplate,
//   accountActivationTemplate,
//   transporter,
//   makeAccountVerificationToken,
//   getActivationLinkURL,
//   getForgotPasswordUrl
// } from '../services/email';
import variables from '../variables';
import { createContactUS } from '../repository/contact_us';
import pool from '../config/database.config';

dotenv.config();

export const UserController = {
  sendOtpToPhoneNumber: (): RequestHandler => async (req, res, next) => {
    const { phone_number } = req.body;
    console.log('1', phone_number);
    const params = [phone_number];
    try {
      const foundUser = await findPhoneNumber(params as Partial<User>);
      console.log('2', foundUser);
      if (foundUser) {
        throw new ConflictError('phone number is in use');
      }

      const smsSent = await sendOtpToUser(phone_number);
      console.log('3', smsSent);

      if (smsSent === SMS_STATUS.PENDING) {
        return respond(res, 'sms was successfully sent', HttpStatus.OK);
      } else {
        return respond(res, 'there was a problem sending the sms', HttpStatus.EXPECTATION_FAILED);
      }
    } catch (error) {
      console.log(`ERROR, ${error}`);
      next(error);
    }
  },

  verifyUserPhoneNumber: (): RequestHandler => async (req, res, next) => {
    const { phone_number, otp } = req.body;

    try {
      const smsResult = await verifyOtp(phone_number, otp);
      if (smsResult === SMS_STATUS.APPROVED) {
        return respond(res, `${phone_number} verified successfully`, HttpStatus.OK);
      } else {
        return respond(res, 'there was a problem verifying the phone number', HttpStatus.EXPECTATION_FAILED);
      }
    } catch (error) {
      next(error);
    }
  },

  saveKYCDetails: (): RequestHandler => async (req, res, next) => {
    // const userId = res.locals.user.id;
    const { userId, sex, health_goals, dietary_preferences, food_allergies, health_concerns } = req.body;
    try {
      const user = await findUserById([userId] as Partial<User>);
      if (!user) {
        return respond(res, `user with id of ${userId} does not exist`, HttpStatus.BAD_REQUEST);
      }
      const kycDetailsFound = await findUserKYC([userId] as Partial<KYC>);
      if (kycDetailsFound) {
        return respond(res, 'customer already has KYC, consider updating existing KYC', HttpStatus.BAD_REQUEST);
      }
      const kycDetails = await createKYC([userId, sex, health_goals, dietary_preferences, food_allergies, health_concerns] as Partial<KYC>);
      return respond(res, kycDetails, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  },

  foundKYCDetails: (): RequestHandler => async (req, res, next) => {
    const userId = res.locals.user.id;
    try {
      const kycDetails = await findUserKYC([userId] as Partial<KYC>);
      return respond(res, kycDetails, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  },

  createUserWithPhoneNumber: (): RequestHandler => async (req, res, next) => {
    let params = [
      req.body.first_name,
      req.body.last_name,
      req.body.phone_number,
      req.body.email,
      req.body.password,
      req.body.age,
      req.body.state,
      req.body.city,
      req.body.address
    ];

    try {
      const existingUser = await findUserByEmail([req.body.email] as Partial<User>);
      if (existingUser) {
        throw new ConflictError('email already exists');
      }
      const foundUserWithPhone = await findPhoneNumber([req.body.phone_number] as Partial<User>);
      console.log('2', foundUserWithPhone);
      if (foundUserWithPhone) {
        throw new ConflictError('phone number is in use');
      }
      let user: User;
      params[4] = await hashPassword(req.body.password);
      user = await createUser(params as Partial<User>);

      respond<User>(res, user, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  },

  googleAuth: (): RequestHandler => async (req, res, next) => {
    const { idToken } = req.body;

    const client = new OAuth2Client(variables.services.google.clientID);

    try {
      const ticket = await client.verifyIdToken({
        idToken
        //audience: variables.services.google.clientID, // Specify the CLIENT_ID of the app that accesses the backend
      });
      console.log('T', ticket);
      const payload = ticket.getPayload();
      console.log('GOOGLE AUTH', payload);
      const userId = payload['sub']; // User ID from Google
      const email = payload['email'];
      console.log('GOOGLE AUTH userID', userId);
      // Check if user exists in your database; if not, create a new user entry
      const foundUser = await findUserByEmail([email] as Partial<User>);

      let accessToken: string;
      if (foundUser) {
        // Insert new user into database
        accessToken = JWT.encode({ id: foundUser.id });
        respond(res, accessToken, HttpStatus.OK);
      } else {
        const fullName = payload['name'];
        const [firstName, lastName] = fullName?.split(' ');
        const newUserPayload = {
          email,
          firstName,
          lastName
        };
        respond(res, newUserPayload, HttpStatus.OK);
      }
    } catch (error) {
      console.error('AUTH GOOGLE', error);
      if (error.message.includes('Token used too late')) {
        return respond(res, 'token has expired', HttpStatus.BAD_REQUEST);
      }
      next(error);
    }
  },

  verifyUserEmail: (): RequestHandler => async (req, res, next) => {
    // const { token } = req.params;
    // try {
    //   const decodedUser = JWT.decode(token);
    //   console.log('CdecodeUser', decodedUser);
    //   logger.info('LdecodedUser', decodedUser);
    //   const user = await findUserById([decodedUser.id] as Partial<User>);
    //   if (!user) {
    //     throw new BadRequestError('Something terrible happened');
    //   }
    //   const updatedUser = await updateIsEmailVerified([true, user.id] as Partial<User>);
    //   delete updatedUser.password;
    //   return respond<User>(res, updatedUser, HttpStatus.OK);
    // } catch (error) {
    //   console.log([`VERIFY USER EMAIL ERROR: ${error}`]);
    //   next(error);
    // }
  },

  loginUser: (): RequestHandler => async (req, res, next) => {
    let params = [req.body.email, req.body.password];
    let accessToken: string;
    try {
      const existingUser = await findUserByEmail([params[0]] as Partial<User>);
      console.log('existingUser', existingUser);
      if (!existingUser) {
        throw new ResourceNotFoundError('You may want to signup with this email');
      }
      const compare = await comparePassword(params[1], existingUser.password);

      if (!compare) {
        throw new BadRequestError('Kindly check the password');
      } else {
        accessToken = JWT.encode({ id: existingUser.id });
      }
      delete existingUser.password;
      // const foundUserImage = await fetchUserImage([existingUser.id] as Partial<User_Image>);
      // if (foundUserImage) {
      //   existingUser.image_url = foundUserImage?.image_url;
      // }
      return respond(res, { accessToken, userData: existingUser }, HttpStatus.OK);
    } catch (error) {
      console.log('LOGIN', error);
      next(error);
    }
  },

  savePushToken: (): RequestHandler => async (req, res, next) => {
    const { userId, newPushToken } = req.body;

    try {
      const updatedToken = await updateUserPushToken([newPushToken, userId] as Partial<User>);
      respond(res, updatedToken, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  },

  loginAdmin: (): RequestHandler => async (req, res, next) => {
    let params = [req.body.email, req.body.password];
    let accessToken: string;
    try {
      const existingAdmin = await findAdminByEmail([params[0]] as Partial<User>);
      console.log('existingAdmin', existingAdmin);
      if (!existingAdmin) {
        throw new ResourceNotFoundError('You may want to signup with this email');
      }
      const compare = await comparePassword(params[1], existingAdmin.password);
      console.log('compare', compare);
      if (!compare) {
        throw new BadRequestError('Kindly check the password');
      } else {
        accessToken = JWT.encode({ id: existingAdmin.id, email: existingAdmin.email });
      }
      delete existingAdmin.password;
      // const foundUserImage = await fetchUserImage([existingUser.id] as Partial<User_Image>);
      // if (foundUserImage) {
      //   existingUser.image_url = foundUserImage?.image_url;
      // }
      return respond(res, { accessToken, adminData: existingAdmin }, HttpStatus.OK);
    } catch (error) {
      console.log('LOGIN', error);
      next(error);
    }
  },

  uploadPhoto: (): RequestHandler => async (req, res, next) => {
    // try {
    //   //@ts-ignore
    //   if (!req.files) {
    //     return respond(res, 'no files attached', HttpStatus.BAD_REQUEST);
    //   }
    //   /**
    //    * if image is found for user in the DB,
    //    * delete the image on cloudinary,
    //    * also delete it in the DB
    //    * then upload a fresh image and save in the DB
    //    *
    //    * else, if no image is found for user in the DB,
    //    * then upload a fresh image.
    //    */
    //   const foundUserImage = await fetchUserImage([res.locals.user.id] as Partial<User_Image>);
    //   if (foundUserImage?.public_id) {
    //     const deletedImage = await deleteImage(foundUserImage.public_id);
    //     if (deletedImage) {
    //       await deleteUserImage([foundUserImage.public_id] as Partial<User_Image>);
    //       //@ts-ignore
    //       let image = await upload(req.files.image);
    //       //@ts-ignore
    //       const params = [res.locals.user.id, image.public_id, image.secure_url];
    //       const userData = await updateImgageURL(params as Partial<User>);
    //       removeFolder('tmp');
    //       return respond(res, userData, HttpStatus.OK);
    //     }
    //   } else {
    //     //@ts-ignore
    //     let image = await upload(req.files.image);
    //     //@ts-ignore
    //     const params = [res.locals.user.id, image.public_id, image.secure_url];
    //     const userData = await updateImgageURL(params as Partial<User>);
    //     removeFolder('tmp');
    //     return respond(res, userData, HttpStatus.OK);
    //   }
    // } catch (error) {
    //   console.log(['UPLOAD USER PHOTO'], error);
    //   next(error);
    // }
  },

  // This function manages the google authentication from the callback route
  handleGoogleAuth: (): RequestHandler => async (req, res, next) => {
    console.log('HANDLER', req.user);
    try {
      if (req.user) {
        // @ts-ignore
        const foundUser = await findUserByEmail([req.user.email] as Partial<User>);
        if (foundUser) {
          const token = JWT.encode({ id: foundUser.id });
          foundUser.accessToken = token;
          delete foundUser.password;
          return respond<User>(res, foundUser, HttpStatus.OK);
        } else {
          // @ts-ignore
          const { email, firstName, lastName } = req.user;
          // const params = [
          //   firstName,
          //   lastName,
          //   null,
          //   email,
          //   null,
          //   null,
          //   null,
          //   null,
          //   null,
          // ];
          // const newUser = await createUser(params as Partial<User>);
          // const accessToken = JWT.encode({ id: newUser.id });
          // newUser.accessToken = accessToken;
          return respond(res, { email, firstName, lastName }, HttpStatus.OK);
        }
      } else {
        return respond(res, 'error sign in with google auth', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      console.log('[GOOGLE SOCIAL AUTH ERROR]', error);
      logger.error('[GOOGLE SOCIAL AUTH ERROR]', error);
      next(error);
    }
  },

  createUserWithGoogleAuth: (): RequestHandler => async (req, res, next) => {
    let params = [
      req.body.first_name,
      req.body.last_name,
      req.body.phone_number,
      req.body.email,
      (req.body.password = null),
      req.body.age,
      req.body.state,
      req.body.city,
      req.body.address
    ];

    try {
      const existingUser = await findUserByEmail([req.body.email] as Partial<User>);
      if (existingUser) {
        throw new ConflictError('email already exists');
      }
      let user: User;
      user = await createUser(params as Partial<User>);
      const accessToken = JWT.encode({ id: user.id });
      respond(res, { accessToken, user }, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  },

  /**
   * if email is not returned, re-route user to traditional login
   */
  // This function manages the facebook authentication from the callback route
  // handleFacebookAuth: (): RequestHandler => async (req, res, next) => {
  //   try {
  //     if (req.user) {
  //       // @ts-ignore
  //       const foundUser = await findUserByEmail([req.user.email] as Partial<User>);
  //       if (foundUser) {
  //         const token = JWT.encode({ id: foundUser.id });
  //         foundUser.accessToken = token;
  //         delete foundUser.password;
  //         return respond<User>(res, foundUser, HttpStatus.OK);
  //       } else {
  //         // @ts-ignore
  //         const { email, firstName, lastName } = req.user;
  //         const params = [email, null, firstName, lastName, null];
  //         const newUser = await createUser(params as Partial<User>);
  //         const accessToken = JWT.encode({ id: newUser.id });
  //         newUser.accessToken = accessToken;
  //         return respond<User>(res, newUser, HttpStatus.OK);
  //       }
  //     } else {
  //       return respond(res, 'error sign in with facebook auth', HttpStatus.BAD_REQUEST);
  //     }
  //   } catch (error) {
  //     console.log('[FACEBOOK SOCIAL AUTH ERROR]', error);
  //     logger.error('[FACEBOOK SOCIAL AUTH ERROR]', error);
  //     next(error);
  //   }
  // },

  forgotPassword: (): RequestHandler => async (req, res, next) => {
    const { email } = req.body;
    try {
      const foundUser = await findUserByEmail([email] as Partial<User>);
      if (!foundUser) {
        throw new BadRequestError('the number you are calling is not available');
      } else {
        // send otp
        const smsSent = await sendOtpToUser(foundUser?.phone_number);

        if (smsSent === SMS_STATUS.PENDING) {
          return respond(res, 'sms was successfully sent', HttpStatus.OK);
        } else {
          return respond(res, 'there was a problem sending the sms', HttpStatus.EXPECTATION_FAILED);
        }
      }
    } catch (error) {
      next(error);
    }
  },

  acceptNewPassword: (): RequestHandler => async (req, res, next) => {
    const { email, newPassword } = req.body;
    let updatedUser: User;
    try {
      const foundUser = await findUserByEmail([email] as Partial<User>);
      if (!foundUser) {
        throw new BadRequestError('account does not exist');
      } else {
        const newPass = await hashPassword(newPassword);
        updatedUser = await updateUserPassword([newPass, foundUser.id] as Partial<User>);
        delete updatedUser.password;
      }
      return respond(res, { message: 'Password updated successfully', updatedUser }, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  },

  changePassword: (): RequestHandler => async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    const userId = res.locals.user.id;
    try {
      const user = await findUserById([userId] as Partial<User>);
      if (!user) {
        throw new BadRequestError('no user was found for this account');
      }
      const compare = await comparePassword(currentPassword, user.password);
      if (!compare) {
        throw new BadRequestError('old password is incorrect');
      }
      const newPass = await hashPassword(newPassword);
      const updatedUser = await updateUserPassword([newPass, userId] as Partial<User>);
      delete updatedUser.password;
      return respond(res, { message: 'Password updated successfully', updatedUser }, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  },

  updateUser: (): RequestHandler => async (req, res, next) => {
    // try {
    //   const userId = res.locals.user.id;
    //   const foundUser = await findUserById([userId] as Partial<User>);
    //   if (!foundUser) {
    //     return respond(res, 'unknown user', HttpStatus.BAD_REQUEST);
    //   } else {
    //     const params = [req.body.email || foundUser.email, userId];
    //     const updatedUser = await updateUserEmail(params as Partial<User>);
    //     delete updatedUser.password;
    //     const foundUserImage = await fetchUserImage([updatedUser.id] as Partial<User_Image>);
    //     if (foundUserImage) {
    //       updatedUser.image_url = foundUserImage?.image_url;
    //     }
    //     return respond(res, { message: 'Email updated successfully', updatedUser }, HttpStatus.OK);
    //   }
    // } catch (error) {
    //   console.log([`UPDATE USER ERROR: ${error}`]);
    //   next(error);
    // }
  },

  // deactivateAccount: (): RequestHandler => async (req, res, next) => {
  //   const userId = res.locals.user.id;

  //   try {
  //     const userBookings = await findBookingsForUser([userId] as Partial<Booking>);
  //     const userListings = await findListingsForUser([userId] as Partial<Listing>);
  //     if (
  //       (userBookings?.length &&
  //         userBookings?.some((booking) =>
  //           [BOOKING_STATUS.AWAITING_PAYMENT, BOOKING_STATUS.AWAITING_PICKUP, BOOKING_STATUS.CURRENTLY_IN_USE].includes(
  //             booking.rental_status as BOOKING_STATUS
  //           )
  //         )) ||
  //       (userListings?.length &&
  //         userListings?.some((listing) => [LISTING_STATUS.RENTED, LISTING_STATUS.REQUESTED].includes(listing.status as LISTING_STATUS)))
  //     ) {
  //       return respond(res, 'unable to deactivate account because you have a running booking or listing', HttpStatus.BAD_REQUEST);
  //     } else {
  //       const deactivationDate = new Date();
  //       const deletionDate = new Date(deactivationDate);
  //       deletionDate.setDate(deactivationDate.getDate() + 30);

  //       const updatedUser = await deactivateUser([deactivationDate, deletionDate, userId] as Partial<User>);

  //       if (!updatedUser) {
  //         return respond(res, 'User not found', HttpStatus.NOT_FOUND);
  //       }
  //       delete updatedUser.password;
  //       const smsBody = `Your account has been deactivated. If you do not log in within the next 30 days, your account will be permanently deleted. If you wish to keep your account, simply log in within the next 30 days.`;
  //       await sendSmsToUser(smsBody, updatedUser?.phone_number);
  //       const emailTemplate = accountDeactivationTemplate(updatedUser?.first_name, updatedUser?.email);
  //       transporter(emailTemplate);
  //       return respond(res, { message: 'Account Deactivated', user: updatedUser }, HttpStatus.OK);
  //     }
  //   } catch (error) {
  //     next(error);
  //   }
  // },

  // reactivateAccount: (): RequestHandler => async (req, res, next) => {
  //   const userId = res.locals.user.id;

  //   try {
  //     const foundUser = await selectToReactivateUser([userId] as Partial<User>);
  //     if (!foundUser) {
  //       return respond(res, 'User not found', HttpStatus.NOT_FOUND);
  //     }

  //     if (foundUser.is_active) {
  //       return respond(res, 'Account is already active', HttpStatus.OK);
  //     }

  //     const currentTime = new Date();

  //     if (currentTime <= foundUser.deletion_scheduled_at) {
  //       // Reactivate account
  //       const reactivatedUser = await reactivateUser([userId] as Partial<User>);
  //       const smsBody = 'Your account has been re-activated. Kindly login to enjoy other services.';
  //       sendSmsToUser(smsBody, foundUser?.phone_number);
  //       const emailTemplate = accountActivationTemplate(reactivatedUser?.first_name, reactivatedUser?.email);
  //       transporter(emailTemplate);

  //       delete reactivatedUser.password;

  //       return respond(res, { message: 'Account Activated', user: reactivatedUser }, HttpStatus.OK);
  //     } else {
  //       return respond(res, 'Account scheduled for deletion, cannot reactivate', HttpStatus.BAD_REQUEST);
  //     }
  //   } catch (error) {
  //     next(error);
  //   }
  // }
  createAddress: (): RequestHandler => async (req, res, next) => {
    const userId = res.locals.user.id;
    const { title, state, city, address } = req.body;
    const params = [userId, title, state, city, address];

    try {
      const newAddress = await createAddress(params as Partial<Address>);
      return respond(res, newAddress, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  },

  createContactUS: (): RequestHandler => async (req, res, next) => {
    const userId = res.locals.user.id;
    const { subject, message } = req.body;
    const params = [userId, subject, message];

    try {
      const newContactUS = await createContactUS(params as Partial<Contact_US>);
      return respond(res, newContactUS, HttpStatus.CREATED);
    } catch (error) {
      next(error);
    }
  },

  getContactUsMessages: (): RequestHandler => async (req, res, next) => {
    try {
      const { page = 1, limit = 10 } = req.query; // Default: page 1, 10 results per page
      const offset = (Number(page) - 1) * Number(limit);

      const query = `
      SELECT 
          cu.id AS contact_id, 
          cu.subject, 
          cu.message, 
          cu.created_at, 
          cu.updated_at,
          u.email, 
          u.phone_number
      FROM contact_us cu
      JOIN users u ON cu.user_id = u.id
      ORDER BY cu.created_at DESC
      LIMIT $1 OFFSET $2;
    `;

      const { rows } = await pool.query(query, [Number(limit), offset]);

      return respond(res, { currentPage: Number(page), perPage: Number(limit), data: rows }, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  },

  getUserAddresses: (): RequestHandler => async (req, res, next) => {
    try {
      const userId = res.locals.user.id;

      const query = `
        SELECT 
            u.id AS user_id,
            u.state AS primary_state,
            u.city AS primary_city,
            u.address AS primary_address,
            json_agg(
                json_build_object(
                    'id', a.id,
                    'title', a.title,
                    'state', a.state,
                    'city', a.city,
                    'address', a.address,
                    'created_at', a.created_at,
                    'updated_at', a.updated_at
                )
            ) FILTER (WHERE a.id IS NOT NULL) AS secondary_addresses
        FROM users u
        LEFT JOIN addresses a ON u.id = a.user_id
        WHERE u.id = $1
        GROUP BY u.id, u.state, u.city, u.address;
      `;

      const { rows } = await pool.query(query, [userId]);

      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      return respond(
        res,
        {
          user_id: rows[0].user_id,
          primary_address: {
            state: rows[0].primary_state,
            city: rows[0].primary_city,
            address: rows[0].primary_address
          },
          secondary_addresses: rows[0].secondary_addresses || []
        },
        HttpStatus.OK
      );
    } catch (error) {
      console.error('Error fetching addresses:', error);
      next(error);
    }
  },

  fetchUsers: (): RequestHandler => async (req, res, next) => {
    try {
      const { search, is_active } = req.query;

      const searchTerm: string | null = search ? String(search) : null;

      let activeFilter: boolean | null = null;

      if (typeof is_active === 'string') {
        if (is_active.toLowerCase() === 'true') {
          activeFilter = true;
        } else if (is_active.toLowerCase() === 'false') {
          activeFilter = false;
        }
      }

      const query = `
        SELECT 
          CONCAT(first_name, ' ', last_name) AS name,
          email, 
          phone_number, 
          is_active 
        FROM users
        WHERE 
          ($1::text IS NULL OR 
            email ILIKE '%' || $1 || '%' OR
            phone_number ILIKE '%' || $1 || '%' OR
            first_name ILIKE '%' || $1 || '%' OR
            last_name ILIKE '%' || $1 || '%')
          AND ($2::boolean IS NULL OR is_active = $2::boolean)
        ORDER BY created_at DESC;
      `;

      console.log({searchTerm, activeFilter})
      const params = [searchTerm, activeFilter];
      const { rows } = await pool.query(query, params);

      return respond(res, { data: rows }, HttpStatus.OK);
    } catch (error) {
      console.error('Error fetching users:', error);
      next(error);
    }
  }
};

/**
 * endpoint to fetch primary and secondary addresses
 * user should not be able to see food items
 * with allergies they have chosen
 */
