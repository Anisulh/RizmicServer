import { Request, Response } from 'express';
import Clothes from '../clothes/models';
import { algorithm } from './util';
import { errorHandler } from '../../library/errorHandler';

export const generateFit = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const { style, vibe } = req.body;
        const tops = await Clothes.find({
            bodyLocation: 'upperBody',
            userID: _id
        });
        const bottoms = await Clothes.find({
            bodyLocation: 'lowerBody',
            userID: _id
        });

        const fits = algorithm(tops, bottoms, style, vibe);
        console.log('Successful fit: ', tops, ' ', bottoms);
        res.status(200).json({ fits });
    } catch (e) {
        const criticalError = new Error(
            `Error occured during fit generation: ${e}`
        );
        errorHandler.handleError(criticalError, req, res);
    }
};
