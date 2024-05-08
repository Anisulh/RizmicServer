import { v2 as cloudinary } from 'cloudinary';
import config from '../config/config';

cloudinary.config({
    cloud_name: config.cloudinary.name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});

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

export default cloudinary;
