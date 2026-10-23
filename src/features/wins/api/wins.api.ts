import { httpClient } from '@shared/api';
import { winsListSchema } from '../schemas/wins.schema';
import type { WinsList } from '../types/wins.types';

export const winsApi = {
  list: async (): Promise<WinsList> => {
    const response = await httpClient.get<unknown>('/me/wins');
    return winsListSchema.parse(response.data);
  },
};
