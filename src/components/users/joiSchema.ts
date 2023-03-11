import Joi from 'joi';

export const registerSchema = Joi.object({
    firstName: Joi.string().alphanum().min(3).max(30).required(),
    lastName: Joi.string().alphanum().min(3).max(30).required(),
    password: Joi.string()
        .pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{5,}$/))
        .required(),
    confirmPassword: Joi.ref('password'),
    email: Joi.string()
        .email({
            minDomainSegments: 2,
            tlds: { allow: ['com', 'net'] }
        })
        .required(),
    phoneNumber: Joi.string()
});

export const loginSchema = Joi.object({
    email: Joi.string()
        .email({
            minDomainSegments: 2,
            tlds: { allow: ['com', 'net'] }
        })
        .required(),
    password: Joi.string().pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{5,}$/)).required()
});


export const updateProfileSchema = Joi.object({
    firstName: Joi.string().alphanum().min(3).max(30),
    lastName: Joi.string().alphanum().min(3).max(30),
    phoneNumber: Joi.string()
});

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{5,}$/)).required(),
    newPassword: Joi.string().pattern(new RegExp(/^(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9]{5,}$/)).required(),
    confirmPassword: Joi.ref('newPassword'),
})