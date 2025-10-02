import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WelcomeScreen from '../components/WelcomeScreen';

describe('WelcomeScreen', () => {
  it('renders the main heading and subheading', () => {
    render(<WelcomeScreen onCreateProject={() => {}} onImportProject={() => {}} />);
    
    expect(screen.getByText(/Welcome to the Kastle Wizard/i)).toBeInTheDocument();
    expect(screen.getByText(/Design, manage, and export professional security floor plans with ease./i)).toBeInTheDocument();
  });

  it('calls onCreateProject when the "Create New Project" button is clicked', () => {
    const handleCreate = vi.fn();
    render(<WelcomeScreen onCreateProject={handleCreate} onImportProject={() => {}} />);
    
    const createButton = screen.getByRole('button', { name: /Create New Project/i });
    fireEvent.click(createButton);

    expect(handleCreate).toHaveBeenCalledTimes(1);
  });

  it('calls onImportProject when the "Import Project" button is clicked', () => {
    const handleImport = vi.fn();
    render(<WelcomeScreen onCreateProject={() => {}} onImportProject={handleImport} />);
    
    const importButton = screen.getByRole('button', { name: /Import Project/i });
    fireEvent.click(importButton);

    expect(handleImport).toHaveBeenCalledTimes(1);
  });
});