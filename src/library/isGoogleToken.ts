import { errorHandler } from './errorHandler';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import { verifyGoogleToken } from '../components/users/services/googleAuth';

export const isGoogleToken = async (token: string | null) => {
    try {
        if (token) {
            const decodedToken = jwt.verify(token, config.jwtSecret) as {
                id: string;
            };
            if (decodedToken && decodedToken.id) {
                return false;
            }
            const googleToken = await verifyGoogleToken(token);
            if (googleToken) {
                return true;
            }
        }
        return false;
    } catch (error) {
        const criticalError = new Error(
            `Failed to differentiate tokens due to error: ${error}`
        );
        errorHandler.handleError(criticalError);
    }
};
