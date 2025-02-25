import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken';
import { findUserById, findAdminById, findAdminByEmail, findDriverById } from '../repository/user';
import { BadRequestError, ForbiddenError, NotAuthenticatedError, NotAuthorizedError } from '../errors';
import { JWT } from '../utilities';
import { User, Admin, Driver } from '../interfaces';

interface Param {
  isDriver?: boolean;
}

export const authenticate = (param?: Param) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;

    if (!authorization) {
      return next(new NotAuthenticatedError('No token provided'));
    }

    const [, token] = authorization.split(' ');

    try {
      if (!token) {
        return next(new NotAuthenticatedError('No token provided'));
      }

      const decoded = JWT.decode(token);

      let user = param && param.isDriver ? await findDriverById([decoded.id] as Partial<Driver>) : await findUserById([decoded.id] as Partial<User>);

      if (!user) {
        return next(new NotAuthenticatedError('Invalid token'));
      }

      delete user.password;
      res.locals.user = user;
      return next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return next(new NotAuthenticatedError('Token has expired'));
      }

      if (error instanceof NotBeforeError) {
        return next(new NotAuthenticatedError('Token used prematurely'));
      }
      if (error instanceof JsonWebTokenError) {
        return next(new NotAuthenticatedError('Invalid token'));
      }

      return next(error);
    }
  };
};

export const authenticateAdmin = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;
    if (!authorization) {
      return next(new NotAuthenticatedError('No token provided'));
    }

    const [, token] = authorization.split(' ');

    try {
      if (!token) {
        return next(new NotAuthenticatedError('No token provided'));
      }

      const decoded = JWT.decode(token);
      const admin = await findAdminByEmail([decoded?.email] as Partial<Admin>);

      if (!admin) {
        return next(new NotAuthenticatedError('Invalid token'));
      }

      delete admin.password;
      res.locals.admin = admin;
      return next();
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return next(new NotAuthenticatedError('Token has expired'));
      }

      if (error instanceof NotBeforeError) {
        return next(new NotAuthenticatedError('Token used prematurely'));
      }
      if (error instanceof JsonWebTokenError) {
        return next(new NotAuthenticatedError('Invalid token'));
      }

      return next(error);
    }
  };
};

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const { email } = res.locals.user;
  const admin = await findAdminByEmail([email] as Partial<Admin>);
  if (admin) {
    return next();
  }

  return new NotAuthorizedError('you can not access this route');
};

export const restrictToWeekend = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const now = new Date();
    const day = now.getDay(); // Sunday = 0, Monday = 1, …, Friday = 5, Saturday = 6
    const hour = now.getHours();

    let allowed = false;

    if (day === 5 || day === 6) {
      allowed = true;
    } else if (day === 0) {
      if (hour < 18) {
        allowed = true;
      }
    }

    if (!allowed) {
      return next(new ForbiddenError('This endpoint is only accessible from Friday 12:00am to Sunday 6:00pm (GMT+1).'));
    }

    return next();
  };
};

// export const canList = async (req: Request, res: Response, next: NextFunction) => {
//   const { id } = res.locals.user;
//   const foundUser = await findUserById([id] as Partial<User>);
//   if (!foundUser) {
//     return new BadRequestError('there was a problem verifying your authenticity');
//   }
//   if (!foundUser?.is_email_verified || !foundUser?.is_phone_number_verified) {
//     return new NotAuthorizedError('please verify your phone number and email');
//   }
//   if (foundUser?.is_email_verified && foundUser?.is_phone_number_verified) {
//     return next();
//   }
// };
