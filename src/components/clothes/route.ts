import express from 'express';
import { authorization } from '../../middleware/authorization';
import { reqValidation } from '../../middleware/reqValidation';
import {
    createClothes,
    deleteClothes,
    favoriteClothes,
    getAllClothes,
    getSpecificClothes,
    unfavoriteClothes,
    updateClothes
} from './controller';
import { createClothesSchema, updateClothesSchema } from './validationSchema';
import upload from '../../config/multer.config';
import asyncHandler from 'express-async-handler';
import convertFromDataTypes from '../../middleware/convertFormDataTypes';

const clothesRouter = express.Router();

clothesRouter
    .get('/', authorization, getAllClothes)
    .post(
        '/',
        authorization,
        upload.single('image'),
        convertFromDataTypes,
        reqValidation(createClothesSchema),
        asyncHandler(createClothes)
    )
    .get('/:clothesId', authorization, asyncHandler(getSpecificClothes))
    .put(
        '/:clothesId',
        authorization,
        convertFromDataTypes,
        upload.single('image'),
        reqValidation(updateClothesSchema),
        asyncHandler(updateClothes)
    )
    .delete('/:clothesId', authorization, asyncHandler(deleteClothes))
    .patch('/favorite/:clothesID', authorization, asyncHandler(favoriteClothes))
    .patch(
        '/unfavorite/:clothesID',
        authorization,
        asyncHandler(unfavoriteClothes)
    );

export default clothesRouter;
