import cloudinary from 'cloudinary'
import multer from 'multer';
import { errorHandler } from '../../library/errorHandler';

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const memoryStorage = multer.memoryStorage();

const upload = multer({
    storage: memoryStorage
});

const uploadToCloudinary = async (fileString: any, format: any) => {
    try {
        const { uploader } = cloudinary.v2;

        const res = await uploader.upload(
            `data:image/${format};base64,${fileString}`
        );

        return res;
    } catch (error) {
      const criticalError = new Error(`Unable to upload images due to the following error: ${error}`)
        errorHandler.handleError(criticalError)
    }
};
