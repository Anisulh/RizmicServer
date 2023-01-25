import express, { Application, NextFunction, Request, Response } from 'express';
import router from './components/users/route';
import dbConnection from './config/dbConnection';
import httpLogger from './middleware/httpLogger';
import routeError from './middleware/routeError';
import cors, { CorsOptions } from 'cors';
import Redis from 'ioredis';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import './process';
import rateLimiterMiddleware from './middleware/rateLimiter';

export const redis = new Redis();
export const rateLimiter = new RateLimiterRedis({
    storeClient: redis,
    keyPrefix: 'middleware',
    points: 10, // 10 requests
    duration: 1 // per 1 second by IP
  });

  
const app: Application = express();

dbConnection();
app.use(httpLogger);
const allowedOrigins = ['http://localhost:5173'];

const options: CorsOptions = {
    origin: allowedOrigins
};

app.use(cors(options));


app.use(rateLimiterMiddleware);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//routing
app.use('/user', router);

//router errorhandling
app.use(routeError);

export default app;
