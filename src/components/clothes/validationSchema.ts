import { z } from 'zod';

const clothingCategories = z.enum(
    [
        'tshirt',
        'jacket',
        'sweater',
        'top',
        'shirt',
        'dress',
        'pants',
        'skirt',
        'shorts'
    ],
    {
        errorMap: () => ({ message: 'Invalid clothing category' })
    }
);

const bodyLocations = z.enum(['head', 'upperBody', 'lowerBody', 'feet'], {
    errorMap: () => ({ message: 'Invalid body location' })
});

export const createClothesSchema = z.object({
    category: clothingCategories,
    variant: z.string().min(3).max(30, {
        message: 'Variant must be between 3 and 30 characters'
    }),
    bodyLocation: z.array(bodyLocations).min(1, {
        message: 'At least one body location must be provided'
    }),
    color: z.string().min(3).max(30, {
        message: 'Color must be between 3 and 30 characters'
    }),
    layerable: z.boolean(),
    image: z.any().optional(),
    description: z.string().min(3).max(100).optional()
});

export const updateClothesSchema = z.object({
    category: clothingCategories.optional(),
    variant: z.string().min(3).max(30).optional(),
    bodyLocation: z.array(bodyLocations).optional(),
    color: z.string().min(3).max(30).optional(),
    layerable: z.boolean().optional(),
    image: z.any().optional(),
    cloudinaryID: z.string().url().optional(),
    description: z.string().min(3).max(100).optional()
});
