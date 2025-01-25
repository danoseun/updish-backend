import { celebrate, Joi, Segments } from 'celebrate';

export const createItemSchema = celebrate(
  {
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string().required().trim(),
      uom: Joi.number().required(),
      description: Joi.string().required(),
      // category: Joi.string().valid('Breakfast', 'Lunch', 'Dinner').required(),
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
      admin_id: Joi.number().required(),
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

export const createBundleSchema = celebrate(
  {
    [Segments.BODY]: Joi.object().keys({
      name: Joi.string().trim().min(1).max(255).required().messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must have at least 1 character',
        'string.max': 'Name must not exceed 255 characters'
      }),

      items: Joi.array()
        .items(
          Joi.object({
            item: Joi.number().required(),
            qty: Joi.number().integer().positive().required().messages({
              'number.base': 'Quantity must be a number',
              'number.integer': 'Quantity must be an integer',
              'number.positive': 'Quantity must be a positive number'
            })
          })
        )
        .min(1)
        .required()
        .messages({
          'array.min': 'At least one item is required in the bundle',
          'array.base': 'Items must be an array of objects'
        }),

      health_impact: Joi.string().trim().max(255).required().messages({
        'string.empty': 'Health impact is required',
        'string.max': 'Health impact must not exceed 255 characters'
      }),

      category: Joi.string().valid('breakfast', 'lunch', 'dinner').required().messages({
        'string.empty': 'Category is required'
      }),

      price: Joi.string()
        .trim()
        .regex(/^\d+(,\d{3})*(N)?$/)
        .required()
        .messages({
          'string.empty': 'Price is required',
          'string.pattern.base': 'Price must be a valid currency format (e.g., 4,590N)'
        }),

      is_active: Joi.boolean().required().messages({
        'boolean.base': 'is_active must be true or false'
      })
    })
  },
  {
    abortEarly: false // Collect all validation errors instead of stopping at the first error
  }
);
