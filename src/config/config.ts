import dotenv from 'dotenv';

dotenv.config();

const MONGO_USERNAME = process.env.MONGO_USERNAME || '';
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || '';
const DB = process.env.DB_NAME || '';

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 6000,
    mongoDBUrl: process.env.MONGO_URL || `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@databasecluster.2cgf66k.mongodb.net/${DB}?retryWrites=true&w=majority`,
    jwtSecret: process.env.JWT_SECRET || '',
    maxWrongAttemptsByIPperDay:
        process.env.MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY || 1,
    maxConsecutiveFailsByEmailAndIP:
        process.env.MAX_CONSECUTIVE_FAILS_BY_EMAIL_AND_IP || 1,
    hotmail: {
        hotmailEmailSender: process.env.HOTMAIL_EMAIL || '',
        hotmailPassword: process.env.HOTMAIL_PASSWORD || ''
    },
    google: {
        googleClientID: process.env.GOOGLE_CLIENT_ID || '',
        googleEmailSender: process.env.GOOGLE_EMAIL_SENDER || '',
        googleEmailClientID: process.env.GOOGLE_EMAIL_CLIENT_ID || '',
        googleEmailSenderPassword:
            process.env.GOOGLE_EMAIL_SENDER_PASSWORD || '',
        googleEmailClientSecret: process.env.GOOGLE_EMAIL_CLIENT_SECRET || '',
        googleEmailRefreshToken: process.env.GOOGLE_EMAIL_REFRESH_TOKEN || '',
        googleEmailRedirectURI: process.env.GOOGLE_EMAIL_REDIRECT_URI || ''
    },
    cloudinary: {
        name: process.env.CLOUDINARY_NAME || '',
        api_key: process.env.CLOUDINARY_API_KEY || '',
        api_secret: process.env.CLOUDINARY_API_SECRET || ''
    }
};

export default config;
