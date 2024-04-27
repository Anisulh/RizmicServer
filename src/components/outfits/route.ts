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
import { createOutfitsSchema, updateOutfitsSchema } from './validationSchema';
import { reqValidation } from '../../middleware/reqValidation';
import upload from '../../config/multer.config';
import asyncHandler from 'express-async-handler';

const outfitRouter = express.Router();

outfitRouter
    .get('/', authorization, asyncHandler(listOutfits))
    .post(
        '/',
        authorization,
        upload.single('coverImg'),
        reqValidation(createOutfitsSchema),
        asyncHandler(createOutfit)
    )
    .put(
        '/:outfitID',
        authorization,
        upload.single('coverImg'),
        reqValidation(updateOutfitsSchema),
        asyncHandler(updateOutfit)
    )
    .delete('/:outfitID', authorization, asyncHandler(deleteOutfit))
    .get('/favorite', authorization, asyncHandler(listFavoriteOutfits))
    .patch('/favorite/:outfitID', authorization, asyncHandler(favoriteOutfit))
    .patch(
        '/unfavorite/:outfitID',
        authorization,
        asyncHandler(unfavoriteOutfit)
    );
export default outfitRouter;
