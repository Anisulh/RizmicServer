import express from 'express';
import { authorization } from '../../middleware/authorization';
import {
    createOutfit,
    favoriteOutfit,
    listFavoriteOutfits,
    listOutfits,
    unfavoriteOutfit
} from './controllers';
import { createOutfitsSchema } from './joiSchema';
import { reqValidation } from '../../middleware/reqValidation';

const outfitRouter = express.Router();

outfitRouter
    .get('/', authorization, listOutfits)
    .post('/', authorization, reqValidation(createOutfitsSchema), createOutfit)
    .get('/favorite', authorization, listFavoriteOutfits)
    .patch('/favorite/:outfitID', authorization, favoriteOutfit)
    .patch('/unfavorite/:outfitID', authorization, unfavoriteOutfit);
export default outfitRouter;
