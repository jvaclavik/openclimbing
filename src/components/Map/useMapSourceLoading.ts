import { useEffect, useState } from 'react';
import { getGlobalMap } from '../../services/mapStorage';

/** True until the image source is on the map and MapLibre has finished loading it. */
export const useMapSourceLoading = (
  sourceId: string,
  active: boolean,
  { untilVisible = false }: { untilVisible?: boolean } = {},
) => {
  const [loading, setLoading] = useState(active);
  const [everLoaded, setEverLoaded] = useState(false);

  useEffect(() => {
    if (!active) {
      setLoading(false);
      setEverLoaded(false);
      return undefined;
    }

    const map = getGlobalMap();
    if (!map) {
      setLoading(true);
      return undefined;
    }

    const update = () => {
      const pending = !map.getSource(sourceId) || !map.isSourceLoaded(sourceId);
      setLoading(pending);
      if (!pending) setEverLoaded(true);
    };

    map.on('sourcedata', update);
    map.on('sourcedataloading', update);
    update();
    return () => {
      map.off('sourcedata', update);
      map.off('sourcedataloading', update);
    };
  }, [sourceId, active]);

  if (!active) return false;
  if (untilVisible) return !everLoaded;
  return loading;
};
