import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ClimbingTick } from '../../../types';
import { mapFeaturesDataToTicks } from '../../MyTicksPanel/mapMyTicksRows';
import {
  computeMilestones,
  computePersonalRecords,
} from '../../../services/my-ticks/personalRecords';
import { UserProfileOverviewTab } from '../Overview/UserProfileOverviewTab';
import { buildActivityCalendar } from '../Overview/activityCalendarData';
import { computeUserProfileSummary } from '../userProfileSummary';

jest.mock('../../utils/userSettings/UserSettingsContext', () => ({
  useUserSettingsContext: () => ({
    userSettings: { 'climbing.gradeSystem': 'uiaa' },
  }),
}));
jest.mock('../../FeaturePanel/Climbing/GradeSystemSelect', () => ({
  GradeSystemSelect: () => null,
}));

let id = 0;
const tick = (
  timestamp: string,
  style: string,
  grade: string,
  crag: string,
  area = 'Moravský kras',
): ClimbingTick => {
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
    routeAreaName: area,
  };
};

const ticks = [
  tick('2019-05-01T10:00:00.000Z', 'OS', '5', 'Sloup'),
  tick('2024-06-14T10:00:00.000Z', 'RP', '8+', 'Holštejn'),
  tick('2024-06-14T11:00:00.000Z', 'OS', '7', 'Holštejn'),
  tick('2024-06-15T10:00:00.000Z', 'FL', '7+', 'Holštejn'),
  tick('2024-06-16T10:00:00.000Z', 'PJ', '9', 'Tetín', 'Český kras'),
];
const rows = mapFeaturesDataToTicks(ticks, [], 'uiaa');

describe('UserProfileOverviewTab', () => {
  it('renders records and milestones and opens a day', () => {
    const onOpenDay = jest.fn();
    render(
      <ThemeProvider theme={createTheme()}>
        <UserProfileOverviewTab
          fetchedTicks={rows}
          records={computePersonalRecords(rows)}
          milestones={computeMilestones(rows)}
          own
          onOpenDay={onOpenDay}
        />
      </ThemeProvider>,
    );

    // featured hardest send (project 9 is ignored)
    expect(screen.getByText('Route 2')).toBeTruthy();
    expect(screen.getAllByText('8+').length).toBeGreaterThan(0);
    // hardest onsight / flash cells
    expect(screen.getAllByText('7').length).toBeGreaterThan(0);
    expect(screen.getAllByText('7+').length).toBeGreaterThan(0);

    fireEvent.click(screen.getByText('user_profile.records.best_day'));
    expect(onOpenDay).toHaveBeenCalledWith('2024-06-14');
  });

  it('shows an empty state without ticks', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <UserProfileOverviewTab
          fetchedTicks={[]}
          records={computePersonalRecords([])}
          milestones={[]}
          own={false}
          onOpenDay={jest.fn()}
        />
      </ThemeProvider>,
    );
    expect(screen.getByText('user_profile.no_ticks')).toBeTruthy();
  });
});

describe('buildActivityCalendar', () => {
  it('covers 53 weeks starting on Monday and counts active days', () => {
    const today = new Date('2024-06-20T12:00:00');
    const data = buildActivityCalendar(rows, today);
    expect(data.weeks).toHaveLength(53);
    expect(data.weeks.every((w) => w.length === 7)).toBe(true);
    expect(new Date(data.weeks[0][0].day).getUTCDay()).toBe(1);
    // 14., 15., 16. 6. 2024 (2019 is out of range)
    expect(data.activeDays).toBe(3);
    const day14 = data.weeks.flat().find((d) => d.day === '2024-06-14');
    expect(day14).toMatchObject({ sends: 2, ticks: 2, level: 1 });
    const future = data.weeks.flat().find((d) => d.day === '2024-06-22');
    expect(future?.future).toBe(true);
  });
});

describe('computeUserProfileSummary', () => {
  it('returns the first year and the area with most days', () => {
    expect(computeUserProfileSummary(rows)).toEqual({
      sinceYear: 2019,
      homeArea: 'Moravský kras',
    });
  });
});
