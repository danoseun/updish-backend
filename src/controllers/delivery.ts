import { Driver } from '@src/interfaces';
import { findDriverById } from '../repository/user';
import { RequestHandler } from 'express';
import HttpStatus from 'http-status-codes';
import { BadRequestError, ResourceNotFoundError } from '../errors';
import { generateDeliveryTripCode, respond } from '../utilities';
import pool from '../config/database.config';
import { sql } from '../database/sql';
import { createDeliveryNotes } from '../repository/order';
import { DELIVERY_NOTES_STATUS, DELIVERY_TRIPS_STATUS } from '@src/constants';

export const DeliveryController = {
  createDeliveryNotes: (): RequestHandler => async (req, res, next) => {
    try {
      const client = await pool.connect();

      const orderId = req.params.orderId;
      const userId = res.locals.user.id;

      const deliveryNotes = await createDeliveryNotes(client, userId, orderId);

      return respond(res, { message: 'Delivery notes created', data: deliveryNotes }, HttpStatus.OK);
    } catch (error) {
      console.error('Error in someOtherEndpoint:', error);
      next(error);
    }
  },

  fetchDeliveryNotes: (): RequestHandler => async (req, res, next) => {
    try {
      const { date, delivery_time } = req.query;

      if (!date || !delivery_time) {
        return respond(res, { message: 'Both date and delivery_time must be provided' }, HttpStatus.BAD_REQUEST);
      }

      const deliveryNotesResults = await pool.query(sql.fetchDeliveryNotes, [date, delivery_time, DELIVERY_NOTES_STATUS.PENDING]);

      return respond(res, { message: 'Delivery notes fetched successfully', data: deliveryNotesResults.rows }, HttpStatus.OK);
    } catch (error) {
      console.error('Error in someOtherEndpoint:', error);
      next(error);
    }
  },

  createDeliveryTrips: (): RequestHandler => async (req, res, next) => {
    const { ids } = req.body;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return respond(res, { message: 'No ids provided' }, HttpStatus.BAD_REQUEST);
      }

      // Validate that all provided ids exist in the delivery_notes table
      const checkQuery = 'SELECT id FROM delivery_notes WHERE id = ANY($1::int[])';
      const checkResult = await client.query(checkQuery, [ids]);
      const foundIds = checkResult.rows.map((row) => row.id);

      if (foundIds.length !== ids.length) {
        throw new ResourceNotFoundError('Some provided delivery note ids do not exist');
      }

      const deliveryTripCode = generateDeliveryTripCode();

      const deliveryTripResult = await client.query(sql.createDeliveryTrip, [deliveryTripCode]);
      const deliveryTripId = deliveryTripResult.rows[0].id;

      //   Update delivery notes with delivery_trip_id
      const query = `
        UPDATE delivery_notes
        SET status = $1,
            delivery_trip_id = $2,
            updated_at = now()
        WHERE id = ANY($3::int[])
        RETURNING *
        `;

      const result = await client.query(query, [DELIVERY_NOTES_STATUS.SUBMITTED, deliveryTripId, ids]);
      await client.query('COMMIT');
      return respond(res, { data: result.rows }, HttpStatus.CREATED);
    } catch (error) {
      await client.query('ROLLBACK');
      console.log({ error });
      next(error);
    } finally {
      client.release();
    }
  },

  assignDeliveryTripToDriver: (): RequestHandler => async (req, res, next) => {
    try {
      const { driverId, deliveryTripCode } = req.body;
      const existingDriver = await findDriverById([driverId] as Partial<Driver>);
      if (!existingDriver) {
        throw new ResourceNotFoundError('driver does not exist on our system');
      }

      const deliveryTrip = await pool.query('SELECT * FROM delivery_trips WHERE code = $1', [deliveryTripCode]);
      if (!deliveryTrip || !deliveryTrip.rows.length) {
        throw new ResourceNotFoundError('No delivery trip found for this code');
      }

      if (deliveryTrip.rows[0].status != DELIVERY_TRIPS_STATUS.DRAFT) {
        throw new BadRequestError('Delivery trip must have a draft status');
      }

      const deliveryTripId = deliveryTrip.rows[0].id;

      const query = `
        UPDATE delivery_trips
        SET status = $1,
            driver_id = $2,
            updated_at = now()
        WHERE id = $3
        RETURNING *
        `;

      const result = await pool.query(query, [DELIVERY_TRIPS_STATUS.PUBLISHED, driverId, deliveryTripId]);
      return respond(res, { data: result.rows }, HttpStatus.OK);
    } catch (error) {
      console.error('Error in someOtherEndpoint:', error);
      next(error);
    }
  },

  fetchDeliveryTripsByDriver: (): RequestHandler => async (req, res, next) => {
    try {
      const driverId = res.locals.user.id;
      const deliveryTripsResults = await pool.query(sql.fetchAssignedDeliveryTrips, [driverId, DELIVERY_TRIPS_STATUS.PUBLISHED]);

      // if (!deliveryTripsResults || !deliveryTripsResults.rows.length) {
      //   return respond(res, { message: 'No delivery trip found' }, HttpStatus.NOT_FOUND);
      // }

      respond(res, { message: 'Delivery trips fetched successfully', data: deliveryTripsResults.rows }, HttpStatus.OK);
    } catch (error) {
      console.error('Error in someOtherEndpoint:', error);
      next(error);
    }
  },

  fetchDeliveryNotesByTripCode: (): RequestHandler => async (req, res, next) => {
    try {
      const deliveryTripCode = req.params.code;
      const deliveryTrip = await pool.query('SELECT * FROM delivery_trips WHERE code = $1', [deliveryTripCode]);

      if (!deliveryTrip || !deliveryTrip.rows.length) {
        return respond(res, { message: 'No delivery trip found for this code' }, HttpStatus.NOT_FOUND);
      }

      const deliveryTripId = deliveryTrip.rows[0].id;

      const deliveryNotesResults = await pool.query(sql.fetchDeliveryNotesByTrip, [deliveryTripId]);

      if (!deliveryNotesResults || !deliveryNotesResults.rows.length) {
        return respond(res, { message: 'No delivery notes found for this trip' }, HttpStatus.NOT_FOUND);
      }

      respond(res, { message: 'Delivery notes fetched successfully', data: deliveryNotesResults.rows }, HttpStatus.OK);
    } catch (error) {
      console.error('Error in someOtherEndpoint:', error);
      next(error);
    }
  }
};
