import dotenv from 'dotenv';
import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import {
  createUser,
  updateIsEmailVerified,
  findPhoneNumber,
  updateUserPhoneNumber,
  fetchUserImage,
  deleteUserImage,
  updateImgageURL,
  findUserByEmail,
  findUserById,
  updateUserPassword,
  updateUserEmail,
  deactivateUser,
  selectToReactivateUser,
  reactivateUser
} from '../repository/user';
import { BadRequestError, ConflictError, ResourceNotFoundError } from '../errors';
import type { User, User_Image } from '../interfaces';
import { SMS_STATUS } from '../constants';
import {
  hashPassword,
  comparePassword,
  respond,
  JWT,
//   upload,
//   removeFolder,
  sendOtpToUser,
  verifyOtp,
  logger,
//   deleteImage,
//   nanoid,
//   sendSmsToUser
} from '../utilities';
// import {
//   accountVerificationTemplate,
//   accountDeactivationTemplate,
//   accountActivationTemplate,
//   transporter,
//   makeAccountVerificationToken,
//   getActivationLinkURL,
//   getForgotPasswordUrl
// } from '../services/email';


dotenv.config();

export const UserController = {

  sendOtpToPhoneNumber: (): RequestHandler => async (req, res, next) => {
    const { phone_number } = req.body;
    const params = [phone_number];
    try {
      const foundUser = await findPhoneNumber(params as Partial<User>);

      if (foundUser) {
        throw new ConflictError('phone number is in use');
      }

      const smsSent = await sendOtpToUser(phone_number);

      if (smsSent === SMS_STATUS.PENDING) {
        return respond(res, 'sms was successfully sent', HttpStatus.OK);
      } else {
        return respond(res, 'there was a problem sending the sms', HttpStatus.EXPECTATION_FAILED);
      }
    } catch (error) {
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

  createUserWithPhoneNumber: (): RequestHandler => async (req, res, next) => {
    let params = [req.body.first_name, req.body.last_name, req.body.email, req.body.password, req.body.age, req.body.state, req.body.city, req.body.address];
    // let params = [req.body.email, req.body.password, req.body.firstname, req.body.lastname, req.body.bio];

    // try {
    //   const existingUser = await findUserByEmail([params[0]] as Partial<User>);

    //   if (existingUser) {
    //     throw new ConflictError('User already exists');
    //   }
    //   let user: User;

    //   params[1] = await hashPassword(req.body.password);
    //   user = await createUser(params as Partial<User>);
    //   const accessToken = JWT.encode({ id: user.id });
    //   user.accessToken = accessToken;

    //   //send verification email to user
    //   const token = makeAccountVerificationToken(user);
    //   const url = getActivationLinkURL(token);
    //   const emailTemplate = accountVerificationTemplate(user, url);
    //   transporter(emailTemplate, res);
    //   respond<User>(res, user, HttpStatus.CREATED);
    //   return;
    // } catch (error) {
    //   next(error);
    // }
    try {
      const existingUser = await findUserByEmail([req.body.email] as Partial<User>);
      if(existingUser){
        throw new ConflictError('email already exists');
      }
      let user: User;
      params[3] = await hashPassword(req.body.password);
      user = await createUser(params as Partial<User>);

      respond<User>(res, user, HttpStatus.CREATED);
    } catch (error) {
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
      const foundUserImage = await fetchUserImage([existingUser.id] as Partial<User_Image>);
      if (foundUserImage) {
        existingUser.image_url = foundUserImage?.image_url;
      }
      return respond(res, { accessToken, userData: existingUser }, HttpStatus.OK);
    } catch (error) {
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
          const params = [email, null, firstName, lastName, null];
          const newUser = await createUser(params as Partial<User>);
          const accessToken = JWT.encode({ id: newUser.id });
          newUser.accessToken = accessToken;
          return respond<User>(res, newUser, HttpStatus.OK);
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

  /**
   * if email is not returned, re-route user to traditional login
   */
  // This function manages the facebook authentication from the callback route
  handleFacebookAuth: (): RequestHandler => async (req, res, next) => {
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
          const params = [email, null, firstName, lastName, null];
          const newUser = await createUser(params as Partial<User>);
          const accessToken = JWT.encode({ id: newUser.id });
          newUser.accessToken = accessToken;
          return respond<User>(res, newUser, HttpStatus.OK);
        }
      } else {
        return respond(res, 'error sign in with facebook auth', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      console.log('[FACEBOOK SOCIAL AUTH ERROR]', error);
      logger.error('[FACEBOOK SOCIAL AUTH ERROR]', error);
      next(error);
    }
  },

  forgotPassword: (): RequestHandler => async (req, res, next) => {
    // const { email } = req.body;
    // try {
    //   const foundUser = await findUserByEmail([email] as Partial<User>);
    //   if (!foundUser) {
    //     throw new BadRequestError('the number you are calling is not available');
    //   } else {
    //     // send email
    //     const token = makeAccountVerificationToken(foundUser);
    //     const url = getForgotPasswordUrl(token);
    //     const emailTemplate = accountVerificationTemplate(foundUser, url);
    //     transporter(emailTemplate, res);
    //     delete foundUser.password;
    //     respond<User>(res, foundUser, HttpStatus.OK);
    //   }
    // } catch (error) {
    //   next(error);
    // }
  },

  acceptNewPassword: (): RequestHandler => async (req, res, next) => {
    // const { token } = req.query;
    // const { newPassword } = req.body;
    // try {
    //   const decodedUser = JWT.decode(token as string);
    //   console.log('CdecodeUser', decodedUser);
    //   const user = await findUserById([decodedUser.id] as Partial<User>);
    //   if (!user) {
    //     throw new BadRequestError('Something terrible happened');
    //   }
    //   const newPass = await hashPassword(newPassword);
    //   const updatedUser = await updateUserPassword([newPass, user.id] as Partial<User>);
    //   delete updatedUser.password;
    //   return respond(res, { message: 'Password updated successfully', updatedUser }, HttpStatus.OK);
    // } catch (error) {
    //   next(error);
    // }
  },

  updatePassword: (): RequestHandler => async (req, res, next) => {
    // const { oldPassword, newPassword } = req.body;
    // const userId = res.locals.user.id;

    // try {
    //   const user = await findUserById([userId] as Partial<User>);

    //   if (!user) {
    //     throw new BadRequestError('no user was found for this account');
    //   }

    //   const compare = await comparePassword(oldPassword, user.password);

    //   if (!compare) {
    //     throw new BadRequestError('old password is incorrect');
    //   }
    //   const newPass = await hashPassword(newPassword);
    //   const updatedUser = await updateUserPassword([newPass, userId] as Partial<User>);
    //   delete updatedUser.password;
    //   return respond(res, { message: 'Password updated successfully', updatedUser }, HttpStatus.OK);
    // } catch (error) {
    //   next(error);
    // }
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
};
