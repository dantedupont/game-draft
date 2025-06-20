import { vi } from 'vitest';

export const trpc = {
  ai: {
    identifyGamesInImage: {
      useMutation: vi.fn(() => ({
        mutateAsync: vi.fn().mockResolvedValue([]),
        isLoading: false,
        isError: false,
      })),
    },
  },
};