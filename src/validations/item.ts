import { celebrate, Joi, Segments } from 'celebrate';


export const createItemSchema = celebrate(
  {
    [Segments.BODY]: Joi.object().keys({
      admin_id: Joi.number().required(),
      item_name: Joi.string().required().trim(),
      uom: Joi.string().trim().required(),
      allergies: Joi.string().trim().required(),
      class_of_food: Joi.string().trim().required(),
      calories_per_uom: Joi.string().trim().required(),
      parent_item: Joi.string().trim().required()
    }),
  },
  {
    abortEarly: false,
  },
);

