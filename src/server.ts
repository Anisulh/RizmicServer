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

const app: Application = express();

dbConnection();
app.use(httpLogger);
const allowedOrigins = ['http://localhost:5173'];

const options: CorsOptions = {
    origin: allowedOrigins
};

app.use(cors(options));
app.use(helmet());
app.disable('x-powered-by');

app.use(rateLimiterMiddleware);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//routing
app.use('/user', userRouter);
app.use('/clothes', clothesRouter);
app.use('/generation', generationRouter);
app.use('/outfits', outfitRouter);

//router errorhandling
app.use(routeError);

export default app;
