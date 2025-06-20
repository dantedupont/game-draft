import '@testing-library/jest-dom'
import { vi } from 'vitest';

vi.mock('@/trpc/client', () => ({
  trpc: {
    ai: {
      identifyGamesInImage: {
        useMutation: vi.fn(() => ({
          mutateAsync: vi.fn().mockResolvedValue([]),
          isLoading: false,
          isError: false,
        })),
      },
    },
  },
}));