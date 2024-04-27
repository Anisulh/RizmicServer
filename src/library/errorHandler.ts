import { Request, Response } from 'express';
import { exitHandler } from './exitHandler';
import logger from './logger';
import { rollbar } from '../app';
import config from '../config/config';

export enum HttpCode {
    OK = 200,
    NO_CONTENT = 204,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    CONFLICT = 409,
    INTERNAL_SERVER_ERROR = 500
}
interface AppErrorArgs {
    name?: string;
    httpCode: HttpCode;
    description: string;
    isOperational?: boolean;
}

export class AppError extends Error {
    public readonly name: string;
    public readonly httpCode: HttpCode;
    public readonly isOperational: boolean = true;

    constructor(args: AppErrorArgs) {
        super(args.description);

        Object.setPrototypeOf(this, new.target.prototype);

        this.name = args.name || 'Error';
        this.httpCode = args.httpCode;

        if (args.isOperational !== undefined) {
            this.isOperational = args.isOperational;
        }

        Error.captureStackTrace(this);
    }
}

class ErrorHandler {
    private isTrustedError(error: Error): boolean {
        if (error instanceof AppError) {
            return error.isOperational;
        }
        return false;
    }
    private handleTrustedError(
        error: AppError,
        response: Response,
        request?: Request
    ): void {
        response.status(error.httpCode).json({ message: error.message });
        rollbar.error(error, request, { level: 'error' });
    }
    private handleCriticalError(
        error: Error,
        request?: Request,
        response?: Response
    ): void | Response {
        if (response) {
            return response.status(HttpCode.INTERNAL_SERVER_ERROR);
        }
        rollbar.error(error, request, { level: 'critical' });
        logger.error('Application encountered a critical error... ');
        logger.error(error);
        config.env !== 'production' && exitHandler.handleExit(0);
    }
    public handleError(
        error: Error | AppError,
        request?: Request,
        response?: Response
    ): void {
        if (this.isTrustedError(error) && response) {
            this.handleTrustedError(error as AppError, response, request);
        } else {
            this.handleCriticalError(error, request, response);
        }
    }
}

export const errorHandler = new ErrorHandler();
