import { Driver } from '@src/interfaces';
import { createDriver, findDriverByEmail, findDriverById, updateDriverPassword } from '../repository/user';
import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import { BadRequestError, ConflictError, ResourceNotFoundError } from '../errors';
import { JWT, comparePassword, generateRandomPassword, hashPassword, respond } from '../utilities';
import { emailSender } from '../utilities/email.utility';
import pool from '../config/database.config';
import { DELIVERY_NOTES_STATUS, DELIVERY_TRIPS_STATUS, ORDER_STATUS } from '@src/constants';

export const DriverController = {
  createDriver: (): RequestHandler => async (req, res, next) => {
    const { first_name, last_name, email, phone_number, third_party_logistics } = req.body;
    try {
      const existingUser = await findDriverByEmail([email] as Partial<Driver>);

      if (existingUser) {
        throw new ConflictError('email already exists');
      }

      const generatedPassword = generateRandomPassword(10);
      const hashedPassword = await hashPassword(generatedPassword);
      console.log({ generatedPassword, hashedPassword });

      let params = [email, first_name, last_name, hashedPassword, phone_number, third_party_logistics];

      const driver = await createDriver(params as Partial<Driver>);
      console.log({ driver });
      //   send password to driver email
      // await emailSender({
      //   subject: 'Welcome to Updish!',
      //   text: `Hello, ${driver.first_name}. Here is your password ${generatedPassword}. Proceed to log in on the app`,
      //   recipientMail: driver.email
      // });
      respond<Driver>(res, driver, HttpStatus.CREATED);
    } catch (error) {
      console.log({ error });
      next(error);
    }
  },

  changeDriverPassword: (): RequestHandler => async (req, res, next) => {
    try {
      const driverId = res.locals.user.id;
      const { oldPassword, newPassword } = req.body;

      const foundDriver = await findDriverById([driverId] as Partial<Driver>);

      if (!foundDriver) {
        throw new BadRequestError('driver not found');
      }

      const compare = await comparePassword(oldPassword, foundDriver.password);
      if (!compare) {
        throw new BadRequestError('old password is incorrect');
      }

      const hashedPassword = await hashPassword(newPassword);
      const updatedDriver = await updateDriverPassword([hashedPassword, true, driverId] as Partial<Driver>);
      delete updatedDriver.password;
      return respond(res, { message: 'Password updated successfully', updatedDriver }, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  },

  loginDriver: (): RequestHandler => async (req, res, next) => {
    let params = [req.body.email, req.body.password];
    let accessToken: string;
    try {
      const existingDriver = await findDriverByEmail([params[0]] as Partial<Driver>);
      console.log('existingDriver', existingDriver);

      if (!existingDriver) {
        throw new ResourceNotFoundError('You may want to signup with this email');
      }

      const compare = await comparePassword(params[1], existingDriver.password);
      console.log('compare', compare);
      if (!compare) {
        throw new BadRequestError('Kindly check the password');
      } else {
        accessToken = JWT.encode<Driver>({ id: existingDriver.id, email: existingDriver.email });
      }

      delete existingDriver.password;

      return respond(res, { accessToken, adminData: existingDriver }, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  },

  fetchDrivers: (): RequestHandler => async (req, res, next) => {
    try {
      const { searchTerm } = req.query;

      let query = 'SELECT email, first_name, last_name, phone_number, third_party_logistics FROM drivers';
      const params: any[] = [];

      if (searchTerm) {
        query += ' WHERE email ILIKE $1';
        params.push(`%${searchTerm}%`);
      }

      const { rows } = await pool.query(query, params);

      return respond(res, { message: 'Drivers fetched successfully', data: rows }, HttpStatus.OK);
    } catch (error) {
      next(error);
    }
  },

  acceptOrRejectDeliveryTripByDriver: (): RequestHandler => async (req, res, next) => {
    const { isAccept, deliveryTripCode } = req.query;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (!isAccept || !deliveryTripCode) {
        return respond(res, 'Both deliveryTripCode and isAccept must be provided', HttpStatus.BAD_REQUEST);
      }

      const deliveryTrip = await client.query(
        `SELECT dt.id AS delivery_trip_id, dn.id AS delivery_note_id, dn.order_id AS order_id, dt.status AS status FROM delivery_trips dt
          JOIN delivery_notes dn ON dt.id = dn.delivery_trip_id
          WHERE dt.code = $1`,
        [deliveryTripCode]
      );

      if (!deliveryTrip || !deliveryTrip.rows.length) {
        throw new ResourceNotFoundError('No delivery trip found for this code');
      }

      if (deliveryTrip.rows[0].status != DELIVERY_TRIPS_STATUS.PUBLISHED) {
        throw new BadRequestError('Delivery trip is not in the right status');
      }

      const deliveryTripId = deliveryTrip.rows[0].delivery_trip_id;

      let deliveryTripStatus: string;

      if (isAccept == 'true') {
        deliveryTripStatus = DELIVERY_TRIPS_STATUS.DISPATCHED;

        // update delivery notes to 'dispatched'
        const deliveryNoteIds = deliveryTrip.rows.map((each) => each.delivery_note_id);
        console.log({ deliveryNoteIds });
        const deliveryNoteUpdateQuery = `
        UPDATE delivery_notes
        SET status = $1,
            updated_at = now()
        WHERE id = ANY($2::int[])
        RETURNING *
        `;

        await client.query(deliveryNoteUpdateQuery, [DELIVERY_NOTES_STATUS.DISPATCHED, deliveryNoteIds]);

        // update order status to delivering
        // get unique orders for the case of "at_once" delivery
        const uniqueOrderIds = [...new Set(deliveryTrip.rows.map((each) => each.order_id))];
        console.log({ uniqueOrderIds });
        const ordersUpdateQuery = `
        UPDATE orders
        SET status = $1,
            updated_at = now()
        WHERE id = ANY($2::int[])
        RETURNING *
        `;
        await client.query(ordersUpdateQuery, [ORDER_STATUS.DELIVERING, uniqueOrderIds]);
      } else if (isAccept == 'false') {
        deliveryTripStatus = DELIVERY_TRIPS_STATUS.REJECTED;
      }

      // update delivery trip to 'dispatched' or 'rejected'
      const deliveryTripUpdateQuery = `
        UPDATE delivery_trips
          SET status = $1,
          updated_at = now()
        WHERE id = $2
      `;

      const updatedDeliveryTrip = await client.query(deliveryTripUpdateQuery, [deliveryTripStatus, deliveryTripId]);

      await client.query('COMMIT');
      respond(res, { message: 'Delivery trip updated successfully', data: updatedDeliveryTrip.rows[0] }, HttpStatus.OK);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating delivery trip:', error);
      next(error);
    } finally {
      client.release();
    }
  },

  confirmDelivery: (): RequestHandler => async (req, res, next) => {
    const { driverId, deliveryNoteCode } = req.query;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const deliveryNote = await client.query('SELECT * FROM delivery_notes WHERE code = $1', [deliveryNoteCode]);
      if (!deliveryNote || !deliveryNote.rows.length) {
        throw new ResourceNotFoundError('No delivery trip found for this code');
      }

      if (deliveryNote.rows[0].status != DELIVERY_NOTES_STATUS.DISPATCHED) {
        throw new BadRequestError('Delivery note must be in "Dispatched" state');
      }

      const deliveryNoteId = deliveryNote.rows[0].id;

      // update delivery note to delivered
      const deliveryNoteUpdateQuery = `
        UPDATE delivery_notes
        SET status = $1,
            updated_at = now()
        WHERE id = $2
        RETURNING *
        `;

      const updatedDeliveryNote = await client.query(deliveryNoteUpdateQuery, [DELIVERY_NOTES_STATUS.DELIVERED, deliveryNoteId]);

      const orderId = updatedDeliveryNote.rows[0].order_id;
      const deliveryTripId = updatedDeliveryNote.rows[0].delivery_trip_id;

      // check if the delivered meal is the last meal for an order and update order to completed
      const notDeliveredMealsForOrderQuery = `SELECT * FROM delivery_notes WHERE order_id = $1 AND status <> $2`;
      const notDeliveredMealsForOrderResult = await client.query(notDeliveredMealsForOrderQuery, [orderId, DELIVERY_NOTES_STATUS.DELIVERED]);
      if (!notDeliveredMealsForOrderResult.rows.length) {
        // means all meals in the order have been delivered
        const updateOrderQuery = `
        UPDATE orders
        SET status = $1,
            updated_at = now()
        WHERE id = $2
        RETURNING *
        `;
        await client.query(updateOrderQuery, [ORDER_STATUS.COMPLETED, orderId]);
      }

      // check if all delivery notes in the trip have been delivered and update to "delivered"
      const notDeliveredNotesForTripQuery = `SELECT * FROM delivery_notes WHERE delivery_trip_id = $1 AND status <> $2`;
      const notDeliveredNotesForTripResult = await client.query(notDeliveredNotesForTripQuery, [deliveryTripId, DELIVERY_NOTES_STATUS.DELIVERED]);
      if (!notDeliveredNotesForTripResult.rows.length) {
        // means all delivery notes in the trip have been delivered
        const updateDeliveryTripQuery = `
        UPDATE delivery_trips
        SET status = $1,
            updated_at = now()
        WHERE id = $2
        RETURNING *
        `;
        await client.query(updateDeliveryTripQuery, [DELIVERY_TRIPS_STATUS.DELIVERED, deliveryTripId]);
      }

      await client.query('COMMIT');
      return respond(res, { message: 'Delivery note delivered', data: updatedDeliveryNote.rows[0] }, HttpStatus.OK);
    } catch (error) {
      await client.query('ROLLBACK');
      console.log({ error });
      next(error);
    } finally {
      client.release();
    }
  }
};
