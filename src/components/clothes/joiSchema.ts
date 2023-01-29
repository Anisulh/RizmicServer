import Joi from 'joi';

export const createClothesSchema = Joi.object({
    type: Joi.string().alphanum().min(3).max(30).required(),
    specificType: Joi.string().alphanum().min(3).max(30).required(),
    bodyLocation: Joi.array()
        .items(Joi.string().alphanum().min(3).max(30))
        .required(),
    color: Joi.string().alphanum().min(3).max(30).required(),
    size: Joi.string().alphanum().min(3).max(30),
    description: Joi.string().alphanum().min(3).max(30)
});

export const updateClothesSchema = Joi.object({
    type: Joi.string().alphanum().min(3).max(30),
    specificType: Joi.string().alphanum().min(3).max(30),
    bodyLocation: Joi.array().items(Joi.string().alphanum().min(3).max(30)),
    color: Joi.string().alphanum().min(3).max(30),
    size: Joi.string().alphanum().min(3).max(30),
    description: Joi.string().alphanum().min(3).max(30)
});
