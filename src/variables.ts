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
  },
  
};

export default variables;
