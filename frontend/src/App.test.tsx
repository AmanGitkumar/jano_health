import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest'; // <-- THIS IS THE FIX
import App from './App';

describe('Dialysis Dashboard UI', () => {
  it('renders the dashboard headers correctly', () => {
    render(<App />);
    const headerElement = screen.getByText(/Dialysis Intake Dashboard/i);
    expect(headerElement).toBeTruthy(); // Changed this slightly for Vitest compatibility
  });

  it('allows the user to toggle the anomaly filter', () => {
    render(<App />);
    
    // Find the checkbox by its label text
    const filterCheckbox = screen.getByLabelText(/Only show patients with anomalies/i) as HTMLInputElement;
    
    // It should start unchecked
    expect(filterCheckbox.checked).toBe(false);
    
    // Click it!
    fireEvent.click(filterCheckbox);
    
    // It should now be checked
    expect(filterCheckbox.checked).toBe(true);
  });
});