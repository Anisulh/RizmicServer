import mongoose from 'mongoose';
import { errorHandler } from '../library/errorHandler';
import logger from '../library/logger';
import config from './config';

const dbConnection = async (): Promise<void> => {
    try {
        await mongoose.connect(config.mongoDBUrl);
        logger.info('Successfully connected to mongoDB');
        console.log("logging")
    } catch (error) {
        logger.error('Unable to connect to database');
        if (typeof error === 'string') {
            errorHandler.handleError(new Error(error));
        } else if (error instanceof Error) {
            errorHandler.handleError(error);
        } else {
            errorHandler.handleError(new Error('Unable to connect to mongoDB'));
        }
    }
};

export default dbConnection;


