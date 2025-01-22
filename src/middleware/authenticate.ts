import { Request, Response, NextFunction } from 'express';
import { JsonWebTokenError, NotBeforeError, TokenExpiredError } from 'jsonwebtoken';
import { findUserById, findAdminById, findAdminByEmail } from '../repository/user';
import { BadRequestError, NotAuthenticatedError, NotAuthorizedError } from '../errors';
import { JWT } from '../utilities';
import { User, Admin } from '../interfaces';


export const authenticate = () => {
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
      const user = await findUserById([decoded.id] as Partial<User>);
    
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


