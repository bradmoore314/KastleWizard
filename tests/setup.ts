// This file extends Vitest's expect functionality with matchers from jest-dom.
// This allows you to do things like:
// expect(element).toBeInTheDocument();
// Learn more: https://github.com/testing-library/jest-dom

import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock matchMedia for react-hot-toast
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
