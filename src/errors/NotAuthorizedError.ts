import HttpStatus from 'http-status-codes';

import ErrorHandler from './ErrorHandler';

export class NotAuthorizedError extends ErrorHandler {
  protected error_name = 'not authorized';

  protected httpCode = HttpStatus.FORBIDDEN;

  public constructor(message: string = 'Request is not authorized', error: Error = undefined, data: any = null) {
    super(message, error, data);
    Error.captureStackTrace(this, this.constructor);
  }
}
