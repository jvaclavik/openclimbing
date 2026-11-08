import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { OthersRouteTicks } from '../OthersRouteTicks';

jest.mock('../../../../utils/FeatureContext', () => ({
  useFeatureContext: () => ({
    feature: {
      osmMeta: { type: 'way', id: 7 },
      tags: { climbing: 'route_bottom' },
    },
  }),
}));
jest.mock('../../../../utils/TicksContext', () => ({
  // my own tick of this route (id 2) is shown in "My ticks" instead
  useTicksContext: () => ({ ticks: [{ id: 2 }] }),
}));
jest.mock('../../../../../utils', () => ({
  isFeatureClimbingRoute: () => true,
}));
jest.mock('../../../../../services/project', () => ({
  PROJECT_ID: 'openclimbing',
}));
jest.mock('../../../../utils/MapStateContext', () => ({
  useMapStateContext: () => ({ view: [1, 2, 3] }),
}));

const tick = (id: number, owner: string, note: string | null) => ({
  id,
  osmUserId: id,
  shortId: 'w7',
  timestamp: '2025-03-01T12:00:00Z',
  style: 'OS',
  myGrade: null,
  note,
  pairing: { partners: 's @jan' },
  ownerDisplayName: owner,
});

jest.mock('../../../../../services/my-ticks/myTicksApi', () => ({
  fetchRouteTicks: async () => [
    tick(1, 'pepa', 'Klíčový krok je mokrý'),
    tick(2, 'jan', 'moje poznámka'),
  ],
}));

describe('OthersRouteTicks', () => {
  it('lists other climbers with their notes, without my own ticks', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <QueryClientProvider client={new QueryClient()}>
          <OthersRouteTicks />
        </QueryClientProvider>
      </ThemeProvider>,
    );
    expect(await screen.findByText('pepa')).toBeTruthy();
    expect(screen.getByText('Klíčový krok je mokrý')).toBeTruthy();
    expect(screen.queryByText('moje poznámka')).toBeNull();
  });
});
