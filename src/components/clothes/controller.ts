import { Request, Response } from 'express';
import { AppError, errorHandler, HttpCode } from '../../library/errorHandler';
import Clothes from './models';
import { deleteFromCloudinary, uploadToCloudinary } from './upload.service';

export const getAllClothes = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const clothes = await Clothes.find({ userID: _id }).lean();
    res.status(200).json(clothes);
};

export const createClothes = async (req: Request, res: Response) => {
    const { _id } = req.user;
    let imageUpload;
    if (req.file) {
        const buffer = req.file.buffer.toString('base64');
        imageUpload = await uploadToCloudinary(buffer);
    }

    const clothesData = { ...req.body, userID: _id };
    if (imageUpload) {
        clothesData['cloudinaryID'] = imageUpload.public_id;
        clothesData['image'] = imageUpload.secure_url;
    }
    const newClothes = await Clothes.create(clothesData);

    res.status(201).json(newClothes);
};

export const getSpecificClothes = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const clothesId = req.params.clothesId;

    const requestedClothes = await Clothes.findOne({
        userID: _id,
        _id: clothesId
    }).lean();

    if (!requestedClothes) {
        const appError = new AppError({
            name: 'No clothes found',
            message:
                'Unable to find clothes matching the provided id or belonging to user',
            httpCode: HttpCode.NOT_FOUND
        });
        return errorHandler.handleError(appError, req, res);
    }
    res.status(200).json(requestedClothes);
};

export const updateClothes = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const clothesId = req.params.clothesId;
    const selectedClothes = await Clothes.findOne({
        userID: _id,
        _id: clothesId
    });
    if (!selectedClothes) {
        const appError = new AppError({
            name: 'No clothes found',
            message:
                'Unable to find clothes matching the provided id or belonging to user',
            httpCode: HttpCode.NOT_FOUND
        });
        return errorHandler.handleError(appError, req, res);
    }
    let imageUpload;

    if (selectedClothes.cloudinaryID && req.file) {
        await deleteFromCloudinary(selectedClothes.cloudinaryID);
        const buffer = req.file.buffer.toString('base64');
        imageUpload = await uploadToCloudinary(buffer);
    } else if (req.file) {
        const buffer = req.file.buffer.toString('base64');
        imageUpload = await uploadToCloudinary(buffer);
    }
    let updateData = { ...req.body };
    if (imageUpload) {
        updateData['image'] = imageUpload.secure_url;
        updateData['cloudinaryID'] = imageUpload.public_id;
    }
    const updatedClothes = await Clothes.findByIdAndUpdate(
        clothesId,
        updateData,
        { new: true }
    );

    res.status(200).json(updatedClothes);
};

export const deleteClothes = async (req: Request, res: Response) => {
    const { _id } = req.user;
    const clothesId = req.params.clothesId;
    const selectedClothes = await Clothes.findOne({
        userID: _id,
        _id: clothesId
    });
    if (!selectedClothes) {
        const appError = new AppError({
            name: 'No clothes found',
            message:
                'Unable to find clothes matching the provided id or belonging to user',
            httpCode: HttpCode.NOT_FOUND
        });
        return errorHandler.handleError(appError, req, res);
    }

    if (selectedClothes.cloudinaryID) {
        await deleteFromCloudinary(selectedClothes.cloudinaryID);
    }
    await selectedClothes.delete();
    res.status(200).json({ id: clothesId });
};
