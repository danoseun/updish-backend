import { celebrate, Joi, Segments } from "celebrate";

export const checkPhoneNumberSchema = celebrate({
  [Segments.BODY]: Joi.object().keys({
    phone_number: Joi.string()
      .pattern(/^\+234[0-9]{10}$/)
      .required()
      .trim()
      .messages({
        "string.pattern.base":
          "Phone number must be in the format +234 8033212346",
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
