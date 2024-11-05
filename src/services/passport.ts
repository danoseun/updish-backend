import dotenv from 'dotenv';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import variables from '../variables';
import { findUserByEmail } from '../repository/user';
import { User } from '../interfaces';



const googleStrategy = new GoogleStrategy({
    clientID: variables.services.google.clientID,
    clientSecret: variables.services.google.clientSecret,
    callbackURL: `${variables.app.backendBaseUrl}/auth/google/callback`,
  },
  
  async (accessToken, refreshToken, profile, cb) => {
    try {
      console.log(accessToken, '>>', refreshToken, 'PROF', profile, cb);
      const email = profile.emails[0].value;
      
      const userExists = await findUserByEmail(['%' + profile.emails[0].value + '%'] as Partial<User>);
      console.log('user', userExists);
  
      if (userExists) {
        return cb(null, userExists);
      }
  
      const newUser = {
        first_name: profile.name.givenName,
        last_name: profile.name.familyName,
        email
      };
      // store in database
      //await signupService(newUser);
  
      return cb(null, newUser);
    } catch (err) {
      return cb(err, false);
    }
  });
  
  export { googleStrategy };