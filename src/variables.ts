import dotenv from 'dotenv';

dotenv.config();

const environment = process.env.NODE_ENV;

const variables = {
  app: {
    port: Number(process.env.PORT),
    environment,
    isDev: environment === 'development',
    isTesting: environment === 'test',
    isProd: environment === 'production',
    isStaging: environment === 'staging',
    databaseUrl: process.env.DATABASE_URL,
    backendBaseUrl: process.env.BACKEND_BASE_URL,
    frontendBaseUrl: process.env.FRONTEND_BASE_URL
  },

  auth: {
    rounds: Number(process.env.ROUNDS),
    secret: process.env.JWT_SECRET,
    jwtExpiryTime: process.env.JWT_EXPIRY_TIME,
    sessionSecretKey: process.env.SESSION_SECRET_KEY
  },

  logs: {
    logLevel: process.env.LOG_LEVEL || 'info',
    showAppLogs: process.env.SHOW_APPLICATION_LOGS === 'true',
    databaseLogs: process.env.SHOW_DATABASE_LOGS === 'true'
  },

  services: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      from: process.env.FROM
    },
    google: {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
  },
  
};

export default variables;
