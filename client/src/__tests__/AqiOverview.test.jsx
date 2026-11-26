import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AqiOverview from '../components/AqiOverview';

describe('AqiOverview Component', () => {
  const mockAqiData = {
    location: { city: 'Delhi', country: 'India' },
    current: {
      aqi: 185,
      pm2_5: 68.4,
      pm10: 112,
      no2: 24,
      so2: 12,
      co: 520,
      category: 'Unhealthy',
      categoryDetails: { color: '#EF4444', level: 'Unhealthy' },
      cigaretteEquivalent: 3.1
    },
    cleanWindow: {
      start: '12:00 PM',
      end: '02:00 PM',
      avgPm25: 48,
      avgAqi: 130,
      recommendation: 'Optimal window for brief cross-ventilation.'
    }
  };

  it('renders loading skeleton when loading prop is true', () => {
    const { container } = render(<AqiOverview loading={true} aqiData={null} />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders air quality index, category, and city name', () => {
    render(<AqiOverview loading={false} aqiData={mockAqiData} />);
    expect(screen.getByText('185')).toBeInTheDocument();
    expect(screen.getByText('Unhealthy')).toBeInTheDocument();
    expect(screen.getByText(/Delhi/)).toBeInTheDocument();
  });

  it('renders Berkeley Earth cigarette equivalency', () => {
    render(<AqiOverview loading={false} aqiData={mockAqiData} />);
    expect(screen.getByText('~3.1')).toBeInTheDocument();
    expect(screen.getByText(/cigs \/ 24h/)).toBeInTheDocument();
  });

  it('renders Clean Air Window alert banner with safe hours', () => {
    render(<AqiOverview loading={false} aqiData={mockAqiData} />);
    expect(screen.getByText(/Optimal Clean Air Window Today/i)).toBeInTheDocument();
    expect(screen.getByText(/12:00 PM - 02:00 PM/)).toBeInTheDocument();
  });
});
