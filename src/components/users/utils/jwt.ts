import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import config from '../../../config/config';

//generate JWT token using user id
export const generateToken = (id: Types.ObjectId): string => {
    return jwt.sign({ id, iss: 'rizmic_fits' }, config.jwtSecret);
};
