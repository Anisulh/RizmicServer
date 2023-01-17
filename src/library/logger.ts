import winston, { createLogger } from 'winston';
import config from '../config/config';

const level = config.env === 'development' ? 'info' : 'warn';

const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
};
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'cyan',
    http: 'magenta',
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

const transports = [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.File({
        filename: 'logs/criticalError.log',
        level: 'criticalError'
    })
];

const logger = createLogger({
    level,
    levels,
    format,
    transports,
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exception.log' })
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' })
    ]
});

logger.on('error', () => {
    console.log('Unable to log appropriately, Logger failed....');
    process.exit(1);
});

export default logger;
