import bcrypt from 'bcrypt';
import { Response } from 'express';
import { Types } from 'mongoose';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import {
    AppError,
    errorHandler,
    HttpCode
} from '../../../library/errorHandler';
import logger from '../../../library/logger';
import { generateToken } from './jwt';

interface IUser {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    password?: string;
    phoneNumber?: string;
    profilePicture?: string;
    token?: string;
}

export const emailLogin = async (
    basicUserDoc: IUser,
    res: Response,
    password: string,
    limiterConsecutiveFailsByEmailAndIP: RateLimiterRedis,
    limiterSlowBruteByIP: RateLimiterRedis,
    resEmailAndIP: RateLimiterRes | null,
    ipAddr: string,
    emailIPkey: string
) => {
    const passwordValidation = await bcrypt.compare(
        password,
        basicUserDoc.password as string
    );
    if (!passwordValidation) {
        // Consume 1 point from limiters on wrong attempt and block if limits reached
        try {
            const promises = [limiterSlowBruteByIP.consume(ipAddr)];
            promises.push(
                limiterConsecutiveFailsByEmailAndIP.consume(emailIPkey)
            );
            await Promise.all(promises);
            const error = new AppError({
                httpCode: HttpCode.BAD_REQUEST,
                description: 'Invalid Credentials'
            });
            logger.error(error);
            errorHandler.handleError(error, res);
        } catch (error: any) {
            if (error instanceof Error) {
                errorHandler.handleError(error, res);
            } else {
                res.set(
                    'Retry-After',
                    String(Math.round(error.msBeforeNext / 1000) || 1)
                );
                res.status(429).send('Too Many Requests');
            }
        }
    }
    if (resEmailAndIP !== null && resEmailAndIP.consumedPoints > 0) {
        // Reset on successful authorisation
        await limiterConsecutiveFailsByEmailAndIP.delete(emailIPkey);
    }
    const user: IUser = basicUserDoc;
    user['token'] = generateToken(basicUserDoc._id);
    delete user.password;
    res.status(200).json(user);
};
