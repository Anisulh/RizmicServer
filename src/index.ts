import { createHttpTerminator } from 'http-terminator';
import config from './config/config';
import { injectExithandlerDependancy } from './library/exitHandler';
import logger from './library/logger';

import { initializeServer } from './server';

const startServer = async () => {
    const app = await initializeServer();
    const server = app.listen(config.port, () => {
        logger.info(`Server is running on port: ${config.port}`);
    });
    const httpTerminator = createHttpTerminator({ server });
    injectExithandlerDependancy(server, httpTerminator);
};

startServer();
