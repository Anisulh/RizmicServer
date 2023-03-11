import express from 'express';
import { authorization } from '../../middleware/authorization';
import { reqValidation } from '../../middleware/reqValidation';
import {
    createClothes,
    deleteClothes,
    getAllClothes,
    getSpecificClothes,
    updateClothes,
} from './controller';
import { createClothesSchema, updateClothesSchema } from './joiSchema';
import upload from '../../config/multer.config';
const clothesRouter = express.Router();

clothesRouter
    .get('/', authorization, getAllClothes)
    .post(
        '/',
        authorization,
        upload.single('image'),
        reqValidation(createClothesSchema),
        createClothes
    )
    .get('/:clothesId', authorization, getSpecificClothes)
    .put(
        '/:clothesId',
        authorization,
        upload.single('image'),
        reqValidation(updateClothesSchema),

        updateClothes
    )
    .delete('/:clothesId', authorization, deleteClothes)

export default clothesRouter;
