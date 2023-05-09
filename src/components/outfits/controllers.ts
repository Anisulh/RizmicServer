import { Request, Response } from 'express';
import Outifts from './models';
import { errorHandler } from '../../library/errorHandler';
export const listOutfits = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const outfits = await Outifts.find({ userID: _id });
        res.status(200).json({ outfits });
    } catch (e) {
        const error = new Error(`Error occured during listing outfits: ${e}`);
        errorHandler.handleError(error, res);
    }
};
export const createOutfit = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const { clothes } = req.body; //an array of clothesID
        const createdOutfit = await Outifts.create({ userID: _id, clothes });
        res.status(201).json({ createdOutfit });
    } catch (e) {
        const error = new Error(`Error occured during creating outfits: ${e}`);
        errorHandler.handleError(error, res);
    }
};
export const listFavoriteOutfits = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const favoriteOutfits = await Outifts.find({
            userID: _id,
            favorited: true
        });
        res.status(200).json({ favoriteOutfits });
    } catch (e) {
        const error = new Error(
            `Error occured during listing favorite outfits: ${e}`
        );
        errorHandler.handleError(error, res);
    }
};
export const favoriteOutfit = async (req: Request, res: Response) => {
    try {
        const outfitID  = req.params.outfitID;
        const outfit = Outifts.findByIdAndUpdate(
            outfitID,
            { favorited: true },
            { new: true }
        );
        res.status(200).json({outfit});
    } catch (e) {
        const error = new Error(
            `Error occured during favoriting an outfit: ${e}`
        );
        errorHandler.handleError(error, res);
    }
};
export const unfavoriteOutfit = async (req: Request, res: Response) => {
	try {
			const outfitID  = req.params.outfitID;
			const outfit = Outifts.findByIdAndUpdate(
					outfitID,
					{ favorited: false },
					{ new: true }
			);
			res.status(200).json({outfit});
	} catch (e) {
			const error = new Error(
					`Error occured during favoriting an outfit: ${e}`
			);
			errorHandler.handleError(error, res);
	}
};

