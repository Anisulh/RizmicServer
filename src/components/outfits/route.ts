import express from 'express';
import { authorization } from '../../middleware/authorization';
import {
    createOutfit,
    deleteOutfit,
    favoriteOutfit,
    getSpecificOutfit,
    listFavoriteOutfits,
    listOutfits,
    shareOutfit,
    unfavoriteOutfit,
    updateOutfit
} from './controllers';
import {
    createOutfitsSchema,
    shareOutfitsSchema,
    updateOutfitsSchema
} from './validationSchema';
import { reqValidation } from '../../middleware/reqValidation';
import upload from '../../config/multer.config';
import asyncHandler from 'express-async-handler';
import convertFavoritedToBool from '../../middleware/convertFormDataTypes';

const outfitRouter = express.Router();

outfitRouter
    .get('/', authorization, asyncHandler(listOutfits))
    .get('/:outfitID', asyncHandler(getSpecificOutfit))
    .post(
        '/',
        authorization,
        upload.single('image'),
        convertFavoritedToBool,
        reqValidation(createOutfitsSchema),
        asyncHandler(createOutfit)
    )
    .put(
        '/:outfitID',
        authorization,
        upload.single('image'),
        convertFavoritedToBool,
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
    )
    .patch(
        '/share/:outfitID',
        authorization,
        reqValidation(shareOutfitsSchema),
        asyncHandler(shareOutfit)
    );
export default outfitRouter;
