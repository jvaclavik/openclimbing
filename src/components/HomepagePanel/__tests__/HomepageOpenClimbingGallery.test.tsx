import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { HomepageOpenClimbingGallery } from '../HomepageOpenClimbingGallery';
import { getClimbingGallery } from '../../../services/climbing-areas/getClimbingGallery';

jest.mock('../../../services/climbing-areas/getClimbingGallery', () => ({
  getClimbingGallery: jest.fn(),
}));
jest.mock('../../utils/useVisibleBbox', () => ({
  useVisibleBbox: () => undefined,
}));
jest.mock('../../utils/FeatureContext', () => ({
  useFeatureContext: () => ({ setPreview: jest.fn() }),
}));
jest.mock('../../utils/ProgressiveImage', () => ({
  CommonsProgressiveImage: () => null,
  ProgressiveImageWrapper: 'div',
}));

// jsdom has no layout – report a fixed gallery width
class FakeResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}

  observe() {
    this.callback(
      [{ contentRect: { width: 400 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }

  disconnect() {}
}

const items = Array.from({ length: 30 }, (_, index) => ({
  osmType: 'relation',
  osmId: index + 1,
  name: `Area ${index + 1}`,
  lon: 14,
  lat: 50,
  photo: 'File:x.jpg',
  routeCount: 10,
  routesOnPhoto: 5,
}));

// the app's custom palette colors the gallery uses
const theme = createTheme({
  palette: { background: { elevation: '#ddd', searchBox: '#fff' } },
} as Parameters<typeof createTheme>[0]);

const renderGallery = async () => {
  render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={new QueryClient()}>
        <HomepageOpenClimbingGallery />
      </QueryClientProvider>
    </ThemeProvider>,
  );
  await act(async () => {});
};

const areaLinks = () => screen.queryAllByRole('link');

describe('HomepageOpenClimbingGallery', () => {
  beforeAll(() => {
    global.ResizeObserver =
      FakeResizeObserver as unknown as typeof ResizeObserver;
  });

  it('shows the number of hidden photos and loads them on click', async () => {
    jest.mocked(getClimbingGallery).mockResolvedValue(items as never);
    await renderGallery();

    expect(areaLinks()).toHaveLength(24);
    const showMore = screen.getByRole('button', { name: /\+6/ });

    fireEvent.click(showMore);

    expect(areaLinks()).toHaveLength(30);
    expect(screen.queryByRole('button', { name: /\+\d/ })).toBeNull();
  });

  it('has no show more tile when everything fits', async () => {
    jest
      .mocked(getClimbingGallery)
      .mockResolvedValue(items.slice(0, 5) as never);
    await renderGallery();

    expect(areaLinks()).toHaveLength(5);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
