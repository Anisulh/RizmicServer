import { OAuth2Client } from 'google-auth-library';
import config from '../config/config';
import { google } from 'googleapis';

const oauth2Client = new OAuth2Client(config.google.googleClientID);

// Nodemailer OAuth2
export const createEmailOAuth2Client = async () => {
    const oauth2Client = new google.auth.OAuth2(
        config.google.googleClientID,
        config.google.googleEmailClientSecret,
        'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({
        refresh_token: config.google.googleEmailRefreshToken
    });

    const accessToken = await oauth2Client.getAccessToken();

    if (!accessToken.token) {
        throw new Error('Failed to create access token');
    }

    return {
        accessToken: accessToken.token,
        oauth2Client
    };
};

export default oauth2Client;
