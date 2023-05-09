import Joi from 'joi';

export const createOutfitsSchema = Joi.object({
    clothes: Joi.array().items(Joi.string()).required()
});


