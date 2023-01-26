import { Request, Response } from 'express';
import { AppError, errorHandler, HttpCode } from '../../library/errorHandler';
import User from './model';
import bcrypt from 'bcrypt';
import { AnyObject, Types } from 'mongoose';
import logger from '../../library/logger';
import jwt from 'jsonwebtoken';
import config from '../../config/config';
import { OAuth2Client } from 'google-auth-library';
import {
    limiterConsecutiveFailsByEmailAndIP,
    limiterSlowBruteByIP
} from '../../library/limiterInstances';

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

//generate JWT token using user id
const generateToken = (id: Types.ObjectId): string => {
    return jwt.sign({ id }, config.jwtSecret);
};

const verifyGoogleToken = async (token: string) => {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.googleClientID
    });
    const payload = ticket.getPayload();
    return payload;
};

export const registerUser = async (req: Request, res: Response) => {
    try {
        if (
            req.headers['authorization'] &&
            req.headers['authorization'].split(' ')[0] === 'Bearer'
        ) {
            const googleToken = req.headers['authorization'].split(' ')[1];
            const payload = await verifyGoogleToken(googleToken);
            if (payload) {
                const { sub, email, given_name, family_name, picture } =
                    payload;
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
                    createdUserData['token'] = generateToken(
                        createdUserData._id
                    );
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
        }
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            errorHandler.handleError(
                new AppError({
                    name: 'Existing User Error',
                    description: 'Unable to register, user already exists',
                    httpCode: HttpCode.BAD_REQUEST
                }),
                res
            );
            return;
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const userData = req.body;
        userData.password = hashedPassword;
        delete userData.confirmPassword;

        //add user to db
        const createdUser: AnyObject = await User.create(userData);
        if (createdUser) {
            const createdUserData: IUser = { ...createdUser._doc };
            createdUserData['token'] = generateToken(createdUserData._id);
            delete createdUserData.password;
            res.status(201).json(createdUserData);
        } else {
            const error = new AppError({
                httpCode: HttpCode.INTERNAL_SERVER_ERROR,
                description: 'Unable to save new user instance'
            });
            errorHandler.handleError(error, res);
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            errorHandler.handleError(error, res);
        } else {
            logger.error('Unknown error occuring at registerUser controller');
        }
    }
};

const getEmailIPkey = (email: string, ip: string) => `${email}_${ip}`;

export const loginUser = async (req: Request, res: Response) => {
    try {
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
                const passwordValidation = await bcrypt.compare(
                    password,
                    basicUserDoc.password
                );
                if (!passwordValidation) {
                    // Consume 1 point from limiters on wrong attempt and block if limits reached
                    try {
                        const promises = [limiterSlowBruteByIP.consume(ipAddr)];
                        promises.push(
                            limiterConsecutiveFailsByEmailAndIP.consume(
                                emailIPkey
                            )
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
                                String(
                                    Math.round(error.msBeforeNext / 1000) || 1
                                )
                            );
                            res.status(429).send('Too Many Requests');
                        }
                    }
                }
                if (
                    resEmailAndIP !== null &&
                    resEmailAndIP.consumedPoints > 0
                ) {
                    // Reset on successful authorisation
                    await limiterConsecutiveFailsByEmailAndIP.delete(
                        emailIPkey
                    );
                }
                const user: IUser = basicUserDoc;
                user['token'] = generateToken(basicUserDoc._id);
                delete user.password;
                res.status(200).json(user);
            } else if (googleToken) {
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
                    } else if (
                        googleUserDoc &&
                        googleUserDoc.googleID === sub
                    ) {
                        const user: IUser = googleUserDoc;
                        user['token'] = generateToken(googleUserDoc._id);
                        delete user.password;
                        res.status(200).json(user);
                    } else {
                        const appError = new AppError({
                            name: 'Google Login User Error',
                            description:
                                'Unable to login, Google user does not exist',
                            httpCode: HttpCode.BAD_REQUEST
                        });
                        errorHandler.handleError(appError, res);
                        return;
                    }
                }
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
