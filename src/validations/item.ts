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

// export const createBundleSchema = celebrate(
//   {
//     [Segments.BODY]: Joi.object().keys({
//       name: Joi.string().trim().min(1).max(255).required().messages({
//         'string.empty': 'Name is required',
//         'string.min': 'Name must have at least 1 character',
//         'string.max': 'Name must not exceed 255 characters'
//       }),

//       // items: Joi.array()
//       //   .items(
//       //     Joi.object({
//       //       item: Joi.string().required(),
//       //       qty: Joi.number().integer().positive().required().messages({
//       //         'number.base': 'Quantity must be a number',
//       //         'number.integer': 'Quantity must be an integer',
//       //         'number.positive': 'Quantity must be a positive number'
//       //       })
//       //     })
//       //   )
//       //   .min(1)
//       //   .required()
//       //   .messages({
//       //     'array.min': 'At least one item is required in the bundle',
//       //     'array.base': 'Items must be an array of objects'
//       //   }),

//       items: Joi.array()
//         .items(
//           Joi.object().keys({
//             item: Joi.number().required().messages({
//               // Validate item ID as a number
//               'number.base': 'Item must be a number',
//               'any.required': 'Item is required'
//             }),
//             qty: Joi.number().integer().min(1).required().messages({
//               // Validate quantity
//               'number.base': 'Quantity must be a number',
//               'number.integer': 'Quantity must be an integer',
//               'number.min': 'Quantity must be at least 1',
//               'any.required': 'Quantity is required'
//             })
//           })
//         )
//         .min(1)
//         .required()
//         .messages({
//           // Ensure at least one item
//           'array.base': 'Items must be an array',
//           'array.min': 'At least one item is required'
//         }),

//       health_impact: Joi.array().items(Joi.string().required()).label('Health Impact').messages({
//         'array.base': 'Health impact must be an array of strings.',
//         'string.base': 'Each health impact must be a string.'
//       }),

//       category: Joi.string().valid('Breakfast', 'Lunch', 'Dinner').required().messages({
//         'string.empty': 'Category is required'
//       }),

//       price: Joi.string()
//         .trim()
//         .regex(/^\d+(,\d{3})*$/)
//         .required()
//         .messages({
//           'string.empty': 'Price is required',
//           'string.pattern.base': 'Price must be a valid currency format (e.g., 4,590N)'
//         }),

//       is_active: Joi.boolean().required().messages({
//         'boolean.base': 'is_active must be true or false'
//       })
//     })
//   },
//   {
//     abortEarly: false // Collect all validation errors instead of stopping at the first error
//   }
// );


// export const createBundleSchema = celebrate(
//   {
//     [Segments.BODY]: Joi.object().keys({
//       name: Joi.string().trim().min(1).max(255).required().messages({
//         'string.empty': 'Name is required',
//         'string.min': 'Name must have at least 1 character',
//         'string.max': 'Name must not exceed 255 characters'
//       }),

//       items: Joi.alternatives()
//         .try(
//           // Validate if it's already an array
//           Joi.array()
//             .items(
//               Joi.object().keys({
//                 item: Joi.number().required().messages({
//                   'number.base': 'Item must be a number',
//                   'any.required': 'Item is required'
//                 }),
//                 qty: Joi.number().integer().min(1).required().messages({
//                   'number.base': 'Quantity must be a number',
//                   'number.integer': 'Quantity must be an integer',
//                   'number.min': 'Quantity must be at least 1',
//                   'any.required': 'Quantity is required'
//                 })
//               })
//             )
//             .min(1)
//             .required()
//             .messages({
//               'array.base': 'Items must be an array',
//               'array.min': 'At least one item is required'
//             }),

//           // Validate if it's a stringified array and parse it
//           Joi.string()
//             .required()
//             .custom((value, helper) => {
//               let parsedItems;
//               try {
//                 parsedItems = JSON.parse(value); // Try parsing the stringified JSON
//               } catch (e) {
//                 return helper.message({message: 'Items must be a valid JSON string'});
//               }

//               if (!Array.isArray(parsedItems)) {
//                 return helper.message({message: 'Items must be an array'});
//               }

//               if (parsedItems.length === 0) {
//                 return helper.message({message: 'At least one item is required'});
//               }

//               // Validate each item object
//               for (const item of parsedItems) {
//                 if (typeof item.item !== 'number') {
//                   return helper.message({message: 'Each item must have a numeric "item" ID'});
//                 }
//                 if (typeof item.qty !== 'number' || item.qty < 1 || !Number.isInteger(item.qty)) {
//                   return helper.message({message: 'Each item must have a positive integer quantity'});
//                 }
//               }

