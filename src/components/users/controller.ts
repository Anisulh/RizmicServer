import { Request, Response } from 'express';
import { AppError, HttpCode } from '../../library/errorHandler';
import User from './model';
import config from '../../config/config';
import {
    limiterConsecutiveFailsByEmailAndIP,
    limiterSlowBruteByIP
} from '../../library/limiterInstances';
import bcrypt from 'bcrypt';
import { forgotPasswordTemplate } from './ResetPassword/htmlTemplates';
import {
    deleteFromCloudinary,
    uploadToCloudinary
} from '../../library/cloudinary';
import { generateToken } from '../../library/jwt';
import { verifyGoogleToken } from './utils/verifyGoogleToken';
import { RateLimiterRes } from 'rate-limiter-flexible';
import emailService from '../../library/sendEmail';
import Clothing from '../clothes/models';
import Outfits from '../outfits/models';

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
                .select('firstName lastName email profilePicture')
                .lean();
            if (existingUser) {
                res.cookie('token', generateToken(existingUser._id), {
                    httpOnly: true,
                    sameSite: 'strict',
                    secure: config.env === 'production' ? true : false
                });
                res.status(201).json({
                    user: existingUser,
                    tokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000
                });
                return;
            }
            const termsOfService = {
                agreed: req.body.termsAndPolicy,
                dateAgreed: new Date()
            };
            const privacyPolicy = {
                agreed: req.body.termsAndPolicy,
                dateAgreed: new Date()
            };
            const createdUser = new User({
                googleID: sub,
                firstName: given_name,
                lastName: family_name,
                email: email,
                profilePicture: picture,
                termsOfService,
                privacyPolicy
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
            res.status(201).json({
                user: userData,
                tokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000
            });
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
    const termsOfService = {
        agreed: req.body.termsAndPolicy,
        dateAgreed: new Date()
    };
    const privacyPolicy = {
        agreed: req.body.termsAndPolicy,
        dateAgreed: new Date()
    };
    const data = {
        ...req.body,
        termsOfService,
        privacyPolicy
    };
    //add user to db
    const createdUser = new User(data);
    await createdUser.save();

    const userData = {
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        profilePicture: createdUser.profilePicture,
        email: createdUser.email
    };
    res.cookie('token', generateToken(createdUser._id) as string, {
        httpOnly: true,
        sameSite: 'strict',
        secure: config.env === 'production' ? true : false
    });

    res.status(201).json({
        user: userData,
        tokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000
    });
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
    if (!existingUser || !existingUser.password) {
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
                res.status(429).json({ message: 'Too Many Requests' });
                return;
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
        profilePicture: existingUser.profilePicture,
        email: existingUser.email
    };
    res.cookie('token', generateToken(existingUser._id), {
        httpOnly: true,
        sameSite: 'strict',
        secure: config.env === 'production'
    });
    res.status(200).json({
        user: userData,
        tokenExpiry: Date.now() + 7 * 24 * 60 * 60 * 1000
    });
};

export const validateUser = async (req: Request, res: Response) => {
    if (req.newToken) {
        res.status(200).json({
            newToken: req.newToken,
            tokenExpiry: req.tokenExpiry
        });
    }
    res.status(200).json({ newToken: req.newToken });
};

export const logoutUser = async (req: Request, res: Response) => {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out' });
};

export const forgotUserPassword = async (req: Request, res: Response) => {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        throw new AppError({
            httpCode: HttpCode.BAD_REQUEST,
            message: 'User does not exist'
        });
    }
    const resetToken = existingUser.createPasswordResetToken();
    const link = `${config.clientHost}/password-reset?token=${resetToken}`;
    const emailTemplate = forgotPasswordTemplate(existingUser?.firstName, link);
    await emailService.sendEmail(
        email,
        'Password Reset Request',
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
    const updateData: Record<string, unknown> = {};
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

export const deleteUser = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const user = await User.findById(_id);
    if (!user) {
        throw new AppError({
            name: 'Unauthorized update',
            message: 'User does not match the associated user of the clothes',
            httpCode: HttpCode.UNAUTHORIZED
        });
    }

    const clothes = await Clothing.find({ userId: _id })
        .select('cloudinaryID')
        .lean();
    const outfits = await Outfits.find({ userId: _id })
        .select('cloudinaryID')
        .lean();

    // Collect all cloudinary ids
    const cloudinaryIDs = clothes
        .map((item) => item.cloudinaryID)
        .concat(outfits.map((item) => item.cloudinaryID));

    cloudinaryIDs.forEach(async (cloudinaryID) => {
        if (cloudinaryID) await deleteFromCloudinary(cloudinaryID);
    });
    await Clothing.deleteMany({ userID: _id });
    await Outfits.deleteMany({ userID: _id });
    await User.findByIdAndDelete(_id);
    res.status(200).json({ message: 'User deleted' });
};

export const searchUser = async (req: Request, res: Response) => {
    const { query } = req.query;
    const users = await User.find({
        $or: [
            { firstName: { $regex: query as string, $options: 'i' } },
            { lastName: { $regex: query as string, $options: 'i' } },
            { email: { $regex: query as string, $options: 'i' } }
        ]
    })
        .select('firstName lastName email profilePicture')
        .lean();
    res.status(200).json(users);
};
