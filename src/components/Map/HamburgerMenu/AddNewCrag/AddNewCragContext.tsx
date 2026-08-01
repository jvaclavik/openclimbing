import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type maplibregl from 'maplibre-gl';
import { getGlobalMap } from '../../../../services/mapStorage';
import { getCoordsFeature } from '../../../../services/getCoordsFeature';
import { getRoundedPosition } from '../../../../utils';
import { useFeatureContext } from '../../../utils/FeatureContext';
import { useEditDialogContext } from '../../../FeaturePanel/helpers/EditDialogContext';
import { getVisibleCenter } from '../../../utils/getVisibleCenter';
import { usePanelShown } from '../../../utils/usePanelShown';
import { animateMarkerDrop, createCragMarkerOptions } from './cragMarker';

// matches the `climbing/crag` preset in the iD tagging schema, so it is
// preselected in the EditDialog (see findPreset / getPresetKey)
const CRAG_PRESET_TAGS = { climbing: 'crag' };

type StartOptions = {
  /** the caller closes the panel at the same time, so ignore its width */
  ignorePanel?: boolean;
};

type AddNewCragContextType = {
  isActive: boolean;
  start: (options?: StartOptions) => void;
  cancel: () => void;
  confirm: () => void;
};

const AddNewCragContext = createContext<AddNewCragContextType>(undefined);

export const AddNewCragProvider: React.FC = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const markerRef = useRef<maplibregl.Marker>();
  const { setFeature } = useFeatureContext();
  const { open } = useEditDialogContext();
  const panelShown = usePanelShown();

  const removeMarker = useCallback(() => {
    markerRef.current?.remove();
    markerRef.current = undefined;
  }, []);

  const start = useCallback(
    async ({ ignorePanel }: StartOptions = {}) => {
      const map = getGlobalMap();
      if (!map) {
        return;
      }
      removeMarker();
      // Import maplibre-gl on demand so it stays out of the shared _app bundle;
      // by the time a crag is added the map's chunk is already loaded.
      const { Marker } = await import('maplibre-gl');
      const options = createCragMarkerOptions();
      markerRef.current = new Marker(options)
        .setLngLat(getVisibleCenter(map, panelShown && !ignorePanel))
        .addTo(map);
      animateMarkerDrop(options.element);
      setIsActive(true);
    },
    [panelShown, removeMarker],
  );

  const cancel = useCallback(() => {
    removeMarker();
    setIsActive(false);
  }, [removeMarker]);

  const confirm = useCallback(() => {
    const map = getGlobalMap();
    if (!map || !markerRef.current) {
      return;
    }
    const { lng, lat } = markerRef.current.getLngLat();
    const coordsFeature = getCoordsFeature(
      getRoundedPosition([lng, lat], map.getZoom()),
    );
    setFeature({ ...coordsFeature, tags: { ...CRAG_PRESET_TAGS } });
    open();
    removeMarker();
    setIsActive(false);
  }, [open, removeMarker, setFeature]);

  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        cancel();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [cancel, isActive]);

  const value: AddNewCragContextType = {
    isActive,
    start,
    cancel,
    confirm,
  };

  return (
    <AddNewCragContext.Provider value={value}>
      {children}
    </AddNewCragContext.Provider>
  );
};

export const useAddNewCragContext = () => useContext(AddNewCragContext);
