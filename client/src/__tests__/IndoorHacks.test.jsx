import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import IndoorHacks from '../components/IndoorHacks';

describe('IndoorHacks Component & Room CADR Calculator', () => {

  it('renders CADR calculator and header', () => {
    render(<IndoorHacks />);
    expect(screen.getByText(/Room-by-Room Clean Air Delivery Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/The DIY Corsi-Rosenthal Box Purifier/i)).toBeInTheDocument();
  });

  it('calculates required CADR correctly for default 250 sq ft room', () => {
    render(<IndoorHacks />);
    expect(screen.getByText('169')).toBeInTheDocument();
  });

  it('renders bill of materials for Corsi-Rosenthal box', () => {
    render(<IndoorHacks />);
    expect(screen.getByText(/1x 20" Box Fan/i)).toBeInTheDocument();
    expect(screen.getByText(/4x 20x20x2" MERV-13 Filters/i)).toBeInTheDocument();
    expect(screen.getByText(/~380 CFM/i)).toBeInTheDocument();
  });

});
