import config from '../../../config/config';
import { AnyObject } from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import User from '../model';
import { Request, Response } from 'express';
import {
    AppError,
    errorHandler,
    HttpCode
} from '../../../library/errorHandler';
import { generateToken } from './jwt';
import { IUser } from '../interface';

const client = new OAuth2Client(config.google.googleClientID);

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

export const googleRegister = async (
    googleToken: string,
    req: Request,
    res: Response
) => {
    try {
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
                errorHandler.handleError(appError, req, res);
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
                const userData = {
                    firstName: createdUserData.firstName,
                    lastName: createdUserData.lastName,
                    profilePicture: createdUserData.profilePicture
                };
                res.cookie(
                    'token',
                    generateToken(createdUserData._id) as string,
                    {
                        httpOnly: true,
                        sameSite: 'strict', // helps to prevent CSRF attacks
                        secure: config.env === 'production' ? true : false // ensures the cookie is only sent over HTTPS or not
                    }
                );
                res.status(201).json(userData);
            } else {
                const criticalError = new Error('unable to save user instance');
                errorHandler.handleError(criticalError, req, res);
            }
        } else {
            const appError = new AppError({
                name: 'Google OAuth Error',
                description: 'Unable to register with google',
                httpCode: HttpCode.BAD_REQUEST
            });
            errorHandler.handleError(appError, req, res);
            return;
        }
    } catch (error) {
        const criticalError = new Error(
            `Unknown error occured in googleRegister: ${error}`
        );
        errorHandler.handleError(criticalError, req, res);
    }
};

export const googleLogin = async (
    googleToken: string,
    req: Request,
    res: Response
) => {
    try {
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
                delete user.password;
                res.cookie('token', generateToken(user._id) as string, {
                    httpOnly: true,
                    sameSite: 'strict', // helps to prevent CSRF attacks
                    secure: config.env === 'production' ? true : false // ensures the cookie is only sent over HTTPS or not
                });
                res.status(200).json(user);
            } else if (googleUserDoc && googleUserDoc.googleID === sub) {
                const userData = {
                    firstName: googleUserDoc.firstName,
                    lastName: googleUserDoc.lastName,
                    profilePicture: googleUserDoc.profilePicture
                };
                res.cookie(
                    'token',
                    generateToken(googleUserDoc._id) as string,
                    {
                        httpOnly: true,
                        sameSite: 'strict', // helps to prevent CSRF attacks
                        secure: false // ensures the cookie is only sent over HTTPS or not
                    }
                );
                res.status(200).json(userData);
            } else {
                const appError = new AppError({
                    name: 'Google Login User Error',
                    description: 'Unable to login, Google user does not exist',
                    httpCode: HttpCode.BAD_REQUEST
                });
                errorHandler.handleError(appError, req, res);
                return;
            }
        }
    } catch (error) {
        const criticalError = new Error(
            `Unknown error occured in googleLogin: ${error}`
        );
        errorHandler.handleError(criticalError, req, res);
    }
};
