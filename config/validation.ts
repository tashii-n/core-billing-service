import * as Joi from 'joi';

export const validationSchema = Joi.object({
  DATABASE_URL: Joi.string().required(),
  PORT: Joi.number().required(),
  AWS_DEFAULT_REGION: Joi.string().required(),
  COGNITO_USER_POOL_ID: Joi.string().required(),
  COGNITO_CLIENT_ID: Joi.string().required(),
});
