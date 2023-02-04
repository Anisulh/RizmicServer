import config from '../../../config/config';
import { AnyObject, Types } from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import User from '../model';
import { Response } from 'express';
import {
    AppError,
    errorHandler,
    HttpCode
} from '../../../library/errorHandler';
import { generateToken } from './jwt';

const client = new OAuth2Client(config.google.googleClientID);
interface IUser {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    password?: string;
    phoneNumber?: string;
    profilePicture?: string;
    token?: string;
}

export const verifyGoogleToken = async (token: string) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: config.google.googleClientID
        });
        const payload = ticket.getPayload();
        return payload;
    } catch (error) {
        return null;
    }
};

export const googleRegister = async (googleToken: string, res: Response) => {
    const payload = await verifyGoogleToken(googleToken);
    if (payload) {
        const { sub, email, given_name, family_name, picture } = payload;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const appError = new AppError({
                name: 'Existing User Error',
                description: 'Unable to register, user already exists',
                httpCode: HttpCode.BAD_REQUEST
            });
            errorHandler.handleError(appError, res);
            return;
        }
        const createdUser: AnyObject = await User.create({
            googleID: sub,
            firstName: given_name,
            lastName: family_name,
            email: email,
            profilePicture: picture
        });
        if (createdUser) {
            const createdUserData: IUser = { ...createdUser._doc };
            createdUserData['token'] = generateToken(createdUserData._id);
            res.status(201).json(createdUserData);
        } else {
            const error = new Error('unable to save user instance');
            errorHandler.handleError(error, res);
        }
    } else {
        const appError = new AppError({
            name: 'Google OAuth Error',
            description: 'Unable to register with google',
            httpCode: HttpCode.BAD_REQUEST
        });
        errorHandler.handleError(appError, res);
        return;
    }
};

export const googleLogin = async (googleToken: string, res: Response) => {
    const payload = await verifyGoogleToken(googleToken);
    if (payload) {
        const { sub } = payload;
        const googleUserDoc = await User.findOne({
            email: payload.email
        }).lean();
        if (googleUserDoc && !googleUserDoc.googleID) {
            await User.findOneAndUpdate(
                { email: payload.email },
                { googleID: sub }
            );

            const user: IUser = googleUserDoc;
            user['token'] = generateToken(googleUserDoc._id);
            delete user.password;
            res.status(200).json(user);
        } else if (googleUserDoc && googleUserDoc.googleID === sub) {
            const user: IUser = googleUserDoc;
            user['token'] = generateToken(googleUserDoc._id);
            delete user.password;
            res.status(200).json(user);
        } else {
            const appError = new AppError({
                name: 'Google Login User Error',
                description: 'Unable to login, Google user does not exist',
                httpCode: HttpCode.BAD_REQUEST
            });
            errorHandler.handleError(appError, res);
            return;
        }
    }
};
