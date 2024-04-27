import { NextFunction, Request, Response } from 'express';

const convertFavoritedToBool = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (req.body.favorited) {
        req.body.favorited = req.body.favorited === 'true';
    }
    next();
};

export default convertFavoritedToBool;
