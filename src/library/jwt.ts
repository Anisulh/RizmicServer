import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import config from '../config/config';

//generate JWT token using user id
export const generateToken = (id: Types.ObjectId): string => {
    try {
        return jwt.sign({ id, iss: config.jwtIss }, config.jwtSecret, {
            expiresIn: '1w'
        });
    } catch (error) {
        console.error('Error generating JWT:', error);
        throw new Error('Failed to generate token');
    }
};
