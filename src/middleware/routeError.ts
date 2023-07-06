import { Request, Response } from 'express';
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
        errorHandler.handleError(appError, req, res);
    } catch (error) {
        const criticalError = new Error(
            `Unknown error occured in routeError: ${error}`
        );
        errorHandler.handleError(criticalError, req, res);
    }
};

export default routeError;
