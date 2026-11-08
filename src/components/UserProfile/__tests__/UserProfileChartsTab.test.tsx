import React from 'react';
import { render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ClimbingTick } from '../../../types';
import { mapFeaturesDataToTicks } from '../../MyTicksPanel/mapMyTicksRows';
import { UserProfileChartsTab } from '../UserProfileChartsTab';

let id = 0;
const tick = (
  timestamp: string,
  style: string,
  grade: string,
  crag: string,
) => {
  id += 1;
  return {
    id,
    osmUserId: 1,
    shortId: `n${id}`,
    timestamp,
    style,
    myGrade: null,
    note: null,
    pairing: null,
    routeName: `Route ${id}`,
    routeGradeTxt: grade,
    routeCragName: crag,
  } as ClimbingTick;
};

const rows = mapFeaturesDataToTicks(
  [
    tick('2024-01-05T10:00:00Z', 'OS', '6', 'Sloup'),
    tick('2024-02-05T10:00:00Z', 'RP', '7+', 'Holštejn'),
    tick('2024-02-06T10:00:00Z', 'FL', '7', 'Holštejn'),
    tick('2024-03-06T10:00:00Z', 'PJ', '8', 'Holštejn'),
  ],
  [],
  'uiaa',
);

describe('UserProfileChartsTab', () => {
  it('renders all charts without crashing', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <UserProfileChartsTab
          rows={rows}
          monthKeys={['2024-01', '2024-02', '2024-03']}
        />
      </ThemeProvider>,
    );
    [
      'user_profile.charts.progression',
      'user_profile.charts.pyramid',
      'user_profile.charts.sends_by_month',
      'user_profile.charts.styles',
      'user_profile.charts.top_crags',
    ].forEach((title) => expect(screen.getByText(title)).toBeTruthy());
    // pyramid rows: 7+, 7, 6 (project 8 not counted)
    expect(screen.getAllByRole('listitem').length).toBe(3 + 2);
    expect(screen.getByText('user_profile.charts.projects_note')).toBeTruthy();
  });

  it('shows empty states', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <UserProfileChartsTab rows={[]} monthKeys={['2024-01']} />
      </ThemeProvider>,
    );
    expect(screen.getAllByText('user_profile.charts.empty')).toHaveLength(5);
  });
});
