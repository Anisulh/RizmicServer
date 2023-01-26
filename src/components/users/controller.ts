import { Request, Response } from 'express';
import { AppError, errorHandler, HttpCode } from '../../library/errorHandler';
import User from './model';
import logger from '../../library/logger';
import config from '../../config/config';
import {
    limiterConsecutiveFailsByEmailAndIP,
    limiterSlowBruteByIP
} from '../../library/limiterInstances';
import { googleLogin, googleRegister } from './services/googleAuth';
import { emailLogin, emailRegister } from './services/emailAuth';

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const basicExistingUser = await User.findOne({ email });
        const googleToken: string | null =
            req.headers['authorization'] &&
            req.headers['authorization'].split(' ')[0] === 'Bearer'
                ? req.headers['authorization'].split(' ')[1]
                : null;

        if (basicExistingUser) {
            const appError = new AppError({
                name: 'Existing User Error',
                description: 'Unable to register, user already exists',
                httpCode: HttpCode.BAD_REQUEST
            });
            errorHandler.handleError(appError, res);
            return;
        }

        if (googleToken) {
            await googleRegister(googleToken, res);
        } else {
            const userData = req.body;
            await emailRegister(userData, res);
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            errorHandler.handleError(error, res);
        } else {
            logger.error('Unknown error occuring at registerUser controller');
        }
    }
};

export const loginUser = async (req: Request, res: Response) => {
    try {
        const getEmailIPkey = (email: string, ip: string) => `${email}_${ip}`;
        const { email, password } = req.body;
        const ipAddr = req.ip;
        const emailIPkey = getEmailIPkey(email, ipAddr);

        const googleToken: string | null =
            req.headers['authorization'] &&
            req.headers['authorization'].split(' ')[0] === 'Bearer'
                ? req.headers['authorization'].split(' ')[1]
                : null;

        const [resEmailAndIP, resSlowByIP] = await Promise.all([
            limiterConsecutiveFailsByEmailAndIP.get(emailIPkey),
            limiterSlowBruteByIP.get(ipAddr)
        ]);

        let retrySecs = 0;

        // Check if IP or Email + IP is already blocked
        if (
            resSlowByIP !== null &&
            resSlowByIP.consumedPoints > config.maxWrongAttemptsByIPperDay
        ) {
            retrySecs = Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
        } else if (
            resEmailAndIP !== null &&
            resEmailAndIP.consumedPoints >
                config.maxConsecutiveFailsByEmailAndIP
        ) {
            retrySecs = Math.round(resEmailAndIP.msBeforeNext / 1000) || 1;
        }

        if (retrySecs > 0) {
            res.set('Retry-After', String(retrySecs));
            res.status(429).send('Too Many Requests');
        } else {
            const basicUserDoc = await User.findOne({ email }).lean();
            if (basicUserDoc && basicUserDoc.password) {
                await emailLogin(
                    basicUserDoc,
                    res,
                    password,
                    limiterConsecutiveFailsByEmailAndIP,
                    limiterSlowBruteByIP,
                    resEmailAndIP,
                    ipAddr,
                    emailIPkey
                );
            } else if (googleToken) {
                await googleLogin(googleToken, res);
            } else {
                const error = new AppError({
                    httpCode: HttpCode.BAD_REQUEST,
                    description: 'User does not exist'
                });
                logger.error(error);
                errorHandler.handleError(error, res);
            }
        }
    } catch (error) {
        if (error instanceof Error) {
            logger.error(error);
            errorHandler.handleError(error, res);
        } else {
            const unknownError = new Error(
                'Unknown error occuring at loginUser controller'
            );
            logger.error(unknownError);
            errorHandler.handleError(unknownError, res);
        }
    }
};
