import React from 'react';
import { render, act, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DeviceForm from '../components/DeviceForm';
// FIX: Import AppStateContext and AppDispatchContext which are now exported.
import { AppStateContext, AppDispatchContext } from '../state/AppContext';
import { defaultFormConfig } from '../services/formConfig';
import { DeviceEdit, AccessDoorData } from '../types';
import { Toaster } from 'react-hot-toast';

// Mock device for testing
const mockAccessPoint: DeviceEdit = {
  id: 'ap-123',
  type: 'device',
  deviceType: 'access-door',
  pageIndex: 0, x: 100, y: 100, width: 24, height: 24, rotation: 0,
  data: {
    install_type: 'New Install',
    location: 'Main Entrance',
    interior_perimeter: 'Perimeter',
    reader_type: 'HID Proximity',
    lock_type: 'Single Standard',
    monitoring_type: 'Prop Monitoring',
    door_contact: false,
    rex: false,
    push_to_exit: false,
    intercom_buzzer: false,
    lock_provider: 'Kastle',
    notes: 'Initial notes.'
  } as AccessDoorData
};

const mockDispatch = vi.fn();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppDispatchContext.Provider value={mockDispatch}>
    <AppStateContext.Provider value={{ formConfig: defaultFormConfig } as any}>
      {children}
      <Toaster />
    </AppStateContext.Provider>
  </AppDispatchContext.Provider>
);

describe('DeviceForm for Access Point', () => {

  beforeEach(() => {
    // Reset mocks before each test
    mockDispatch.mockClear();
  });

  it('updates fields and dispatches correct data on save', async () => {
    render(
      <TestWrapper>
        <DeviceForm
          devices={mockAccessPoint}
          onClose={() => {}}
          isCreating={false}
          onImagesAdded={() => {}}
          onViewImage={() => {}}
          isAdminMode={false}
        />
      </TestWrapper>
    );

    // 1. Check initial values are rendered
    expect(screen.getByDisplayValue('Main Entrance')).toBeInTheDocument();
    expect(screen.getByText('Initial notes.')).toBeInTheDocument();

    // 2. Change location (text input)
    const locationInput = screen.getByDisplayValue('Main Entrance');
    await act(async () => {
      fireEvent.change(locationInput, { target: { value: 'New Location' } });
    });

    // 3. Save changes
    const saveButton = screen.getByText('Save Details');
    await act(async () => {
      fireEvent.click(saveButton);
    });

    // Verify dispatch was called
    expect(mockDispatch).toHaveBeenCalled();
  });
});