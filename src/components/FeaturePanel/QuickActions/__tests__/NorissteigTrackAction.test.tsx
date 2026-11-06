import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { NorissteigTrackAction } from '../NorissteigTrackAction';

const mockLayers = new Set<string>();
const mockSources = new Map<
  string,
  { data: { features: Array<{ geometry: { coordinates: unknown[] } }> } }
>();
const mockMap = {
  addLayer: jest.fn(({ id }: { id: string }) => mockLayers.add(id)),
  addSource: jest.fn((id, source) => mockSources.set(id, source)),
  removeLayer: jest.fn((id) => mockLayers.delete(id)),
  removeSource: jest.fn((id) => mockSources.delete(id)),
  getLayer: (id: string) => mockLayers.has(id),
  getSource: (id: string) => mockSources.get(id),
  fitBounds: jest.fn(),
  isStyleLoaded: () => true,
  on: jest.fn(),
  off: jest.fn(),
};

jest.mock('maplibre-gl', () => ({
  LngLatBounds: class {
    extend() {}
  },
}));

jest.mock('../../../../services/mapStorage', () => ({
  get mapCreatedPromise() {
    return Promise.resolve(mockMap);
  },
}));

const original = process.env.NORISSTEIG_TEST_GPX;
(original ? test : test.skip)(
  'loads the original GPX into one overlay, restores it on style change and removes it on exit',
  async () => {
    const { unmount } = render(<NorissteigTrackAction />);
    fireEvent.click(screen.getByRole('button', { name: 'Norissteig-Tour' }));
    const input = screen.getByText('GPX auswählen').querySelector('input')!;
    fireEvent.change(input, {
      target: {
        files: [
          { size: 69000, text: async () => readFileSync(original!, 'utf8') },
        ],
      },
    });

    await waitFor(() => expect(mockMap.fitBounds).toHaveBeenCalledTimes(1));
    const data = mockSources.get('norissteig-pilot-track')?.data;
    expect(data?.features[0].geometry.coordinates).toHaveLength(291);
    expect(mockLayers.size).toBe(2);
    const restore = mockMap.on.mock.calls[0][1];
    restore();
    expect(mockMap.addSource).toHaveBeenCalledTimes(1);
    mockLayers.clear();
    mockSources.clear();
    restore();
    expect(mockSources.size).toBe(1);
    expect(mockLayers.size).toBe(2);

    unmount();
    expect(mockSources.size).toBe(0);
    expect(mockLayers.size).toBe(0);
  },
);
