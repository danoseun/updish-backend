import dotenv from 'dotenv';

dotenv.config();

import express, { Request, Response } from 'express';
import session from 'express-session';
const GoogleStrategy = require("passport-google-oauth20").Strategy;
let RedisStore = require('connect-redis')(session);
import { createClient } from 'redis';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import passport from 'passport';
import { OAuth2Client } from 'google-auth-library';

import { handleErrors as errorMiddleware } from './middleware/error';
import { userRouter, itemRouter, orderRouter } from './routes';
import { logger } from './utilities'
import variables from './variables';
import { connect } from './config/database.config';

// Require Passport midleware - without this your app wont work
require('./middleware/passport');


const app = express();

app.use(cors());
app.options('*', cors());

app.use(helmet());
app.use(compression());
app.use(morgan('dev'));


// Initialize Redis client.
let redisClient = createClient({
  url: variables.services.redisUrl
});

//Connection
redisClient.on('connect', () => {
  console.log('Redis client connected');
  logger.info('Redis client connected');
});

//Error
redisClient.on('error', (err) => {
  console.log('Something went wrong ' + err);
  logger.error('Something went wrong ' + err);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));



// Initialize Redis store.
let redisStore = new RedisStore({
  client: redisClient,
  prefix: 'updish-backend:'
});

app.use(
  session({
    store: redisStore,
    secret: variables.auth.sessionSecretKey,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 // 1 day
    },
    resave: false,
    saveUninitialized: false
  })
);

app.use(passport.initialize());
app.use(passport.session());


const performanceLogger = (req: { method: any; path: any; }, res: { on: (arg0: string, arg1: () => void) => void; }, next: () => void) => {
  const start = Date.now();

  // Log request duration when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[PERF] ${req.method} ${req.path} - ${duration}ms`);

    // Log slow requests
    if (duration > 100) {
      console.warn(`[SLOW_REQUEST] ${req.method} ${req.path} took ${duration}ms`);
    }
  });

  next();
};



connect();


app.get('/v1/health', (req: Request, res: Response) =>
  res.status(200).json({
    status: 'success',
    message: "server is up and running",
    data: null,
  }),
);

const client = new OAuth2Client('919531799409-ts5c0b9f70dgeet6kirggfgp27pdam5e.apps.googleusercontent.com');

app.post('/auth/google', async (req, res) => {
  const { idToken } = req.body;
  
  try {
      const ticket = await client.verifyIdToken({
          idToken,
          audience: '919531799409-ts5c0b9f70dgeet6kirggfgp27pdam5e.apps.googleusercontent.com', // Specify the CLIENT_ID of the app that accesses the backend
      });
      
      const payload = ticket.getPayload();
      console.log('GOOGLE AUTH', payload);
      const userId = payload['sub']; // User ID from Google
      console.log('GOOGLE AUTH userID', userId);
      // Check if user exists in your database; if not, create a new user entry
      //const userExistsQuery = await pool.query('SELECT * FROM users WHERE google_id = $1', [userId]);
      
      // if (userExistsQuery.rows.length === 0) {
      //     // Insert new user into database
      //     await pool.query('INSERT INTO users (google_id, email) VALUES ($1, $2)', [userId, payload.email]);
      // }

      // Generate JWT token for your application
      //const token = jwt.sign({ id: userId }, 'your_jwt_secret', { expiresIn: '1h' });
      
      //res.json({ token });
  } catch (error) {
      console.error(error);
      res.status(401).send('Invalid token');
  }
});

app.use(performanceLogger);
app.use('/v1', userRouter);
app.use('/v1', itemRouter);
app.use("/v1", orderRouter);
// app.use("/v1", bookingRouter);

app.use(errorMiddleware);

app.use((req, res, _next) =>
  res.status(404).json({
    status: "error",
    message: "resource not found",
    path: req.url,
  }),
);

app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    logger.error(`[UNEXPECTED ERROR] => ${err.message}`);

    return res.status(err.status || 500).send({
      status: "error",
      message: "Internal server error",
    });
  },
);

export default app;


// https://accounts.google.com/o/oauth2/auth?client_id=734048492145-9t0clb7gvcv0eeq5vod6uuuvdsik104s.apps.googleusercontent.com&response_type=token&redirect_uri=http://localhost:1755/v1/auth/google/callback&scope=https://www.googleapis.com/auth/userinfo.email