import { Request, Response } from 'express';
import { AppError, HttpCode } from '../../library/errorHandler';
import User from './model';
import config from '../../config/config';
import {
    limiterConsecutiveFailsByEmailAndIP,
    limiterSlowBruteByIP
} from '../../library/limiterInstances';
import bcrypt from 'bcrypt';
import sendEmail from './sendEmails';
import { forgotPasswordTemplate } from './ResetPassword/htmlTemplates';
import {
    deleteFromCloudinary,
    uploadToCloudinary
} from '../clothes/upload.service';
import { generateToken } from '../../library/jwt';
import { verifyGoogleToken } from './utils/verifyGoogleToken';
import { RateLimiterRes } from 'rate-limiter-flexible';

export const googleSignIn = async (req: Request, res: Response) => {
    const googleToken: string | null =
        req.headers['authorization'] &&
        req.headers['authorization'].split(' ')[0] === 'Bearer'
            ? req.headers['authorization'].split(' ')[1]
            : null;

    if (googleToken) {
        const payload = await verifyGoogleToken(googleToken);
        if (payload) {
            const { sub, email, given_name, family_name, picture } = payload;
            const existingUser = await User.findOne({ email })
                .select(' -_id firstName lastName profilePicture')
                .lean();
            if (existingUser) {
                res.cookie('token', generateToken(existingUser._id), {
                    httpOnly: true,
                    sameSite: 'strict',
                    secure: config.env === 'production' ? true : false
                });
                res.status(201).json(existingUser);
            }
            const createdUser = new User({
                googleID: sub,
                firstName: given_name,
                lastName: family_name,
                email: email,
                profilePicture: picture
            });
            await createdUser.save();
            const userData = {
                firstName: createdUser.firstName,
                lastName: createdUser.lastName,
                profilePicture: createdUser.profilePicture
            };
            res.cookie('token', generateToken(createdUser._id), {
                httpOnly: true,
                sameSite: 'strict',
                secure: config.env === 'production' ? true : false
            });
            res.status(201).json(userData);
        } else {
            throw new AppError({
                name: 'Google OAuth Error',
                message: 'Unable to register with google',
                httpCode: HttpCode.BAD_REQUEST
            });
        }
    } else {
        throw new AppError({
            httpCode: HttpCode.BAD_REQUEST,
            message: 'No token found'
        });
    }
};

export const registerUser = async (req: Request, res: Response) => {
    const { email } = req.body;
    const existingUser = await User.findOne({ email }).lean();

    if (existingUser) {
        throw new AppError({
            name: 'Existing User Error',
            message: 'Unable to register, user already exists',
            httpCode: HttpCode.BAD_REQUEST
        });
    }

    //add user to db
    const createdUser = new User(req.body);
    await createdUser.save();

    const userData = {
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        profilePicture: createdUser.profilePicture
    };
    res.cookie('token', generateToken(createdUser._id) as string, {
        httpOnly: true,
        sameSite: 'strict',
        secure: config.env === 'production' ? true : false
    });

    res.status(201).json(userData);
};

export const getEmailIPkey = (email: string, ip: string) => `${email}_${ip}`;

async function isRateLimited(
    emailIPkey: string,
    ipAddr: string
): Promise<number> {
    const [resEmailAndIP, resSlowByIP] = await Promise.all([
        limiterConsecutiveFailsByEmailAndIP.get(emailIPkey),
        limiterSlowBruteByIP.get(ipAddr)
    ]);

    if (
        resSlowByIP &&
        resSlowByIP.consumedPoints > config.maxWrongAttemptsByIPperDay
    ) {
        return Math.round(resSlowByIP.msBeforeNext / 1000) || 1;
    }
    if (
        resEmailAndIP &&
        resEmailAndIP.consumedPoints > config.maxConsecutiveFailsByEmailAndIP
    ) {
        return Math.round(resEmailAndIP.msBeforeNext / 1000) || 1;
    }
    return 0;
}

