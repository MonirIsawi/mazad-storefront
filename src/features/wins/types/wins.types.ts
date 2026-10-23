import type { z } from 'zod';
import type { winSchema, winStatusSchema, winsListSchema } from '../schemas/wins.schema';

export type WinStatus = z.infer<typeof winStatusSchema>;
export type Win = z.infer<typeof winSchema>;
export type WinsList = z.infer<typeof winsListSchema>;
