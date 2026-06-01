import { useSnackbar } from '../utils/SnackbarContext';
import { overpassOptionSelected } from './options/overpass';
import { useMapStateContext } from '../utils/MapStateContext';
import { Option } from './types';
import { osmOptionSelected } from './options/osm';
import { coordsOptionsSelected } from './options/coords';
import { geocoderOptionSelected } from './options/geocoder';
import { starOptionSelected } from './options/stars';
import { useFeatureContext } from '../utils/FeatureContext';
import { Setter } from '../../types';
import { useCallback } from 'react';
import { climbingOptionSelected } from './options/climbing';
import { tilesOptionSelected } from './options/tiles';
import { setUrlQuery } from './useHandleQuery';

export const useGetOnSelected = (setOverpassLoading: Setter<boolean>) => {
  const { setFeature, setPreview } = useFeatureContext();
  const { bbox } = useMapStateContext();
  const { showToast } = useSnackbar();

  return useCallback(
    (_: null, option: Option) => {
      // Cancel any pending debounced URL sync. The autocomplete schedules a
      // Router.push('/?q=…') (or '/') on every keystroke and on close, with
      // an 800 ms debounce. If we don't cancel it here, that timer can fire
      // *during* our Router.push('/relation/123') below (window.location's
      // pathname only updates after the next navigation completes, so its
      // pathname === '/' guard doesn't help) and aborts the in-flight
      // navigation — the loader runs, vanishes, and the feature panel never
      // opens. Intermittent, depending on whether the OSM fetch finishes
      // before 800 ms.
      setUrlQuery.cancel();
      setPreview(null); // it could be stuck from onHighlight

      switch (option.type) {
        case 'star':
          starOptionSelected(option);
          break;
        case 'overpass':
        case 'preset':
          overpassOptionSelected(option, setOverpassLoading, bbox, showToast);
          break;
        case 'geocoder':
          geocoderOptionSelected(option, setFeature);
          break;
        case 'climbing':
          climbingOptionSelected(option);
          break;
        case 'osm':
          osmOptionSelected(option);
          break;
        case 'coords':
          coordsOptionsSelected(option, setFeature);
          break;
        case 'tiles':
          tilesOptionSelected(option);
          break;
      }
    },
    [bbox, setFeature, setOverpassLoading, setPreview, showToast],
  );
};
