import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { respond } from '../utilities';
import { celebrate, Joi, Segments } from 'celebrate';

export const createItemSchema = celebrate(
  {
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string().required().trim(),
      uom: Joi.string().required(),
      description: Joi.string(),
      allergies: Joi.string().trim().required(),
      class_of_food: Joi.string().trim().required(),
      calories_per_uom: Joi.string().trim().required(),
      parent_item: Joi.number().required(),
      is_active: Joi.boolean()
    })
  },
  {
    abortEarly: false
  }
);

export const createParentItemSchema = celebrate(
  {
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string().required().trim()
    })
  },
  {
    abortEarly: false
  }
);

export const toggleItemStatusSchema = celebrate({
  [Segments.BODY]: Joi.object().keys({
    is_active: Joi.boolean().required()
  }),
  [Segments.PARAMS]: Joi.object().keys({
    id: Joi.number().required()
  })
});

export const findItemByIdDetailedSchema = celebrate({
  [Segments.PARAMS]: Joi.object().keys({
    id: Joi.number().required()
  })
});

const schema = Joi.object({
  name: Joi.string().required(),
  items: Joi.string().required(), // Items will be a string containing a JSON array
  health_impact: Joi.string().required(), // Health impact will be a string of comma-separated values
  price: Joi.string().pattern(/^\d+(\.\d{1,2})?$/).required(),
  category: Joi.string().valid('Breakfast', 'Lunch', 'Dinner').required(),
  is_active: Joi.boolean().required(),
  is_extra: Joi.boolean().optional() // Optional is_extra field
});

// Middleware for validation and parsing
export function createBundleSchema(req: Request, res: Response, next: NextFunction) {
  // Validate the non-file fields (text)
  console.log('REQ', req.body);
  const { error, value } = schema.validate(req.body);

  if (error) {
    return respond(res, { error: error.details }, HttpStatus.BAD_REQUEST);
  }

  try {
    // Parse the items field from string to an array of objects
    const items = JSON.parse(value.items);

    if (!Array.isArray(items)) {
      throw new Error('Items should be an array.');
    }

    // Check for the 'is_extra' flag and validate items array if it's true
    if (value.is_extra && value.is_extra === true && items.length !== 1) {
      return respond(res, { error: 'If is_extra is true, the items array must contain only one item.' }, HttpStatus.BAD_REQUEST);
    }

    // Validate each item in the array
    for (const item of items) {
      if (!item.item || typeof item.item !== 'number' || !item.qty || typeof item.qty !== 'number') {
        return respond(res, { error: 'Each item must have a valid item ID and quantity.' }, HttpStatus.BAD_REQUEST);
      }
    }

    // Parse the health_impact field
    const impacts = JSON.parse(value.health_impact);

    if (!Array.isArray(impacts)) {
      throw new Error('Health impact should be an array of strings');
    }

    // Validate each impact in the array
    for (const impact of impacts) {
      if (!impact || typeof impact !== 'string') {
        return respond(res, { error: 'Each health impact must be a string' }, HttpStatus.BAD_REQUEST);
      }

      // Check if the impact contains only alphabets and spaces (if allowed)
      const regex = /^[A-Za-z\s]+$/; // Modify this regex if you want to allow more characters
      if (!regex.test(impact)) {
        return respond(res, { error: 'Health impact must not contain special characters or digits' }, HttpStatus.BAD_REQUEST);
      }
    }

    if(!req.files.image){
      return respond(res, { error: 'Kindly upload an image for the meal bundle'});
    }

    // Add parsed values back to the validated object
    value.items = items;
    value.health_impact = impacts;

    // Store parsed data in req.body to pass it to the next middleware/handler
    req.body = value;
    console.log('REQ 2', req.body);
    next();
  } catch (err) {
    return respond(res, { error: 'Failed to parse items or health_impact.' }, HttpStatus.BAD_REQUEST);
  }
}
