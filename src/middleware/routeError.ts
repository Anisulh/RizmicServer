import {  Request, Response } from 'express';
import { AppError, errorHandler, HttpCode } from '../library/errorHandler';
import logger from '../library/logger';

const routeError = async (req: Request, res: Response) => {
    try {
        logger.error('Route does exist');
        const appError = new AppError({
            name: 'Route not found',
            description: "The route you're looking for does not exit",
            httpCode: HttpCode.NOT_FOUND
        });
        errorHandler.handleError(appError, res);
    } catch (error) {
        if (error instanceof Error) {
            errorHandler.handleError(error);
        } else {
            errorHandler.handleError(
                new Error('Route Error Middleware not working properly...'),
                res
            );
        }
    }
};

export default routeError;
