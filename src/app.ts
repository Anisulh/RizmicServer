import config from './config/config';
import express, { Application, Request, Response } from 'express';
import userRouter from './components/users/route';
import httpLogger from './middleware/httpLogger';
import routeError from './middleware/routeError';
import cors from 'cors';
import helmet from 'helmet';
import rateLimiterMiddleware from './middleware/rateLimiter';
import clothesRouter from './components/clothes/route';
import generationRouter from './components/fitGeneration/route';
import outfitRouter from './components/outfits/route';
import Rollbar from 'rollbar';
import cookieParser from 'cookie-parser';
import handleError from './middleware/handleError';
import friendsRouter from './components/friends/route';


export const rollbar = new Rollbar({
    accessToken: config.rollBarAccessToken,
    captureUncaught: true,
    captureUnhandledRejections: true
});
export const startApp = async (): Promise<Application> => {
    const app: Application = express();

    app.use(httpLogger);
    app.use(
        cors({
            origin: [config.clientHost],
            credentials: true
        })
    );
    app.use(helmet());
    app.disable('x-powered-by');
    app.use(cookieParser());

    app.use(rateLimiterMiddleware);

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    //routing
    app.get('/api', (_: Request, res: Response) => {
        res.status(200).send('OK');
    });
    app.use('/api/user', userRouter);
    app.use('/api/friends', friendsRouter)
    app.use('/api/clothes', clothesRouter);
    app.use('/api/generation', generationRouter);
    app.use('/api/outfits', outfitRouter);

    app.use(handleError);

    //router error handling
    app.use(routeError);
    app.use(rollbar.errorHandler());
    return app;
};
