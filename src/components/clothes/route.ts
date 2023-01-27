import express from 'express';
import { authorization } from '../../middleware/authorization';
import {
    createClothes,
    deleteClothes,
    getAllClothes,
    getSpecificClothes,
    updateClothes
} from './controller';
const clothesRouter = express.Router();

clothesRouter
    .get('/', authorization, getAllClothes)
    .post('/', authorization, createClothes)
    .get('/:clothesId', authorization, getSpecificClothes)
    .put('/:clothesId', authorization, updateClothes)
    .delete('/:clothesId', authorization, deleteClothes);

export default clothesRouter;
