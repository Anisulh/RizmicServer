import { NextFunction, Request, Response } from 'express';
import logger from '../library/logger';
import { MongoServerError } from 'mongodb';
import { AppError, HttpCode, errorHandler } from '../library/errorHandler';
import { ZodError } from 'zod';

const handleError = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (error instanceof MongoServerError && error.code === 11000) {
        logger.error(`MongoDB E11000 Error: ${error}`);
        const appError = new AppError({
            name: 'MongoDB Duplicate Key Error',
            httpCode: 409, // HTTP status code 409 Conflict is often used for duplicate resource errors
            description:
                'Duplicate key error: A resource with that value already exists.'
        });
        errorHandler.handleError(appError, req, res);
    } else if (error instanceof ZodError) {
        logger.error(`Zod validation error: ${error.format()}`);
        const appError = new AppError({
            name: 'JOI validation Error',
            httpCode: HttpCode.BAD_REQUEST,
            description: 'One or more fields submitted was not valid'
        });
        errorHandler.handleError(appError, req, res);
    } else {
        const criticalError = new Error(
            `Unknown error occured in reqValidation: ${error}`
        );
        errorHandler.handleError(criticalError, req, res);
    }
};

export default handleError;
