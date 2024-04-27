import { Request, Response } from 'express';
import Clothes from '../clothes/models';
import { algorithm } from './util';

export const generateFit = async (req: Request, res: Response) => {
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
    console.log('SUCCESSFUL FIT:', fits);
    res.status(200).json({ fits });
};
