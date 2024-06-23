import { z } from 'zod';

const clothesSchema = z.array(z.any()).nonempty({
    message: "At least one item must be provided for 'clothes'"
});

export const shareOutfitsSchema = z.object({
    friends: z.array(z.string()).min(1)
});
export const createOutfitsSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(1000).optional(),
    clothes: clothesSchema,
    occasion: z
        .enum([
            'casual',
            'formal',
            'sport',
            'business',
            'party',
            'home',
            'travel',
            'festival'
        ])
        .optional(),
    season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
    image: z.string().url().optional(),
    cloudinaryID: z.string().optional(),
    tags: z.array(z.string()).optional(),
    favorited: z.boolean().default(false)
});

export type OutfitsInput = z.infer<typeof createOutfitsSchema>;

export const updateOutfitsSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(1000).optional(),
    clothes: clothesSchema.optional(),
    occasion: z
        .enum([
            'casual',
            'formal',
            'sport',
            'business',
            'party',
            'home',
            'travel',
            'festival'
        ])
        .optional(),
    season: z.enum(['spring', 'summer', 'autumn', 'winter']).optional(),
    image: z.string().url().optional(),
    cloudinaryID: z.string().optional(),
    tags: z.array(z.string()).optional(),
    favorited: z.boolean().optional()
});
