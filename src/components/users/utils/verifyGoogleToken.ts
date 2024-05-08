import config from '../../../config/config';
import oauth2Client from '../../../library/googleOAuth';

export const verifyGoogleToken = async (token: string) => {
    try {
        const ticket = await oauth2Client.verifyIdToken({
            idToken: token,
            audience: config.google.googleClientID
        });
        const payload = ticket.getPayload();
        return payload;
    } catch (error) {
        return null;
    }
};
