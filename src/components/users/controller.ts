import { Request, Response } from 'express';
import { AppError, errorHandler, HttpCode } from '../../library/errorHandler';
import User from './model';
import bcrypt from 'bcrypt';
import { AnyObject, Types } from 'mongoose';
import logger from '../../library/logger';
import jwt from 'jsonwebtoken';
import config from '../../config/config';

interface IUser {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    password?: string;
    phoneNumber?: string;
    avatar?: string;
    token?: string;
}

//generate JWT token using user id
const generateToken = (id: Types.ObjectId): string => {
    return jwt.sign({ id }, config.jwtSecret);
};

export const registerUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        //check if user already exists
        console.log('registerUser');
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
        console.log(createdUser);
        if (createdUser) {
            const createdUserData: IUser = { ...createdUser._doc };
            createdUserData['token'] = generateToken(createdUserData._id);
            delete createdUserData.password;
            console.log(createdUserData);
            res.status(201).json(createdUserData);
        } else {
            console.log('unable to find user');
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

export const loginUser = async (req: Request, res: Response) => {
    try {
        const {email,password} = req.body;
        const user = await User.findOne({ email });

        //If user does not exist
        if (user){
            const passwordValidation = await bcrypt.compare(password,user.password) 
            //Invalid credentials
            if (!passwordValidation){
                const error = new AppError({
                    httpCode: HttpCode.INTERNAL_SERVER_ERROR,
                    description: 'Invalid Credentials'
                });
                logger.error(error);
                errorHandler.handleError(error, res);
            }
            const accessToken = generateToken(user.id);
            res.status(200).json({accessToken});
        }
        else {
            const error = new AppError({
                httpCode: HttpCode.INTERNAL_SERVER_ERROR,
                description: 'User does not exist'
            });
            logger.error(error);
            errorHandler.handleError(error, res);
        }

    } catch (error) {
        if (error instanceof Error){
            logger.error(error);
            errorHandler.handleError(error, res);
        }
        else {
            const unknownError = new Error('Unknown error occuring at loginUser controller');
            logger.error(unknownError);
            errorHandler.handleError(unknownError, res);
        }
    }
}