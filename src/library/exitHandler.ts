import { HttpTerminator } from 'http-terminator';
import mongoose from 'mongoose';

import logger from './logger';

let server: { listening: unknown };
let httpTerminator: HttpTerminator;


export const injectExitHandlerDependency = (
    s: { listening: unknown },
    h: HttpTerminator
) => {
    server = s;
    httpTerminator = h;
};

class ExitHandler {
    public async handleExit(code: number, timeout = 5000): Promise<void> {
        try {
            logger.info(`Attempting graceful shutdown with code: ${code}`);
            setTimeout(() => {
                logger.info(`Forcing a shutdown with code: ${code}`);
                process.exit(code);
            }, timeout).unref();

            if (server.listening) {
                logger.info('Terminating HTTP connections');
                await httpTerminator.terminate();
                await mongoose.connection.close();
            }
            logger.info(`Exiting gracefully with code ${code}`);
            process.exit(code);
        } catch (error) {
            logger.error(error);
            logger.error(
                `Unable to shutdown gracefully... Forcing exith with code: ${code}`
            );
            process.exit(code);
        }
    }
}

export const exitHandler = new ExitHandler();
