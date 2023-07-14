import Joi from 'joi';

export const createOutfitsSchema = Joi.object({
    name: Joi.string().min(3).max(50),
    clothes: Joi.array().required(),
    coverImg: Joi.any(),
    favorited: Joi.boolean()
});

export const updateOutfitsSchema = Joi.object({
    name: Joi.string().min(3).max(50),
    clothes: Joi.array(),
    coverImg: Joi.any(),
    favorited: Joi.boolean()
});


