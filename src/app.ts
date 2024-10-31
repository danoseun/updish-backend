import express, { Request, Response } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import passport from 'passport';

import { handleErrors as errorMiddleware } from './middleware/error';
import { userRouter } from './routes';
import { logger } from './utilities'
import variables from './variables';


const app = express();

app.use(cors());
app.options('*', cors());

app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));



app.get('/v1/health', (req: Request, res: Response) =>
  res.status(200).json({
    status: 'success',
    message: "server is up and running",
    data: null,
  }),
);


app.use('/v1', userRouter);
// app.use("/v1", listingRouter);
// app.use("/v1", categoryRouter);
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
