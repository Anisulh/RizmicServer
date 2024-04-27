import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';  

export const reqValidation = (schema: ZodSchema<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body);
            next();
        } catch (error) {
           next(error)
        }
    };
};

