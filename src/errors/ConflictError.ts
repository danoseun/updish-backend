import HttpStatus from 'http-status-codes';

import ErrorHandler from './ErrorHandler';

export class ConflictError extends ErrorHandler {
  protected error_name = 'conflict';
  protected httpCode = HttpStatus.CONFLICT;

  constructor(
    message = 'The request could not be completed due to a conflict with the current state of the target resource',
    error: Error = undefined,
    data: any = null
  ) {
    super(message, error, data);
    Error.captureStackTrace(this, this.constructor);
  }
}
