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
import convertFavoritedToBool from '../../middleware/convertFavoritedToBool';

const outfitRouter = express.Router();

outfitRouter
    .get('/', authorization, asyncHandler(listOutfits))
    .post(
        '/',
        authorization,
        convertFavoritedToBool,
        upload.single('image'),
        reqValidation(createOutfitsSchema),
        asyncHandler(createOutfit)
    )
    .put(
        '/:outfitID',
        authorization,
        convertFavoritedToBool,
        upload.single('image'),
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
