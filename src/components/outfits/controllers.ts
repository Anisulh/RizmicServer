import { Request, Response } from 'express';
import Outfit from './models';
import { AppError, HttpCode } from '../../library/errorHandler';
import {
    deleteFromCloudinary,
    uploadToCloudinary
} from '../../library/cloudinary';

export const listOutfits = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const outfits = await Outfit.find({ userID: _id })
        .populate('clothes')
        .lean();
    res.status(200).json(outfits);
};

export const getSpecificOutfit = async (req: Request, res: Response) => {
    const outfitID = req.params.outfitID;
    const outfit = await Outfit.findOne({ _id: outfitID })
        .populate('clothes', 'name category image _id size')
        .lean();
    if (!outfit) {
        throw new AppError({
            message: 'Outfit does not exist',
            httpCode: HttpCode.BAD_REQUEST
        });
    }
    res.status(200).json(outfit);
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
        outfitData['image'] = imageUpload.secure_url;
    }
    const newOutfit = await Outfit.create(outfitData);

    res.status(201).json(newOutfit);
};

export const listFavoriteOutfits = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const favoriteOutfit = await Outfit.find({
        userID: _id,
        favorited: true
    }).lean();
    res.status(200).json({ favoriteOutfit });
};

export const favoriteOutfit = async (req: Request, res: Response) => {
    const outfitID = req.params.outfitID;

    const outfit = await Outfit.findByIdAndUpdate(outfitID, {
        favorited: true
    }).lean();
    if (!outfit) {
        throw new AppError({
            message: 'Outfit does not exist',
            httpCode: HttpCode.BAD_REQUEST
        });
    }
    res.status(200).json({ outfit });
};

export const unfavoriteOutfit = async (req: Request, res: Response) => {
    const outfitID = req.params.outfitID;

    const outfit = await Outfit.findByIdAndUpdate(outfitID, {
        favorited: false
    }).lean();
    if (!outfit) {
        throw new AppError({
            message: 'Outfit does not exist',
            httpCode: HttpCode.BAD_REQUEST
        });
    }
    res.status(200).json({ outfit });
};

export const updateOutfit = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const outfitID = req.params.outfitID;

    const selectedOutfit = await Outfit.findOne({
        _id: outfitID,
        userID: _id
    });

    if (!selectedOutfit) {
        throw new AppError({
            name: 'No outfit found',
            message:
                'Unable to find outfit matching the provided id or belonging to user',
            httpCode: HttpCode.NOT_FOUND
        });
    }

    let imageUpload;

    if (selectedOutfit.cloudinaryID && req.file) {
        await deleteFromCloudinary(selectedOutfit.cloudinaryID);
        const buffer = req.file.buffer.toString('base64');
        imageUpload = await uploadToCloudinary(buffer);
    } else if (req.file) {
        const buffer = req.file.buffer.toString('base64');
        imageUpload = await uploadToCloudinary(buffer);
    }
    const updateData = { ...req.body };
    if (imageUpload) {
        updateData['image'] = imageUpload.secure_url;
        updateData['cloudinaryID'] = imageUpload.public_id;
    }
    const updatedOutfit = await Outfit.findByIdAndUpdate(outfitID, updateData, {
        new: true
    }).lean();

    res.status(200).json(updatedOutfit);
};

export const deleteOutfit = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const outfitID = req.params.outfitID;

    const selectedOutfit = await Outfit.findOne({
        _id: outfitID,
        userID: _id
    });
    if (!selectedOutfit) {
        throw new AppError({
            name: 'No outfit found',
            message:
                'Unable to find outfit matching the provided id or belonging to user',
            httpCode: HttpCode.NOT_FOUND
        });
    }
    if (selectedOutfit.cloudinaryID) {
        await deleteFromCloudinary(selectedOutfit.cloudinaryID);
    }
    await selectedOutfit.delete();
    res.status(200).json({ id: outfitID });
};
