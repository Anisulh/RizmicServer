import { z } from 'zod';

const clothesSchema = z.array(z.any()).nonempty({
    message: "At least one item must be provided for 'clothes'"
});

export const createOutfitsSchema = z.object({
    name: z
        .string()
        .min(3)
        .max(50)
        .regex(/^[a-zA-Z0-9\s'()-]*$/, {
            message:
                "Name can contain alphanumeric characters, spaces, and '()-"
        })
        .optional(),
    clothes: clothesSchema,
    coverImg: z.any().optional(),
    favorited: z.boolean().optional()
});

export const updateOutfitsSchema = z.object({
    name: z
        .string()
        .min(3)
        .max(50)
        .regex(/^[a-zA-Z0-9\s'()-]*$/, {
            message:
                "Name can contain alphanumeric characters, spaces, and '()-"
        })
        .optional(),
    clothes: z.array(z.any()).optional(),
    coverImg: z.any().optional(),
    favorited: z.boolean().optional()
});
