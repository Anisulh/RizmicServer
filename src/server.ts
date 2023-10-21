import express, { Application, Request, Response } from 'express';
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
import config from './config/config';

const app: Application = express();
export const rollbar = new Rollbar({
    accessToken: config.rollBarAccessToken,
    captureUncaught: true,
    captureUnhandledRejections: true
});
dbConnection();
app.use(httpLogger);
const allowedOrigins = [config.clientHost];

const options: CorsOptions = {
    origin: allowedOrigins,
    credentials: true
};

app.use(cors(options));
app.use(helmet());
app.disable('x-powered-by');
app.use(cookieParser());

app.use(rateLimiterMiddleware);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//routing
app.get('/api', (req:Request,res:Response) => {
    res.send("Server is live!")
})
app.use('/api/user', userRouter);
app.use('/api/clothes', clothesRouter);
app.use('/api/generation', generationRouter);
app.use('/api/outfits', outfitRouter);

//router errorhandling
app.use(routeError);
app.use(rollbar.errorHandler());

export default app;
