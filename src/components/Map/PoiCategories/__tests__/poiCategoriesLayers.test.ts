import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import {
  POI_CATEGORIES_SOURCE,
  poiCategoriesLayers,
} from '../poiCategoriesLayers';

// The layers are cast to `LayerSpecification`, so typescript does not check the
// paint/layout expressions – this validates them the way maplibre would.
test('poi category layers are a valid style', () => {
  const errors = validateStyleMin({
    version: 8,
    glyphs: 'https://example.com/{fontstack}/{range}.pbf',
    sprite: 'https://example.com/sprite',
    sources: {
      [POI_CATEGORIES_SOURCE]: {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    },
    layers: poiCategoriesLayers,
  });

  expect(errors.map(({ message }) => message)).toEqual([]);
});
