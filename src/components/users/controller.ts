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
import { forgotPasswordTemplate } from './ResetPassword/htmlTemplates';
import {
    deleteFromCloudinary,
    uploadToCloudinary
} from '../clothes/upload.service';

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

export const forgotUserPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email });
        if (!existingUser) {
            const error = new AppError({
                httpCode: HttpCode.BAD_REQUEST,
                description: 'Error finding user'
            });
            errorHandler.handleError(error, res);
            return;
        }
        let token = await ResetToken.findOne({ userID: existingUser?._id });
        if (token) {
            await token.deleteOne();
        }
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hash = await bcrypt.hash(resetToken, 10);
        const resetTokenInstance = await ResetToken.create({
            userID: existingUser?._id,
            token: hash,
            createdAt: Date.now()
        });
        const link = `localhost:5173/passwordreset?token=${resetToken}&id=${existingUser?._id}`;
        const emailTemplate = forgotPasswordTemplate(
            existingUser?.firstName,
            link
        );
        const success = await sendEmail(
            email,
            'Password Reset Request',
            { name: existingUser?.firstName, link: link },
            emailTemplate
        );
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

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, phoneNumber } = req.body;
        const { _id } = req.user;
        const updatedUser = await User.findByIdAndUpdate(
            _id,
            { firstName, lastName, phoneNumber },
            { new: true }
        );
        res.status(200).json(updatedUser);
    } catch (error) {
        if (error instanceof Error) {
            logger.error(error);
            errorHandler.handleError(error, res);
        } else {
            const unknownError = new Error(
                'Unknown error occuring at updateProfile controller'
            );
            logger.error(unknownError);
            errorHandler.handleError(unknownError, res);
        }
    }
};

export const getUser = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const userInstince = await User.findById(_id).select('-password');
        if (userInstince) {
            return res.status(200).json(userInstince);
        } else {
            const appError = new AppError({
                description: 'No user found',
                httpCode: HttpCode.NOT_FOUND
            });
            errorHandler.handleError(appError, res);
            return;
        }
    } catch (error) {
        if (error instanceof Error) {
            logger.error(error);
            errorHandler.handleError(error, res);
        } else {
            const unknownError = new Error(
                'Unknown error occuring at updateProfile controller'
            );
            logger.error(unknownError);
            errorHandler.handleError(unknownError, res);
        }
    }
};

export const changePassword = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const { currentPassword, newPassword } = req.body;

        const userInstince = await User.findById(_id);
        if (userInstince && userInstince.password) {
            const isValid = await bcrypt.compare(
                currentPassword,
                userInstince.password
            );
            if (isValid) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(newPassword, salt);

                await User.findByIdAndUpdate(
                    _id,
                    { password: hashedPassword },
                    { new: true }
                );
                res.status(200).json({});
                return;
            } else {
                const appError = new AppError({
                    description: 'Password does not match current password',
                    httpCode: HttpCode.BAD_REQUEST
                });
                errorHandler.handleError(appError, res);
                return;
            }
        } else if (userInstince && userInstince.googleID) {
            await User.findByIdAndUpdate(
                _id,
                { password: newPassword },
                { new: true }
            );
            res.status(200);
            return;
        } else {
            const appError = new AppError({
                description: 'No user found',
                httpCode: HttpCode.NOT_FOUND
            });
            errorHandler.handleError(appError, res);
            return;
        }
    } catch (error) {
        if (error instanceof Error) {
            logger.error(error);
            errorHandler.handleError(error, res);
        } else {
            const unknownError = new Error(
                'Unknown error occuring at updateProfile controller'
            );
            logger.error(unknownError);
            errorHandler.handleError(unknownError, res);
        }
    }
};

export const updateProfileImage = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const user = await User.findById(_id);
        if (!user) {
            const appError = new AppError({
                name: 'Unauthorized update',
                description:
                    'User token does not match the associated user of the clothes',
                httpCode: HttpCode.UNAUTHORIZED
            });
            errorHandler.handleError(appError, res);
            return;
        }

        if (!req.file) {
            const appError = new AppError({
                name: 'No image attached',
                description: 'There was no image attached in request',
                httpCode: HttpCode.BAD_REQUEST
            });
            errorHandler.handleError(appError, res);
            return;
        }
        let imageUpload;

        if (user.cloudinaryID) {
            await deleteFromCloudinary(user.cloudinaryID);
            const buffer = req.file.buffer.toString('base64');
            imageUpload = await uploadToCloudinary(buffer);
        } else {
            const buffer = req.file.buffer.toString('base64');
            imageUpload = await uploadToCloudinary(buffer);
        }
        let updateData: Record<string, unknown> = {};
        if (imageUpload) {
            updateData['profilePicture'] = imageUpload.secure_url;
            updateData['cloudinaryID'] = imageUpload.public_id;
            console.log(updateData);
        }
        console.log(updateData);
        const updatedUser = await User.findByIdAndUpdate(_id, updateData, {
            new: true
        });
        res.status(200).json(updatedUser);
    } catch (error) {
        if (error instanceof Error) {
            logger.error(error);
            errorHandler.handleError(error, res);
        } else {
            const unknownError = new Error(
                'Unknown error occuring at updateProfileImage controller'
            );
            logger.error(unknownError);
            errorHandler.handleError(unknownError, res);
        }
    }
};
