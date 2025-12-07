import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Tauri APIs for unit tests
vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/plugin-sql', () => ({
  default: {
    load: vi.fn().mockResolvedValue({
      execute: vi.fn().mockResolvedValue([]),
      select: vi.fn().mockResolvedValue([]),
    }),
  },
}));

// Mock window.__TAURI__ for tests
Object.defineProperty(window, '__TAURI__', {
  value: {
    invoke: vi.fn(),
  },
  writable: true,
});
