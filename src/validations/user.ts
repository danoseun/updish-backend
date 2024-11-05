import { celebrate, Joi, Segments } from 'celebrate';

export const checkPhoneNumberSchema = celebrate({
  [Segments.BODY]: Joi.object().keys({
    phone_number: Joi.string()
      .pattern(/^\+234[0-9]{10}$/)
      .required()
      .trim()
      .messages({
        "string.pattern.base":
          "Phone number must be in the format +234**********",
        "string.empty": "Phone number is required",
      }),
  }),
});

export const verifyUserPhoneNumberSchema = celebrate(
    {
      [Segments.BODY]: Joi.object().keys({
        phone_number: Joi.string().trim().required(),
        otp: Joi.string().required().trim()
      })
    },
    {
      abortEarly: false
    }
  );

  export const createUserWithPhoneNumberSchema = celebrate(
    {
      [Segments.BODY]: Joi.object().keys({
        first_name: Joi.string().trim().required(),
        last_name: Joi.string().required().trim(),
        phone_number: Joi.string().trim().required(),
        email: Joi.string().trim().required(),
        password: Joi.string().trim().required(),
        age: Joi.string().trim().required(),
        state: Joi.string().trim().required(),
        city: Joi.string().trim().required(),
        address: Joi.string().trim().required()
      })
    },
    {
      abortEarly: false
    }
  );

  export const createUserWithGoogleAuthSchema = celebrate(
    {
      [Segments.BODY]: Joi.object().keys({
        first_name: Joi.string().trim().required(),
        last_name: Joi.string().required().trim(),
        phone_number: Joi.string().trim().required(),
        email: Joi.string().trim().required(),
        age: Joi.string().trim().required(),
        state: Joi.string().trim().required(),
        city: Joi.string().trim().required(),
        address: Joi.string().trim().required()
      })
    },
    {
      abortEarly: false
    }
  );

  export const loginUserSchema = celebrate(
    {
      [Segments.BODY]: Joi.object().keys({
        email: Joi.string().email().required().trim().lowercase().messages({
          'string.email': `{{#label}} should be a valid email`,
          'string.empty': `{{#label}} is not allowed to be empty`
        }),
        password: Joi.string().required().trim()
      })
    },
    {
      abortEarly: false
    }
  );
