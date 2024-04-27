import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
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
                message: 'No JWT found in cookie',
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
                message: 'Issuer does not match',
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
                message: 'No _id field in JWT',
                httpCode: HttpCode.UNAUTHORIZED
            });
            return errorHandler.handleError(appError, req, res);
        }
    } catch (error) {
        next(error);
    }
};
