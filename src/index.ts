import { createHttpTerminator } from 'http-terminator';
import config from './config/config';
import { injectExitHandlerDependency } from './library/exitHandler';
import logger from './library/logger';
import { startApp } from './app';
import dbConnection from './config/dbConnection';
import './process';

const startServer = async () => {
    await dbConnection();
    const app = await startApp();
    const server = app.listen(config.port, () => {
        logger.info(`Server is running on port: ${config.port}`);
    });
    const httpTerminator = createHttpTerminator({ server });
    injectExitHandlerDependency(server, httpTerminator);
};

startServer();
