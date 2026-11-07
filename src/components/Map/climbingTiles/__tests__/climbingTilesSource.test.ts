import type { StyleSpecification } from '@maplibre/maplibre-gl-style-spec';
import {
  addClimbingTilesSource,
  removeClimbingTilesSource,
} from '../climbingTilesSource';
import { fetchJson } from '../../../../services/fetch';
import { EMPTY_GEOJSON_SOURCE } from '../../consts';

jest.mock('../../../../services/fetch', () => ({
  fetchJson: jest.fn(),
}));

jest.mock('../../../../services/mapStorage', () => ({
  getGlobalMap: () => map,
}));

jest.mock('../selectedOutline', () => ({
  reapplySelectedOutline: jest.fn(),
}));

const source = { setData: jest.fn() };
const map = {
  getStyle: () => ({}),
  getSource: () => source,
  getZoom: () => 0,
  getBounds: () => ({
    getNorthWest: () => ({ lng: 14, lat: 50 }),
    getSouthEast: () => ({ lng: 15, lat: 49 }),
  }),
  removeFeatureState: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
};

const createStyle = (): StyleSpecification => ({
  version: 8,
  sources: {},
  layers: [],
});

describe('climbing tiles source style updates', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.mocked(fetchJson).mockResolvedValue({
      features: [
        {
          type: 'Feature',
          id: 100,
          geometry: { type: 'Point', coordinates: [14, 50] },
          properties: { type: 'gym', name: 'Gym' },
        },
      ],
    });
  });

  afterEach(() => {
    removeClimbingTilesSource();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('refills a reused source after a style switch but ignores hover-only style events', async () => {
    addClimbingTilesSource(createStyle());
    const onLoad = map.on.mock.calls.find(([event]) => event === 'load')[1];
    const onStyleData = map.on.mock.calls.find(
      ([event]) => event === 'styledata',
    )[1];
    await onLoad();
    const initialData = source.setData.mock.calls[0][0];
    expect(initialData.features).toHaveLength(1);

    onStyleData();
    await jest.advanceTimersByTimeAsync(200);
    expect(source.setData).toHaveBeenCalledTimes(1);

    addClimbingTilesSource(createStyle());
    source.setData(EMPTY_GEOJSON_SOURCE.data);
    source.setData.mockClear();
    onStyleData();
    await jest.advanceTimersByTimeAsync(200);
    expect(source.setData).toHaveBeenCalledTimes(1);
    expect(source.setData).toHaveBeenLastCalledWith(initialData);

    onStyleData();
    await jest.advanceTimersByTimeAsync(200);
    expect(source.setData).toHaveBeenCalledTimes(1);
  });
});
