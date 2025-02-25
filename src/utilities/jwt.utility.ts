import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { User } from '../interfaces';

import variables from '../variables';

dotenv.config();

export class JWT {
  private static secret: jwt.Secret = variables.auth.secret;

  public static encode<T>(payload: Partial<T>, options?: Partial<jwt.SignOptions>): string {
    console.log('secret', this.secret, '', process.env.JWT_SECRET);
    try {
      const token = jwt.sign(payload, this.secret, { expiresIn: variables.auth.jwtExpiryTime || '30d', ...options });
      return token;
    } catch (error) {
      throw error;
    }
  }

  public static decode(token: string): jwt.JwtPayload {
    try {
      const decoded = jwt.verify(token, this.secret);
      return decoded as jwt.JwtPayload;
    } catch (error) {
      throw error;
    }
  }
}
