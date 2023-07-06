import { NextFunction, Request, Response } from 'express';
import { ObjectSchema, ValidationError } from 'joi';
import { AppError, errorHandler, HttpCode } from '../library/errorHandler';
import logger from '../library/logger';
import { verifyGoogleToken } from '../components/users/services/googleAuth';

export const reqValidation = (schema: ObjectSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token: string | null =
                req.headers['authorization'] &&
                req.headers['authorization'].split(' ')[0] === 'Bearer'
                    ? req.headers['authorization'].split(' ')[1]
                    : null;

            const googleToken =
                (token && (await verifyGoogleToken(token))) || false;
            if (googleToken) {
                next();
            } else {
                await schema.validateAsync(req.body);
                next();
            }
        } catch (error: ValidationError | unknown) {
            if (error instanceof ValidationError) {
                logger.error(error.annotate());
                errorHandler.handleError(
                    new AppError({
                        name: 'JOI validation Error',
                        httpCode: HttpCode.BAD_REQUEST,
                        description:
                            'One or more fields submitted was not valid'
                    }),
                    req,
                    res
                );
            } else {
                const criticalError = new Error(
                    `Unknown error occured in reqValidation: ${error}`
                );
                errorHandler.handleError(criticalError, req, res);
            }
        }
    };
};
