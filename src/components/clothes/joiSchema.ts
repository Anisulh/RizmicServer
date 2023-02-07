import Joi from 'joi';

export const createClothesSchema = Joi.object({
    category: Joi.string()
        .valid(
            'tshirt',
            'jacket',
            'sweater',
            'top',
            'shirt',
            'dress',
            'pants',
            'skirt',
            'shorts'
        )
        .required(),
    variant: Joi.string().min(3).max(30).required(),
    bodyLocation: Joi.array()
        .items(
            Joi.string()
                .valid('head', 'upperBody', 'lowerBody', 'feet')
                .min(3)
                .max(30)
        )
        .required(),
    color: Joi.string().min(3).max(30).required(),
    layerable: Joi.boolean().required(),
    image: Joi.any(),
    description: Joi.string().alphanum().min(3).max(100)
});

export const updateClothesSchema = Joi.object({
    category: Joi.string().valid(
        'tshirt',
        'jacket',
        'sweater',
        'top',
        'shirt',
        'dress',
        'pants',
        'skirt',
        'shorts'
    ),
    variant: Joi.string().min(3).max(30),
    bodyLocation: Joi.array().items(
        Joi.string()
            .valid('head', 'upperBody', 'lowerBody', 'feet')
            .min(3)
            .max(30)
    ),
    color: Joi.string().min(3).max(30),
    layerable: Joi.boolean(),
    image: Joi.any(),
    cloudinaryID: Joi.string(),
    description: Joi.string().alphanum().min(3).max(100)
});
