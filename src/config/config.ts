import dotenv from 'dotenv';

dotenv.config();

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 6000,
    mongoDBUrl: process.env.MONGO_URL || '',
    jwtSecret: process.env.JWT_SECRET || '',
    jwtIss: process.env.JWT_ISS || '',
    maxWrongAttemptsByIPperDay:
        process.env.MAX_WRONG_ATTEMPTS_BY_IP_PER_DAY as unknown as number || 1,
    maxConsecutiveFailsByEmailAndIP:
        process.env.MAX_CONSECUTIVE_FAILS_BY_EMAIL_AND_IP as unknown as number || 1,
    google: {
        googleClientID: process.env.GOOGLE_CLIENT_ID || '',
        googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        googleEmailSender: process.env.GOOGLE_EMAIL_SENDER || '',
        googleEmailSenderPassword:
            process.env.GOOGLE_EMAIL_SENDER_PASSWORD || '',
        googleEmailRefreshToken: process.env.GOOGLE_EMAIL_REFRESH_TOKEN || '',
        googleEmailRedirectURI: process.env.GOOGLE_EMAIL_REDIRECT_URI || ''
    },
    cloudinary: {
        name: process.env.CLOUDINARY_NAME || '',
        api_key: process.env.CLOUDINARY_API_KEY || '',
        api_secret: process.env.CLOUDINARY_API_SECRET || '',
        preset: process.env.CLOUDINARY_PRESET || ''
    },
    redis: {
        host: process.env.REDIS_HOST || '',
        port: process.env.REDIS_PORT || 6379,
    },
    clientHost: process.env.CLIENT_HOST || '',
    rollBarAccessToken: process.env.ROLLBAR_TOKEN || ''
};

export default config;
