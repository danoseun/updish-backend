import jwt from 'jsonwebtoken';
import { User } from '../interfaces';

import variables from '../variables';

export class JWT {
  private static secret: jwt.Secret = variables.auth.secret;

  public static encode(payload: Partial<User>, options?: Partial<jwt.SignOptions>): string {
    try {
      const token = jwt.sign(payload, this.secret, { expiresIn: variables.auth.jwtExpiryTime || '24h', ...options });
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
