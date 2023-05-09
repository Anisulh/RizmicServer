import { Request, Response } from 'express';
import Clothes from '../clothes/models';
import { algorithm } from './util';
import { errorHandler } from '../../library/errorHandler';

export const generateFit = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const { style } = req.body;
        console.log({_id, style})
        const tops = await Clothes.find({
            bodyLocation: 'upperbody',
            userID: _id
        });
        const bottoms = await Clothes.find({
            bodyLocation: 'lowerbody',
            userID: _id
        });

        const fits = algorithm(tops, bottoms, style);
        res.status(200).json({ fits });
    } catch (e) {
        const error = new Error(`Error occured during fit generation: ${e}`)
        errorHandler.handleError(error, res)
    }
};
