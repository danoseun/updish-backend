import HttpStatus from 'http-status-codes';
import { Request, Response, NextFunction } from 'express';
import { isCelebrateError } from 'celebrate';

import { respond, logger } from '../utilities';
import ErrorHandler from '../errors/ErrorHandler';

export const handleErrors = (err: Error, req: Request, res: Response, _next: NextFunction): Response => {
  if (err instanceof ErrorHandler) {
    return respond(res, err.message, err.getHttpCode());
  }

  if (isCelebrateError(err)) {
    const errorBody = err.details.get('body') || err.details.get('query') || err.details.get('params');

    const errors = errorBody?.details.reduce((acc, val) => {
      const key = val.path.join('.');
      const message = val.message.replace(/['"]+/g, '');
      acc[key] = { message };
      return acc;
    }, {});

    return respond<string>(res, 'Validation Error', HttpStatus.BAD_REQUEST, errors);
  }

  logger.error('Internal Error', err);

  return respond<string>(res, 'Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
};
