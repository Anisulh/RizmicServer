import config from '../../../config/config';
import { Types } from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import User from '../model';
import { Response } from 'express';
import {
    AppError,
    errorHandler,
    HttpCode
} from '../../../library/errorHandler';
import { generateToken } from './jwt';

const client = new OAuth2Client(config.googleClientID);
interface IUser {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    password?: string;
    phoneNumber?: string;
    profilePicture?: string;
    token?: string;
}

const verifyGoogleToken = async (token: string) => {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.googleClientID
    });
    const payload = ticket.getPayload();
    return payload;
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
