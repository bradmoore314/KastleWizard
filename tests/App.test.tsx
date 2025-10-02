import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import App from '../App';
import { AppProvider } from '../state/AppContext';
import 'pdfjs-dist';

// Mock the entire pdfjs-dist library
vi.mock('pdfjs-dist', async () => {
  const actual = await vi.importActual<typeof import('pdfjs-dist')>('pdfjs-dist');
  return {
    ...actual,
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn().mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getPage: vi.fn().mockResolvedValue({
          getViewport: vi.fn().mockReturnValue({ width: 600, height: 800 }),
          render: vi.fn().mockReturnValue({ promise: Promise.resolve(true) }),
        }),
      }),
    }),
  };
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });


describe('App Component', () => {
  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders welcome screen when no project is active', () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>
    );
    expect(screen.getByText(/Welcome to the Kastle Wizard/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create New Project/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Import Project/i })).toBeInTheDocument();
  });
});