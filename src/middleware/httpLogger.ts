import morgan, { StreamOptions } from 'morgan';
import logger from '../library/logger';

const stream: StreamOptions = {
    write: (message) => logger.http(message)
};

const skip = () => {
    const env = process.env.NODE_ENV || 'development';
    return env !== 'development';
};

const httpLogger = morgan('dev', { stream, skip });

export default httpLogger;
