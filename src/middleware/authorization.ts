import { NextFunction, Request, Response } from 'express';
import jwt, {
    JsonWebTokenError,
    NotBeforeError,
    TokenExpiredError
} from 'jsonwebtoken';
import User from '../components/users/model';
import config from '../config/config';
import { AppError, errorHandler, HttpCode } from '../library/errorHandler';

export const authorization = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            const appError = new AppError({
                name: 'Missing JWT',
                description: 'No JWT found in cookie',
                httpCode: HttpCode.UNAUTHORIZED
            });
            return errorHandler.handleError(appError, req, res);
        }

        const decodedToken = jwt.verify(token, config.jwtSecret) as {
            id: string;
            iss: string;
        };
        if (decodedToken.iss !== 'rizmic_fits') {
            const appError = new AppError({
                name: 'Missing JWT issuer',
                description: 'Issuer does not match',
                httpCode: HttpCode.UNAUTHORIZED
            });
            return errorHandler.handleError(appError, req, res);
        }

        if (decodedToken.id) {
            req.user = await User.findById(decodedToken.id);
            next();
        } else {
            const appError = new AppError({
                name: 'Missing element in JWT',
                description: 'No _id field in JWT',
                httpCode: HttpCode.UNAUTHORIZED
            });
            return errorHandler.handleError(appError, req, res);
        }
    } catch (error) {
        if (
            error instanceof TokenExpiredError ||
            error instanceof JsonWebTokenError ||
            error instanceof NotBeforeError
        ) {
            const appError = new AppError({
                name: 'JSON WEB TOKEN ERROR',
                description: error.message,
                httpCode: HttpCode.UNAUTHORIZED
            });
            return errorHandler.handleError(appError, req, res);
        }
        const criticalError = new Error(
            `Critical Error occured at authorization: ${error}`
        );
        return errorHandler.handleError(criticalError);
    }
};
