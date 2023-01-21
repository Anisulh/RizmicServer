import dotenv from 'dotenv';

dotenv.config();

const MONGO_USERNAME = process.env.MONGO_USERNAME || '';
const MONGO_PASSWORD = process.env.MONGO_PASSWORD || '';
const DB = process.env.DB_NAME || '';

const config = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 6000,
    mongoDBUrl: `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@databasecluster.2cgf66k.mongodb.net/${DB}?retryWrites=true&w=majority`,
    jwtSecret: process.env.JWT_SECRET || ''
};

export default config;
