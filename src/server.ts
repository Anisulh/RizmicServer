import express, { Application } from 'express';
import userRouter from './components/users/route';
import dbConnection from './config/dbConnection';
import httpLogger from './middleware/httpLogger';
import routeError from './middleware/routeError';
import cors, { CorsOptions } from 'cors';
import helmet from 'helmet';
import './process';
import rateLimiterMiddleware from './middleware/rateLimiter';
import clothesRouter from './components/clothes/route';
import generationRouter from './components/fitGeneration/route';
import outfitRouter from './components/outfits/route';
import Rollbar from 'rollbar';
import cookieParser from 'cookie-parser';

const app: Application = express();
const rollbar = new Rollbar({
    accessToken: 'fd33c0c14321416298b161b7983a0c9c',
    captureUncaught: true,
    captureUnhandledRejections: true,
  })
dbConnection();
app.use(httpLogger);
const allowedOrigins = ['http://localhost:5173', 'http://rizmicfitsclient.s3-website-us-east-1.amazonaws.com'];

const options: CorsOptions = {
    origin: allowedOrigins,
    credentials: true,
};

app.use(cors(options));
app.use(helmet());
app.disable('x-powered-by');
app.use(cookieParser());

app.use(rateLimiterMiddleware);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//routing
app.use('/api/user', userRouter);
app.use('/api/clothes', clothesRouter);
app.use('/api/generation', generationRouter);
app.use('/api/outfits', outfitRouter);

//router errorhandling
app.use(routeError);
app.use(rollbar.errorHandler());

export default app;
