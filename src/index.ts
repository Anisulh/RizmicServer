import { createHttpTerminator } from 'http-terminator';
import { createServer, proxy } from 'aws-serverless-express';
import config from './config/config';
import { injectExithandlerDependancy } from './library/exitHandler';
import logger from './library/logger';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { Application } from 'express';
import { initializeServer } from './server';

const awsHandler = async (event: APIGatewayProxyEvent, context: Context) => {
    const app: Application | null = await initializeServer();
    const server = createServer(app);
    context.callbackWaitsForEmptyEventLoop = false;
    console.log(`EVENT: ${JSON.stringify(event)}`);
    proxy(server, event, context);
};

const startServer = async () => {
    const app = await initializeServer();
    const server = app.listen(config.port, () => {
        logger.info(`Server is running on port: ${config.port}`);
    });
    const httpTerminator = createHttpTerminator({ server });
    injectExithandlerDependancy(server, httpTerminator);
};

if (config.env === 'production') {
    // Production mode, running on AWS Lambda
    exports.handler = awsHandler;
} else {
    // Development mode, running locally
    startServer();
}
