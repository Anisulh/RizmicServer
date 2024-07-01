import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../components/users/model';
import config from '../config/config';
import { AppError, HttpCode } from '../library/errorHandler';
import { generateToken } from '../library/jwt';

export const authorization = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            throw new AppError({
                name: 'No JWT found in cookie',
                message: 'Missing JWT',
                httpCode: HttpCode.UNAUTHORIZED
            });
        }

        const decodedToken = jwt.verify(token, config.jwtSecret) as {
            id: string;
            iss: string;
            exp: number;
        };
        if (!decodedToken.iss || decodedToken.iss !== config.jwtIss) {
            throw new AppError({
                name: 'Issuer does not match',
                message: 'Invalid JWT issuer',
                httpCode: HttpCode.UNAUTHORIZED
            });
        }

        if (decodedToken.exp && Date.now() >= decodedToken.exp * 1000) {
            throw new AppError({
                name: 'JWT has expired',
                message: 'Expired JWT',
                httpCode: HttpCode.UNAUTHORIZED
            });
        }

        if (!decodedToken.id) {
            throw new AppError({
                name: 'No _id field in JWT',
                message: 'Missing element in JWT',
                httpCode: HttpCode.UNAUTHORIZED
            });
        }

        req.user = await User.findById(decodedToken.id)
            .select('firstName lastName email phoneNumber profilePicture _id')
            .lean();
        if (!req.user) {
            throw new AppError({
                name: 'User not found',
                message: 'Invalid User',
                httpCode: HttpCode.UNAUTHORIZED
            });
        }

        req.newToken = false;
        req.tokenExpiry = decodedToken.exp;

        // Renew token if expiring in less than 24 hours
        const timeLeft = decodedToken.exp * 1000 - Date.now();
        if (timeLeft < 86400000) {
            const newToken = generateToken(req.user._id);
            res.cookie('token', newToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
            });
            req.newToken = true;
            req.tokenExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
        }

        next();
    } catch (error) {
        res.clearCookie('token');
        next(error);
    }
};
