import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { respond } from '../utilities';
import { celebrate, Joi, Segments } from 'celebrate';

const extrasSchema = Joi.array().items(
  Joi.object({
    id: Joi.number().required(),
    name: Joi.string().required(),
    price: Joi.number().required(),
  })
);

// Define schema for each meal object
const orderSchema = Joi.object({
  date: Joi.date().iso().required(),
  category: Joi.string().valid('Breakfast', 'Lunch', 'Dinner').required(),
  bundleId: Joi.number().required(),
  //delivery_time: Joi.string().pattern(/^\d{1,2}:\d{2} [APap][Mm] - \d{1,2}:\d{2} [APap][Mm]$/).required(),
  delivery_time: Joi.string().required(),
  quantity: Joi.number().min(1).required(),
  address: Joi.string().required(),
  extras: extrasSchema,
  price: Joi.number().min(0).required(),
});

// Define schema for the main array of meals
const mealSchema = Joi.array().items(orderSchema).required();

// Function to validate the request body
export const orderCreationSchema = (req: Request, res: Response, next: NextFunction) => {
  const { error } = mealSchema.validate(req.body.meals);
  if (error) {
    return respond(res, { error: error.details }, HttpStatus.BAD_REQUEST);
  }
  next();
};

