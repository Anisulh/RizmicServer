import { z } from 'zod';

export const shareClothesSchema = z.object({
    friends: z.array(z.string()).min(1)
});

export const createClothesSchema = z.object({
    name: z.string().min(1).max(100),
    category: z.enum(
        [
            't-shirt',
            'jacket',
            'sweater',
            'top',
            'shirt',
            'dress',
            'pants',
            'skirt',
            'shorts',
            'accessories'
        ],
        {
            errorMap: () => ({ message: 'Invalid clothing category' })
        }
    ),
    size: z.enum(['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'], {
        errorMap: () => ({ message: 'Invalid clothing size' })
    }),
    color: z.string().min(1).max(50),
    material: z.string().optional(),
    brand: z.string().optional(),
    condition: z.enum(['new', 'like new', 'good', 'fair', 'poor'], {
        errorMap: () => ({ message: 'Invalid clothing condition' })
    }),
    purchaseDate: z.date().optional(),
    price: z.number().optional(),
    description: z.string().max(1000).optional(),
    careInstructions: z.string().max(1000).optional(),
    image: z.any().optional(),
    tags: z.array(z.string()).optional(),
    favorited: z.boolean().default(false)
});

export type ClothesInput = z.infer<typeof createClothesSchema>;

export const updateClothesSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    category: z
        .enum(
            [
                't-shirt',
                'jacket',
                'sweater',
                'top',
                'shirt',
                'dress',
                'pants',
                'skirt',
                'shorts',
                'accessories'
            ],
            {
                errorMap: () => ({ message: 'Invalid clothing category' })
            }
        )
        .optional(),
    size: z
        .enum(['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'], {
            errorMap: () => ({ message: 'Invalid clothing size' })
        })
        .optional(),
    color: z.string().min(1).max(50).optional(),
    material: z.string().optional(),
    brand: z.string().optional(),
    condition: z
        .enum(['new', 'like new', 'good', 'fair', 'poor'], {
            errorMap: () => ({ message: 'Invalid clothing condition' })
        })
        .optional(),
    purchaseDate: z.date().optional(),
    price: z.number().optional(),
    description: z.string().max(1000).optional(),
    careInstructions: z.string().max(1000).optional(),
    image: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
    favorited: z.boolean().default(false).optional()
});
