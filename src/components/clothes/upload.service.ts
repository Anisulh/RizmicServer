import config from '../../config/config';
import cloudinary from '../../config/cloudinary.config';
import { errorHandler } from '../../library/errorHandler';

export const uploadToCloudinary = async (buffer: string) => {
    try {
        const res = await cloudinary.uploader.upload(
            'data:image/png;base64,' + buffer,
            { upload_preset: config.cloudinary.preset }
        );

        return res;
    } catch (error) {
        const criticalError = new Error(
            `Unable to upload images due to the following error: ${error}`
        );
        errorHandler.handleError(criticalError);
    }
};

export const deleteFromCloudinary = async (cloudinaryID: string) => {
    try {
        await cloudinary.uploader.destroy(cloudinaryID)
    } catch (error) {
        const criticalError = new Error(
            `Unable to remove images due to the following error: ${error}`
        );
        errorHandler.handleError(criticalError);
    }
    
};
