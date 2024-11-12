import passport from 'passport';
import GooglePassport from 'passport-google-oauth20';
import variables from '../variables';

const GoogleStrategy = GooglePassport.Strategy;

// These are the interfaces for the Auth User and Email
interface IOauthEmail {
  value: string;
  verified: boolean;
}

interface IOauthUser {
  id: string;
  emails: IOauthEmail[];
  name: { familyName: string; givenName: string };
  provider: string;
}

// This function normalizes the profile Object gotten from Google
const userProfile = (profile: IOauthUser) => {
  const { id, name, emails, provider } = profile;

  let firstName: string;
  let lastName: string;
  let email: string;

  if (emails && emails.length) email = emails[0].value;
  if (name.givenName) firstName = name.givenName;
  if (name.familyName) lastName = name.familyName;

  return {
    id,
    firstName,
    lastName,
    email,
    provider
  };
};

passport.serializeUser(function (user: any, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id: any, done) {
  done(null, id);
});

const googleCallbackUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://127.0.0.1:2145/v1/auth/google/callback'
    : `${variables.app.backendBaseUrl}/v1/auth/google/callback`;

passport.use(
  new GoogleStrategy(
    {
      clientID: variables.services.google.clientID,
      clientSecret: variables.services.google.clientSecret,
      callbackURL: googleCallbackUrl,
      scope: ['profile', 'email'],
      passReqToCallback: true
    },
    (_req: any, _accessToken: any, _refreshToken: any, profile: any, cb: any) => cb(null, userProfile(profile))
  )
);

// const facebookCallbackUrl =
//   process.env.NODE_ENV === 'test'
//     ? 'https://f865-102-89-47-204.ngrok-free.app/v1/auth/facebook/callback'
//     : `${variables.app.backendBaseUrl}/v1/auth/facebook/callback`;

// passport.use(
//   new FacebookStrategy(
//     {
//       clientID: variables.services.facebook.clientID,
//       clientSecret: variables.services.facebook.clientSecret,
//       callbackURL: facebookCallbackUrl,
//       profileFields: ['id', 'displayName', 'photos', 'email']
//     },
//     (accessToken, refreshToken, profile, callback) => {
//       console.log('FACEBOOK', profile);
//       callback(null, profile);
//     }
//   )
// );
