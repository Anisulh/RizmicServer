import { Request, Response } from 'express';
import { AppError, errorHandler, HttpCode } from '../../library/errorHandler';
import Clothes from './models';
import { deleteFromCloudinary, uploadToCloudinary } from './upload.service';

export const getAllClothes = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const clothes = await Clothes.find({ userID: _id });
        res.status(200).json(clothes);
    } catch (error) {
        const criticalError = new Error('Failed getting all Clothes');
        errorHandler.handleError(criticalError, res);
    }
};

export const createClothes = async (req: Request, res: Response) => {
    try {
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
        if (newClothes) {
            res.status(201).json(newClothes);
        } else {
            const criticalError = new Error(
                'Failes to save new clothes instance'
            );
            errorHandler.handleError(criticalError, res);
        }
    } catch (error) {
        const criticalError = new Error('Failed getting all Clothes');
        errorHandler.handleError(criticalError, res);
    }
};

export const getSpecificClothes = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const clothesId = req.params.clothesId;

        const requestedClothes = await Clothes.findById(clothesId);

        if (String(requestedClothes?.userID) === String(_id)) {
            res.status(200).json(requestedClothes);
        } else {
            const appError = new AppError({
                name: 'No clothes found',
                description:
                    'Unable to find clothes matching the provided id or belonging to user',
                httpCode: HttpCode.NOT_FOUND
            });
            errorHandler.handleError(appError, res);
        }
    } catch (error) {
        const criticalError = new Error(
            `Unhandled error has occure in getSpecificClothes function: ${error} `
        );
        errorHandler.handleError(criticalError, res);
    }
};

export const updateClothes = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const clothesId = req.params.clothesId;
        const selectedClothes = await Clothes.findById(clothesId);
        let imageUpload;
        if (
            selectedClothes &&
            String(selectedClothes?.userID) === String(_id)
        ) {
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
        } else {
            const appError = new AppError({
                name: 'Unauthorized update',
                description:
                    'Wser token does not match the associated user of the clothes',
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

export const deleteClothes = async (req: Request, res: Response) => {
    try {
        const { _id } = req.user;
        const clothesId = req.params.clothesId;
        const selectedClothes = await Clothes.findById(clothesId);
        if (
            selectedClothes &&
            String(selectedClothes?.userID) === String(_id)
        ) {
            if (selectedClothes.cloudinaryID) {
                await deleteFromCloudinary(selectedClothes.cloudinaryID);
            }
            await selectedClothes.delete();
            res.status(200).json({ id: clothesId });
        } else {
            const appError = new AppError({
                name: 'Unauthorized update',
                description:
                    'User token does not match the associated user of the clothes',
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
