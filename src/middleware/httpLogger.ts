import morgan, { StreamOptions } from 'morgan';
import config from '../config/config';
import logger from '../library/logger';

const stream: StreamOptions = {
    write: (message) => logger.debug(message)
};

const skip = () => {
    const env = config.env || 'development';
    return env !== 'development';
};

const httpLogger = morgan('dev', { stream, skip });

export default httpLogger;
