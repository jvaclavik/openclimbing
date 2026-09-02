import React from 'react';
import { render, screen } from '@testing-library/react';
import { UserSettingsProvider } from '../../utils/userSettings/UserSettingsContext';
import { UserProfileGradePyramidChart } from '../UserProfileGradePyramidChart';
import { UserProfileProgressionChart } from '../UserProfileProgressionChart';
import { UserProfileYearlyAscentsChart } from '../UserProfileYearlyAscentsChart';
import { UserProfileCumulativeChart } from '../UserProfileCumulativeChart';

// ResponsiveContainer měří rodiče, což jsdom hlásí jako 0×0 a graf se pak
// vůbec nevykreslí — proto mu velikost vnutíme.
jest.mock('recharts', () => {
  const actual = jest.requireActual('recharts');
  const react = jest.requireActual('react');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) =>
      react.cloneElement(children, { width: 800, height: 400 }),
  };
});

const renderWithSettings = (ui: React.ReactElement) =>
  render(<UserSettingsProvider>{ui}</UserSettingsProvider>);

describe('grade pyramid', () => {
  const series = [
    {
      grade: '8a',
      total: 1,
      segments: [{ style: 'RP' as const, count: 1 }],
      sampleTick: null,
    },
    {
      grade: '7a',
      total: 4,
      segments: [{ style: 'OS' as const, count: 4 }],
      sampleTick: null,
    },
  ];

  test('renders one row per grade', () => {
    renderWithSettings(
      <UserProfileGradePyramidChart series={series} maxCount={4} />,
    );
    expect(screen.getByText('8a')).toBeTruthy();
    expect(screen.getByText('7a')).toBeTruthy();
    expect(screen.getByText('user_profile.chart_grade_pyramid')).toBeTruthy();
  });

  test('renders nothing without data', () => {
    const { container } = renderWithSettings(
      <UserProfileGradePyramidChart series={[]} maxCount={0} />,
    );
    expect(container.textContent).toBe('');
  });
});

describe('career charts', () => {
  test('yearly ascents renders a year axis', () => {
    renderWithSettings(
      <UserProfileYearlyAscentsChart
        series={[
          { year: '2023', total: 2, RP: 2 },
          { year: '2024', total: 1, OS: 1 },
        ]}
      />,
    );
    expect(screen.getAllByText('2023').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2024').length).toBeGreaterThan(0);
  });

  test('progression renders grade labels on the Y axis', () => {
    renderWithSettings(
      <UserProfileProgressionChart
        series={[
          { key: '2024-01', best: 20, topAvg: 18 },
          { key: '2024-02', best: 22, topAvg: 19.5 },
        ]}
      />,
    );
    expect(screen.getByText('user_profile.chart_progression')).toBeTruthy();
    expect(
      screen.getByText('user_profile.chart_progression_best'),
    ).toBeTruthy();
  });

  test('progression renders nothing when there is no data point', () => {
    const { container } = renderWithSettings(
      <UserProfileProgressionChart
        series={[{ key: '2024-01', best: null, topAvg: null }]}
      />,
    );
    expect(container.textContent).toBe('');
  });

  test('cumulative chart renders both series', () => {
    renderWithSettings(
      <UserProfileCumulativeChart
        series={[
          { key: '2024-01', ascents: 1, points: 20 },
          { key: '2024-02', ascents: 3, points: 65 },
        ]}
      />,
    );
    expect(
      screen.getByText('user_profile.chart_cumulative_ascents'),
    ).toBeTruthy();
    expect(
      screen.getByText('user_profile.chart_cumulative_points'),
    ).toBeTruthy();
  });

  test('cumulative chart renders nothing for an empty career', () => {
    const { container } = renderWithSettings(
      <UserProfileCumulativeChart
        series={[{ key: '2024-01', ascents: 0, points: 0 }]}
      />,
    );
    expect(container.textContent).toBe('');
  });
});
