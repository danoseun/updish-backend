import { celebrate, Joi, Segments } from "celebrate";
import { IdTokenClient } from "google-auth-library/build/src";

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
      otp: Joi.string().required().trim(),
    }),
  },
  {
    abortEarly: false,
  },
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
      address: Joi.string().trim().required(),
    }),
  },
  {
    abortEarly: false,
  },
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
      address: Joi.string().trim().required(),
    }),
  },
  {
    abortEarly: false,
  },
);

export const loginUserSchema = celebrate(
  {
    [Segments.BODY]: Joi.object().keys({
      email: Joi.string().email().required().trim().lowercase().messages({
        "string.email": `{{#label}} should be a valid email`,
        "string.empty": `{{#label}} is not allowed to be empty`,
      }),
      password: Joi.string().required().trim(),
    }),
  },
  {
    abortEarly: false,
  },
);

export const forgotPasswordSchema = celebrate({
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().email().required().trim().lowercase().messages({
      "string.email": `{{#label}} should be a valid email`,
      "string.empty": `{{#label}} is not allowed to be empty`,
    }),
  }),
});

export const acceptNewPasswordSchema = celebrate({
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().trim().required(),
    newPassword: Joi.string().trim().required()
  }),
});

export const createKYCSchema = celebrate({
  [Segments.BODY]: Joi.object().keys({
    userId: Joi.number(),
    sex: Joi.string().trim().required(),
    health_goals: Joi.array()
    .items(Joi.string().trim().min(1).required())
    .required(),
    dietary_preferences: Joi.string().trim().required(),
    food_allergies: Joi.array()
      .items(Joi.string().trim().min(1).required())
      .required(),
    health_concerns: Joi.array()
      .items(Joi.string().trim().min(1).required())
      .required()
  }),
});

export const fetchKYCSchema = celebrate(
  {
    [Segments.PARAMS]: Joi.object().keys({
      user_id: Joi.number().required()
    })
  },
  {
    abortEarly: false
  }
);

export const addressCreationSchema = celebrate(
  {
    [Segments.BODY]: Joi.object().keys({
      state: Joi.string().trim().required(),
      city: Joi.string().trim().required(),
      address: Joi.string().trim().required()
    })
  },
  {
    abortEarly: false
  }
);

export const savePushTokenSchema = celebrate({
  [Segments.BODY]: Joi.object().keys({
    userId: Joi.number().required(),
    newPushToken: Joi.string().trim().required()
  }),
});

export const googleAuthSchema = celebrate({
  [Segments.BODY]: Joi.object().keys({
    idToken: Joi.string().required()
  }),
});
