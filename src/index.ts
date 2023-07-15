import { createHttpTerminator } from 'http-terminator';
import serverlessExpress from 'aws-serverless-express';
import config from './config/config';
import { injectExithandlerDependancy } from './library/exitHandler';
import logger from './library/logger';
import app from './server';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';



if (config.env === 'production') {
    // Production mode, running on AWS Lambda
    const server = serverlessExpress.createServer(app);
    exports.handler = (event: APIGatewayProxyEvent, context: Context) => {
      context.callbackWaitsForEmptyEventLoop = false;
      console.log(`EVENT: ${JSON.stringify(event)}`);
      serverlessExpress.proxy(server, event, context);
    };
  } else {
    // Development mode, running locally
    const server = app.listen(config.port, () => {
      logger.info(`Server is running on port: ${config.port}`);
    });
    const httpTerminator = createHttpTerminator({ server });
    injectExithandlerDependancy(server, httpTerminator);
  }
