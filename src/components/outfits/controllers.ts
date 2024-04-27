import { Request, Response } from 'express';
import Outfits from './models';
import { AppError, HttpCode, errorHandler } from '../../library/errorHandler';
import {
    deleteFromCloudinary,
    uploadToCloudinary
} from '../clothes/upload.service';

export const listOutfits = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const outfits = await Outfits.find({ userID: _id })
        .populate('clothes')
        .lean();
    res.status(200).json({ outfits });
};

export const createOutfit = async (req: Request, res: Response) => {
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

    res.status(201).json(newOutfit);
};

export const listFavoriteOutfits = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const favoriteOutfits = await Outfits.find({
        userID: _id,
        favorited: true
    }).lean();
    res.status(200).json({ favoriteOutfits });
};

export const favoriteOutfit = async (req: Request, res: Response) => {
    const outfitID = req.params.outfitID;
    const outfit = await Outfits.findByIdAndUpdate(outfitID, {
        favorited: true
    }).lean();
    if (!outfit) {
        const appError = new AppError({
            message: 'Outfit does not exist',
            httpCode: HttpCode.BAD_REQUEST
        });
        return errorHandler.handleError(appError, req, res);
    }
    res.status(200).json({ outfit });
};
export const unfavoriteOutfit = async (req: Request, res: Response) => {
    const outfitID = req.params.outfitID;
    const outfit = await Outfits.findByIdAndUpdate(outfitID, {
        favorited: false
    }).lean();
    if (!outfit) {
        const appError = new AppError({
            message: 'Outfit does not exist',
            httpCode: HttpCode.BAD_REQUEST
        });
        return errorHandler.handleError(appError, req, res);
    }
    res.status(200).json({ outfit });
};
export const updateOutfit = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const outfitID = req.params.outfitID;
    const selectedOutfit = await Outfits.findById(outfitID);
    let imageUpload;
    if (selectedOutfit && String(selectedOutfit?.userID) === String(_id)) {
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
        ).lean();

        res.status(200).json(updatedOutfit);
    } else {
        const appError = new AppError({
            name: 'Unauthorized update',
            message: 'User does not match the associated user of the clothes',
            httpCode: HttpCode.UNAUTHORIZED
        });
        errorHandler.handleError(appError, req, res);
    }
};
export const deleteOutfit = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const outfitID = req.params.outfitID;
    if (!outfitID) {
        const appError = new AppError({
            name: 'Param Requirements Not Met',
            message: 'outfitID was not sent to server',
            httpCode: HttpCode.BAD_REQUEST
        });
        errorHandler.handleError(appError, req, res);
    }
    const selectedOutfit = await Outfits.findById(outfitID);
    if (!selectedOutfit) {
        const appError = new AppError({
            name: 'Document Not Found',
            message: 'Unable to find selection',
            httpCode: HttpCode.NOT_FOUND
        });
        errorHandler.handleError(appError, req, res);
    } else if (String(selectedOutfit.userID) === String(_id)) {
        if (selectedOutfit.cloudinaryID) {
            await deleteFromCloudinary(selectedOutfit.cloudinaryID);
        }
        await selectedOutfit.delete();
        res.status(200).json({ id: outfitID });
    } else {
        const appError = new AppError({
            name: 'Unauthorized update',
            message: 'User does not match the associated user of the clothes',
            httpCode: HttpCode.UNAUTHORIZED
        });
        errorHandler.handleError(appError, req, res);
    }
};
