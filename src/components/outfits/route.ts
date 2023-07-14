import express from 'express';
import { authorization } from '../../middleware/authorization';
import {
    createOutfit,
    deleteOutfit,
    favoriteOutfit,
    listFavoriteOutfits,
    listOutfits,
    unfavoriteOutfit,
    updateOutfit
} from './controllers';
import { createOutfitsSchema, updateOutfitsSchema } from './joiSchema';
import { reqValidation } from '../../middleware/reqValidation';
import upload from '../../config/multer.config';

const outfitRouter = express.Router();

outfitRouter
    .get('/', authorization, listOutfits)
    .post(
        '/',
        authorization,
        upload.single('coverImg'),
        reqValidation(createOutfitsSchema),
        createOutfit
    )
    .put(
        '/:outfitID',
        authorization,
        upload.single('coverImg'),
        reqValidation(updateOutfitsSchema),
        updateOutfit
    )
    .delete('/:outfitID', authorization, deleteOutfit)
    .get('/favorite', authorization, listFavoriteOutfits)
    .patch('/favorite/:outfitID', authorization, favoriteOutfit)
    .patch('/unfavorite/:outfitID', authorization, unfavoriteOutfit);
export default outfitRouter;
