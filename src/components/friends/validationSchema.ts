import { z } from 'zod';

export const shareClothesSchema = z.object({
    friends: z.array(z.string()).min(1)
});
