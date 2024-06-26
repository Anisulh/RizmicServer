import { NextFunction, Request, Response } from 'express';
import logger from '../library/logger';
import {
    JsonWebTokenError,
    NotBeforeError,
    TokenExpiredError
} from 'jsonwebtoken';
import { MongoServerError } from 'mongodb';
import { AppError, HttpCode, errorHandler } from '../library/errorHandler';
import { ZodError } from 'zod';

const handleError = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (
        error instanceof TokenExpiredError ||
        error instanceof JsonWebTokenError ||
        error instanceof NotBeforeError
    ) {
        const appError = new AppError({
            name: 'JSON WEB TOKEN ERROR',
            message: error.message,
            httpCode: HttpCode.UNAUTHORIZED
        });
        return errorHandler.handleError(appError, req, res);
    } else if (error instanceof MongoServerError && error.code === 11000) {
        logger.error(`MongoDB E11000 Error: ${error}`);
        const appError = new AppError({
            name: 'MongoDB Duplicate Key Error',
            httpCode: HttpCode.CONFLICT,
            message:
                'Duplicate key error: A resource with that value already exists.'
        });
        errorHandler.handleError(appError, req, res);
    } else if (error instanceof ZodError) {
        console.log(error.format());
        logger.error(`Zod validation error: ${error.format()}`);
        const appError = new AppError({
            name: 'JOI validation Error',
            httpCode: HttpCode.UNPROCESSABLE_ENTITY,
            message: 'One or more fields submitted was not valid'
        });
        errorHandler.handleError(appError, req, res);
    } else if (error instanceof AppError) {
        errorHandler.handleError(error, req, res);
    } else {
        logger.error(error);
        errorHandler.handleError(error, req, res);
    }
};

export default handleError;
