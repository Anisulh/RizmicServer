import { NextFunction, Request, Response } from 'express';
import { rateLimiter } from '../limiterInstances';

const rateLimiterMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    rateLimiter
        .consume(req.ip)
        .then(() => {
            next();
        })
        .catch((_) => {
            res.status(429).send('Too Many Requests');
        });
};

export default rateLimiterMiddleware;
