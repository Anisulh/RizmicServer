import config from '../../config/config';
import cloudinary from '../../config/cloudinary.config';

export const uploadToCloudinary = async (buffer: string) => {
    try {
        const res = await cloudinary.uploader.upload(
            'data:image/png;base64,' + buffer,
            { upload_preset: config.cloudinary.preset }
        );

        return res;
    } catch (error) {
        throw error;
    }
};

export const deleteFromCloudinary = async (cloudinaryID: string) => {
    try {
        await cloudinary.uploader.destroy(cloudinaryID);
    } catch (error) {
        throw error;
    }
};
