import { Map } from 'maplibre-gl';
import { useEffect } from 'react';
import { useFeatureContext } from '../../utils/FeatureContext';
import { convertOsmIdToMapId } from '../helpers';
import { setSelectedOutline } from '../climbingTiles/selectedOutline';
import { Feature } from '../../../services/types';

// outlines are constructed only for relations (see constructOutlines)
const getOutlineId = (feature: Feature | undefined) => {
  const osmMeta = feature?.osmMeta;
  return osmMeta?.type === 'relation'
    ? convertOsmIdToMapId(osmMeta)
    : undefined;
};

export const useSelectedOutline = (map: Map) => {
  const { feature } = useFeatureContext();
  const outlineId = getOutlineId(feature);

  useEffect(() => {
    if (!map) {
      return undefined;
    }

    setSelectedOutline(outlineId);
    return () => setSelectedOutline(undefined);
  }, [map, outlineId]);
};
