import mongoose from 'mongoose';
import { errorHandler } from '../library/errorHandler';
import logger from '../library/logger';
import config from './config';

const dbConnection = async (): Promise<void> => {
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(config.mongoDBUrl);
        logger.info('Successfully connected to mongoDB');
    } catch (error) {
        const criticalError = new Error(
            `Unknown error occured when connecting to MongoDB: ${error}`
        );
        errorHandler.handleError(criticalError);
    }
};

export default dbConnection;
