import { Request, Response } from 'express';
import { AppError, errorHandler, HttpCode } from '../../library/errorHandler';
import User, { ResetToken } from './model';
import logger from '../../library/logger';
import config from '../../config/config';
import {
    limiterConsecutiveFailsByEmailAndIP,
    limiterSlowBruteByIP
} from '../../library/limiterInstances';
import { googleLogin, googleRegister } from './services/googleAuth';
import { emailLogin, emailRegister } from './services/emailAuth';
import * as crypto from 'crypto';
import bcrypt from 'bcrypt';
import { any } from 'joi';
import sendEmail from './sendEmails';
import resetPassword from './ResetPassword/resetPassword';

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
        console.log(error);
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

export const forgotUserPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            console.log('user does not exist test');
            const error = new AppError({
                httpCode: HttpCode.BAD_REQUEST,
                description: 'Error finding user'
            });
            errorHandler.handleError(error, res);
            return;
        }
        console.log('user does exist test');
        let token = await ResetToken.findOne({ userID: existingUser?._id });
        if (token) {
            await token.deleteOne();
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(resetToken, 10);

        console.log({
            userID: existingUser?._id,
            token: hash,
            createdAt: Date.now()
        });
        console.log('before saving resetToken');
        const resetTokenInstance = await ResetToken.create({
            userID: existingUser?._id,
            token: hash,
            createdAt: Date.now()
        });
        console.log(resetTokenInstance);

        const link = `localhost:5173/passwordReset?token=${resetToken}&id=${existingUser?._id}`;
        console.log('before send email func');
        const success = await sendEmail(
            email,
            'Password Reset Request',
            { name: existingUser?.firstName, link: link },
            './ResetPassword/requestResetPassword.handlebars'
        );
        console.log('after send email func', success);
        if (success) {
            res.status(200).json({ message: 'Successful password reset sent' });
        } else {
            logger.error('Unable to send mail');
        }
    } catch (error) {
        const criticalError = new Error('Error sending email from controller');
        errorHandler.handleError(criticalError, res);
    }
};

export const resetPasswordController = async (req: Request, res: Response) => {
    const resetPasswordService = await resetPassword(
        req.body.userId,
        req.body.token,
        req.body.password,
        res
    );
    return res.status(200).json({ message: resetPasswordService });
};
