import { createHttpTerminator } from 'http-terminator';
import config from './config/config';
import { injectExithandlerDependancy } from './library/exitHandler';
import logger from './library/logger';
import app from './server';

const server = app.listen(config.port, () => {
    logger.info(`Server is running on port: ${config.port}`);
});

const httpTerminator = createHttpTerminator({ server });




injectExithandlerDependancy(server, httpTerminator);
