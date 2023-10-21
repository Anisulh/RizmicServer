import winston, { createLogger } from 'winston';
import config from '../config/config';

const level = () => {
    const isDevelopment = config.env === 'development';
    return isDevelopment ? 'debug' : 'warn';
};

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
};

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    debug: 'white'
};
winston.addColors(colors);

const format = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.errors({ stack: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.printf((info) =>
        info.stack
            ? ` ${info.timestamp} {
              level: ${info.level},
              message: ${info.message},
              stack: ${info.stack}
}`
            : ` ${info.timestamp} [${info.level}]: ${info.message} `
    )
);

const transports =
    config.env === 'production'
        ? [new winston.transports.Console()]
        : [
              new winston.transports.Console(),
              new winston.transports.File({ filename: 'logs/combined.log' }),
              new winston.transports.File({
                  filename: 'logs/error.log',
                  level: 'error'
              })
          ];

const logger = createLogger(
    config.env === 'production'
        ? { level: level(), levels, format, transports }
        : {
              level: level(),
              levels,
              format,
              transports,
              exceptionHandlers: [
                  new winston.transports.File({
                      filename: 'logs/exception.log'
                  })
              ],
              rejectionHandlers: [
                  new winston.transports.File({
                      filename: 'logs/rejections.log'
                  })
              ]
          }
);

logger.on('error', (err) => {
    console.log('Unable to log appropriately, Logger failed....', err);
    process.exit(1);
});

export default logger;
