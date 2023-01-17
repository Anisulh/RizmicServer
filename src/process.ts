import { errorHandler } from './library/errorHandler';
import { exitHandler } from './library/exitHandler';
import logger from './library/logger';

process.on('unhandledRejection', (error: Error | unknown) => {
    if (error instanceof Error) {
        logger.error(error);
    } else if (typeof error === 'string') {
        logger.error(new Error(error));
    }
});

process.on('uncaughtException', (error: Error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    errorHandler.handleError(error);
});

process.on('SIGTERM', () => {
    logger.error(
        `Process ${process.pid} received SIGTERM: Exiting with code 0`
    );
    exitHandler.handleExit(0);
});

process.on('SIGINT', () => {
    logger.error(`Process ${process.pid} received SIGINT: Exiting with code 0`);
    exitHandler.handleExit(0);
});
