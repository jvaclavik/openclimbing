import { renderHook } from '@testing-library/react';
import type { Map as MaplibreMap } from 'maplibre-gl';
import { usePhotoMarkers } from '../usePhotoMarkers';

const mockMarkers: Array<{ lngLat: unknown }> = [];

jest.mock('maplibre-gl', () => ({
  Marker: class {
    lngLat: unknown = null;

    constructor() {
      mockMarkers.push(this);
    }

    setLngLat(lngLat: unknown) {
      this.lngLat = lngLat;
      return this;
    }

    addTo() {
      return this;
    }

    remove() {}
  },
  Popup: class {},
}));

const photoExifs = {
  'File:Crag.jpg': {
    GPSLatitude: '47.2868',
    GPSLongitude: '11.4029',
    GPSImgDirection: '120',
    FocalLengthIn35mmFilm: '28',
  },
};

const renderMarkers = (zoom: number) => {
  const map = {
    getZoom: () => zoom,
    on: () => {},
    off: () => {},
  } as unknown as MaplibreMap;

  return renderHook(() => usePhotoMarkers(map, photoExifs, ['Crag.jpg']));
};

beforeEach(() => {
  mockMarkers.length = 0;
});

describe('usePhotoMarkers', () => {
  // a crag mapped as a single node has no extent, so opening it from a link
  // always lands exactly on FEATURE_ZOOM (17) – markers have to show up there
  it('shows markers at the zoom a feature opened from a link gets', () => {
    renderMarkers(17);

    expect(mockMarkers).toHaveLength(1);
    expect(mockMarkers[0].lngLat).toEqual([11.4029, 47.2868]);
  });

  it('hides markers when zoomed out', () => {
    renderMarkers(16);

    expect(mockMarkers).toHaveLength(0);
  });
});