//               return value; // Return the original value if everything is valid
//             })
//             .messages({
//               'string.empty': 'Items are required',
//             })
//         )
//         .messages({
//           'alternatives.base': 'Items must be either an array or a stringified array'
//         }),

//       health_impact: Joi.alternatives()
//         .try(
//           // Direct validation if it's an array of strings
//           Joi.array().items(Joi.string().required()).required().messages({
//             'array.base': 'Health impact must be an array of strings.',
//             'string.base': 'Each health impact must be a string.',
//             'array.min': 'At least one health impact is required'
//           }),

//           // Check if it's a stringified array and parse it
//           Joi.string()
//             .required()
//             .custom((value, helper) => {
//               let parsedHealthImpact;
//               try {
//                 parsedHealthImpact = JSON.parse(value); // Try parsing the stringified JSON
//               } catch (e) {
//                 return helper.message({message: 'Health impact must be a valid JSON string'});
//               }

//               if (!Array.isArray(parsedHealthImpact)) {
//                 return helper.message({message: 'Health impact must be an array'});
//               }

//               if (parsedHealthImpact.length === 0) {
//                 return helper.message({message: 'At least one health impact is required'});
//               }

//               // Validate each health impact string
//               for (const health of parsedHealthImpact) {
//                 if (typeof health !== 'string') {
//                   return helper.message({message:'Each health impact must be a string'});
//                 }
//               }

//               return value; // Return the original value if everything is valid
//             })
//             .messages({
//               'string.empty': 'Health impact is required',
//             })
//         )
//         .messages({
//           'alternatives.base': 'Health impact must be either an array or a stringified array'
//         }),

//       category: Joi.string().valid('Breakfast', 'Lunch', 'Dinner').required().messages({
//         'string.empty': 'Category is required'
//       }),

//       price: Joi.string()
//         .trim()
//         .regex(/^\d+(,\d{3})*$/)
//         .required()
//         .messages({
//           'string.empty': 'Price is required',
//           'string.pattern.base': 'Price must be a valid currency format (e.g., 4,590)'
//         }),

//       is_active: Joi.boolean().required().messages({
//         'boolean.base': 'is_active must be true or false'
//       }),

//       // Image validation: Allows one or more files to be uploaded (URLs)
//       image: Joi.alternatives()
//         .try(
//           Joi.string().uri().required().messages({
//             'string.base': 'Image must be a valid string (URL)',
//             'string.uri': 'Image URL must be a valid URI',
//             'any.required': 'Image is required'
//           }),
//           Joi.array().items(Joi.string().uri().required()).messages({
//             'array.base': 'Image must be a valid array of URLs',
//             'string.base': 'Each image URL must be a valid string (URL)',
//             'string.uri': 'Each image URL must be a valid URI',
//             'any.required': 'At least one image URL is required'
//           })
//         )
//         .messages({
//           'alternatives.base': 'Image must be either a single URL or an array of URLs'
//         })
//     })
//   },
//   {
//     abortEarly: false // Collect all validation errors instead of stopping at the first error
//   }
// );

const schema = Joi.object({
  name: Joi.string().required(), // Bundle name, required and string
  items: Joi.string().required(), // Items will be a string containing a JSON array
  health_impact: Joi.string().required(), // Health impact will be a string of comma-separated values
  price: Joi.string().required(), // Price as a string
  category: Joi.string().valid('Breakfast', 'Lunch', 'Dinner').required(), // Category must be one of these values
  is_active: Joi.boolean().required() // Boolean value for active status
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
      throw new Error("Items should be an array.");
    }
    // const impacts = JSON.parse(value.health_impact);

    // if(!Array.isArray(impacts)){
    //   throw new Error('Health impact should be an array of strings');
    // }

    // Validate each item in the array
    for (const item of items) {
      if (!item.item || typeof item.item !== 'number' || !item.qty || typeof item.qty !== 'number') {
        return respond(res, { error: 'Each item must have a valid item ID and quantity.' }, HttpStatus.BAD_REQUEST);
        //return res.status(400).json({ error: 'Each item must have a valid item ID and quantity.' });
      }
    }

    // Parse health_impact from string to an array of strings
    const healthImpact = value.health_impact.split(',').map((impact: string) => impact.trim());

    // Add parsed values back to the validated object
    value.items = items;
    value.health_impact = healthImpact;

    // Store parsed data in req.body to pass it to the next middleware/handler
    req.body = value;
    console.log('REQ 2', req.body);
    //return;
    // Proceed to the next middleware or route handler
    next();
  } catch (err) {
    return respond(res, { error: 'Failed to parse items or health_impact.' }, HttpStatus.BAD_REQUEST);
    //return res.status(400).json({ error: 'Failed to parse items or health_impact.' });
  }
}

