import { z } from 'zod';

const namePattern = /^[a-zA-Z0-9 ',-]+$/;
const passwordPattern =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d!@#$%^&*]{8,}$/;
const phoneNumberPattern = /^\(\d{3}\) \d{3}-\d{4}$/;

const passwordSchema = z.string().regex(passwordPattern, {
    message:
        'Password must include at least one lowercase letter, one uppercase letter, and one digit. Minimum length 8 characters.'
});

export const registerSchema = z
    .object({
        firstName: z
            .string()
            .min(3)
            .max(30)
            .regex(
                namePattern,
                "First name can contain alphanumeric characters and ', -"
            ),
        lastName: z
            .string()
            .min(3)
            .max(30)
            .regex(
                namePattern,
                "Last name can contain alphanumeric characters and ', -"
            ),
        password: passwordSchema,
        confirmPassword: z.string(),
        email: z.string().email(),
        phoneNumber: z
            .string()
            .regex(phoneNumberPattern, 'Invalid phone number format')
            .optional(),
        termsAndPolicy: z.boolean().refine((val) => val === true, {
            message: 'You must accept the terms and conditions to proceed.'
        })
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword']
    });

export const loginSchema = z.object({
    email: z.string().email(),
    password: passwordSchema
});

export const updateProfileSchema = z.object({
    firstName: z
        .string()
        .min(3)
        .max(30)
        .regex(
            namePattern,
            "First name can contain alphanumeric characters and ', -"
        )
        .optional(),
    lastName: z
        .string()
        .min(3)
        .max(30)
        .regex(
            namePattern,
            "Last name can contain alphanumeric characters and ', -"
        )
        .optional(),
    phoneNumber: z
        .string()
        .regex(phoneNumberPattern, 'Invalid phone number format')
        .optional()
});

export const forgotPasswordSchema = z.object({
    email: z.string().email()
});

export const changePasswordSchema = z
    .object({
        currentPassword: passwordSchema,
        newPassword: passwordSchema,
        confirmPassword: passwordSchema
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "New passwords don't match",
        path: ['confirmPassword']
    });

export const resetPasswordSchema = z
    .object({
        token: z.string(),
        password: passwordSchema,
        confirmPassword: passwordSchema
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "New passwords don't match",
        path: ['confirmPassword']
    });