export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const ipAddr = req.ip;
    const emailIPkey = getEmailIPkey(email, ipAddr);
    const retrySecs = await isRateLimited(emailIPkey, ipAddr);

    if (retrySecs > 0) {
        res.set('Retry-After', String(retrySecs));
        res.status(429).send('Too Many Requests');
        return;
    }

    const existingUser = await User.findOne({ email }).lean();
    if (!existingUser) {
        throw new AppError({
            httpCode: HttpCode.BAD_REQUEST,
            message: 'User does not exist',
            name: 'User not found'
        });
    }
    const passwordIsValid = await bcrypt.compare(
        password,
        existingUser.password as string
    );
    if (!passwordIsValid) {
        try {
            await Promise.all([
                limiterSlowBruteByIP.consume(ipAddr),
                limiterConsecutiveFailsByEmailAndIP.consume(emailIPkey)
            ]);
            throw new AppError({
                httpCode: HttpCode.BAD_REQUEST,
                message: 'Invalid Credentials',
                name: 'Invalid Credentials'
            });
        } catch (rlRejected) {
            if (
                typeof rlRejected === 'object' &&
                rlRejected !== null &&
                'msBeforeNext' in rlRejected
            ) {
                const rateLimitError = rlRejected as RateLimiterRes;
                res.set(
                    'Retry-After',
                    String(Math.round(rateLimitError.msBeforeNext / 1000)) ||
                        '1'
                );
                res.status(429).send('Too Many Requests');
            } else {
                throw rlRejected;
            }
        }
    }

    // Reset on successful authorization
    await limiterConsecutiveFailsByEmailAndIP.delete(emailIPkey);

    const userData = {
        firstName: existingUser.firstName,
        lastName: existingUser.lastName,
        profilePicture: existingUser.profilePicture
    };
    res.cookie('token', generateToken(existingUser._id), {
        httpOnly: true,
        sameSite: 'strict',
        secure: config.env === 'production'
    });
    res.status(200).json(userData);
};

export const validateUser = async (req: Request, res: Response) => {
    res.status(200).json({ success: true });
};

export const logoutUser = async (req: Request, res: Response) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out' });
};

export const forgotUserPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        res.status(200).json({ message: 'Successful password reset sent' });
        return;
    }
    const resetToken = existingUser.createPasswordResetToken();
    const link = `${config.clientHost}/password-reset?token=${resetToken}`;
    const emailTemplate = forgotPasswordTemplate(existingUser?.firstName, link);
    await sendEmail(
        email,
        'Password Reset Request',
        { name: existingUser.firstName, link: link },
        emailTemplate
    );
    res.status(200).json({ message: 'Successful password reset sent' });
};

export const resetPassword = async (req: Request, res: Response) => {
    const { token } = req.params;
    const { password } = req.body;

    const existingUser = await User.findOne({ resetPasswordToken: token });

    if (!existingUser) {
        throw new AppError({
            httpCode: HttpCode.BAD_REQUEST,
            message: 'User does not exist'
        });
    }

    const result = await existingUser.resetPassword(token, password);

    if (result.success) {
        res.status(200).json({ message: result.message });
    } else {
        throw new AppError({
            httpCode: HttpCode.BAD_REQUEST,
            message: result.message
        });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    const { firstName, lastName, phoneNumber } = req.body;
    const { _id } = req.user;
    const updatedUser = await User.findByIdAndUpdate(
        _id,
        { firstName, lastName, phoneNumber },
        { new: true }
    )
        .select('-_id firstName lastName phoneNumber')
        .lean();

    res.status(200).json(updatedUser);
};

export const getUser = async (req: Request, res: Response) => {
    res.status(200).json(req.user);
};

export const changePassword = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const { currentPassword, newPassword } = req.body;

    const userInstance = await User.findById(_id);
    if (!userInstance) {
        throw new AppError({
            message: 'No user found',
            httpCode: HttpCode.NOT_FOUND
        });
    }
    if (userInstance.googleID) {
        userInstance.password = newPassword;
        await userInstance.save();
        res.status(200).json({});
    } else if (userInstance.password) {
        const isValid = await bcrypt.compare(
            currentPassword,
            userInstance.password
        );
        if (!isValid) {
            throw new AppError({
                message: 'Password does not match current password',
                httpCode: HttpCode.BAD_REQUEST
            });
        }
        userInstance.password = newPassword;
        await userInstance.save();
        res.status(200).json({});
    }
};

export const updateProfileImage = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const user = await User.findById(_id);

    if (!user) {
        throw new AppError({
            name: 'Unauthorized update',
            message: 'User does not match the associated user of the clothes',
            httpCode: HttpCode.UNAUTHORIZED
        });
    }
    if (!req.file) {
        throw new AppError({
            name: 'No image attached',
            message: 'There was no image attached in request',
            httpCode: HttpCode.BAD_REQUEST
        });
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
    }
    const updatedUser = await User.findByIdAndUpdate(_id, updateData, {
        new: true
    });
    const userData = {
        firstName: updatedUser?.firstName,
        lastName: updatedUser?.lastName,
        profilePicture: updatedUser?.profilePicture
    };
    res.status(200).json(userData);
};
