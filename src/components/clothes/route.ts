import express from 'express';
import { authorization } from '../../middleware/authorization';
import { reqValidation } from '../../middleware/reqValidation';
import {
    createClothes,
    deleteClothes,
    getAllClothes,
    getSpecificClothes,
    updateClothes
} from './controller';
import { createClothesSchema, updateClothesSchema } from './validationSchema';
import upload from '../../config/multer.config';
import asyncHandler from 'express-async-handler';
import convertFavoritedToBool from '../../middleware/convertFavoritedToBool';

const clothesRouter = express.Router();

clothesRouter
    .get('/', authorization, getAllClothes)
    .post(
        '/',
        authorization,
        upload.single('image'),
        convertFavoritedToBool,
        reqValidation(createClothesSchema),
        asyncHandler(createClothes)
    )
    .get('/:clothesId', authorization, asyncHandler(getSpecificClothes))
    .put(
        '/:clothesId',
        authorization,
        convertFavoritedToBool,
        upload.single('image'),
        reqValidation(updateClothesSchema),
        asyncHandler(updateClothes)
    )
    .delete('/:clothesId', authorization, asyncHandler(deleteClothes));

export default clothesRouter;
