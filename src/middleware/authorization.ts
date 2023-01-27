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
    const token: string | null =
        req.headers['authorization'] &&
        req.headers['authorization'].split(' ')[0] === 'Bearer'
            ? req.headers['authorization'].split(' ')[1]
            : null;

    if (token) {
        try {
            const decodedToken = jwt.verify(token, config.jwtSecret) as {
                id: string;
            };
            if (decodedToken.id) {
                req.user = await User.findById(decodedToken.id);
                next();
            } else {
                const appError = new AppError({name: 'Missing element in JWT', description: 'No _id field in JWT', httpCode:HttpCode.BAD_REQUEST})
                errorHandler.handleError(appError, res)
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
                    httpCode: HttpCode.BAD_REQUEST
                });
                errorHandler.handleError(appError, res);
            }
        }
    } else {
        const appError = new AppError({
            name: 'Missing JWT',
            description: 'No JWT found in header',
            httpCode: HttpCode.BAD_REQUEST
        });
        errorHandler.handleError(appError, res);
    }
};
