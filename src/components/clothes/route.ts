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
import { createClothesSchema, updateClothesSchema } from './joiSchema';
const clothesRouter = express.Router();

clothesRouter
    .get('/', authorization, getAllClothes)
    .post('/', authorization, reqValidation(createClothesSchema), createClothes)
    .get('/:clothesId', authorization, getSpecificClothes)
    .put(
        '/:clothesId',
        authorization,
        reqValidation(updateClothesSchema),
        updateClothes
    )
    .delete('/:clothesId', authorization, deleteClothes);

export default clothesRouter;
