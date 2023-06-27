import { Request, Response } from 'express';
import Outfits from './models';
import { AppError, HttpCode, errorHandler } from '../../library/errorHandler';
import {
    deleteFromCloudinary,
    uploadToCloudinary
} from '../clothes/upload.service';

export const listOutfits = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const outfits = await Outfits.find({ userID: _id }).populate('clothes');
        res.status(200).json({ outfits });
    } catch (e) {
        const error = new Error(`Error occured during listing outfits: ${e}`);
        errorHandler.handleError(error, res);
    }
};
export const createOutfit = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        let imageUpload;
        if (req.file) {
            const buffer = req.file.buffer.toString('base64');
            imageUpload = await uploadToCloudinary(buffer);
        }
        const outfitData = {
            userID: _id,
            ...req.body
        };
        if (imageUpload) {
            outfitData['cloudinaryID'] = imageUpload.public_id;
            outfitData['coverImg'] = imageUpload.secure_url;
        }
        const newOutfit = await Outfits.create(outfitData);
        if (newOutfit) {
            return res.status(201).json(newOutfit);
        } else {
            const criticalError = new Error(
                'Failed to save new clothes instance'
            );
            return errorHandler.handleError(criticalError, res);
        }
    } catch (error) {
        const criticalError = new Error('Failed getting all Clothes');
        errorHandler.handleError(criticalError, res);
    }
};
export const listFavoriteOutfits = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const favoriteOutfits = await Outfits.find({
            userID: _id,
            favorited: true
        });
        return res.status(200).json({ favoriteOutfits });
    } catch (e) {
        const error = new Error(
            `Error occured during listing favorite outfits: ${e}`
        );
        errorHandler.handleError(error, res);
    }
};
export const favoriteOutfit = async (req: Request, res: Response) => {
    try {
        const outfitID = req.params.outfitID;
        const outfit = await Outfits.findByIdAndUpdate(outfitID, {
            favorited: true
        });
        if (outfit) {
            return res.status(200).json({ outfit });
        }
        const appError = new AppError({
            description: 'Unable to update outfit',
            httpCode: HttpCode.BAD_REQUEST
        });
        return errorHandler.handleError(appError, res);
    } catch (e) {
        const error = new Error(
            `Error occured during favoriting an outfit: ${e}`
        );
        errorHandler.handleError(error, res);
    }
};
export const unfavoriteOutfit = async (req: Request, res: Response) => {
    try {
        const outfitID = req.params.outfitID;
        const outfit = await Outfits.findByIdAndUpdate(outfitID, {
            favorited: false
        });
        if (outfit) {
            return res.status(200).json({ outfit });
        }
        const appError = new AppError({
            description: 'Unable to update outfit',
            httpCode: HttpCode.BAD_REQUEST
        });
        return errorHandler.handleError(appError, res);
    } catch (e) {
        const error = new Error(
            `Error occured during favoriting an outfit: ${e}`
        );
        errorHandler.handleError(error, res);
    }
};
export const updateOutfit = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const outfitID = req.params.outfitID;
        const selectedOutfit = await Outfits.findById(outfitID);
        let imageUpload;
        if (
            selectedOutfit &&
            String(selectedOutfit?.userID) === String(_id)
        ) {
            if (selectedOutfit.cloudinaryID && req.file) {
                await deleteFromCloudinary(selectedOutfit.cloudinaryID);
                const buffer = req.file.buffer.toString('base64');
                imageUpload = await uploadToCloudinary(buffer);
            } else if (req.file) {
                const buffer = req.file.buffer.toString('base64');
                imageUpload = await uploadToCloudinary(buffer);
            }
            let updateData = { ...req.body };
            if (imageUpload) {
                updateData['coverImg'] = imageUpload.secure_url;
                updateData['cloudinaryID'] = imageUpload.public_id;
            }
            const updatedOutfit = await Outfits.findByIdAndUpdate(
                outfitID,
                updateData,
                { new: true }
            );

            res.status(200).json(updatedOutfit);
        } else {
            const appError = new AppError({
                name: 'Unauthorized update',
                description:
                    'User does not match the associated user of the clothes',
                httpCode: HttpCode.UNAUTHORIZED
            });
            errorHandler.handleError(appError, res);
        }
    } catch (error) {
        const criticalError = new Error(
            `Failed to update clothes due to error: ${error}`
        );
        errorHandler.handleError(criticalError, res);
    }
};
export const deleteOutfit = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const outfitID = req.params.outfitID;
        if(!outfitID){
            const appError = new AppError({
                name: 'Param Requirements Not Met',
                description:
                    'outfitID was not sent to server',
                httpCode: HttpCode.BAD_REQUEST
            });
            errorHandler.handleError(appError, res);
        }
        const selectedOutfit = await Outfits.findById(outfitID);
        if(!selectedOutfit){
            const appError = new AppError({
                name: 'Document Not Found',
                description:
                    'Unable to find selection',
                httpCode: HttpCode.NOT_FOUND
            });
            errorHandler.handleError(appError, res);
        } else if (String(selectedOutfit.userID) === String(_id)) {
            if (selectedOutfit.cloudinaryID) {
                await deleteFromCloudinary(selectedOutfit.cloudinaryID);
            }
            await selectedOutfit.delete();
            res.status(200).json({ id: outfitID });
        } else  {
            const appError = new AppError({
                name: 'Unauthorized update',
                description:
                    'User does not match the associated user of the clothes',
                httpCode: HttpCode.UNAUTHORIZED
            });
            errorHandler.handleError(appError, res);
        }
    } catch (error) {
        const criticalError = new Error(
            `Failed to update clothes due to error: ${error}`
        );
        errorHandler.handleError(criticalError, res);
    }
};
