import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import config from '../../../config/config';
import { errorHandler } from '../../../library/errorHandler';

//generate JWT token using user id
export const generateToken = (id: Types.ObjectId): string|void => {
    try {
        return jwt.sign({ id, iss: 'rizmic_fits'}, config.jwtSecret);
    } catch (error) {
        const criticalError = new Error(`Error occured when generating token: ${error}`)
        return errorHandler.handleError(criticalError)
    }
};
