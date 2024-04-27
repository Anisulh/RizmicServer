import { OAuth2Client } from 'google-auth-library';
import config from '../../../config/config';

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
