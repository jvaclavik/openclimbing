import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import maplibregl from 'maplibre-gl';
import { getGlobalMap } from '../../../../services/mapStorage';
import { getCoordsFeature } from '../../../../services/getCoordsFeature';
import { getRoundedPosition } from '../../../../utils';
import { useFeatureContext } from '../../../utils/FeatureContext';
import { useEditDialogContext } from '../../../FeaturePanel/helpers/EditDialogContext';
import { createCragMarkerOptions } from './cragMarker';

// matches the `climbing/crag` preset in the iD tagging schema, so it is
// preselected in the EditDialog (see findPreset / getPresetKey)
const CRAG_PRESET_TAGS = { climbing: 'crag' };

type AddNewCragContextType = {
  isActive: boolean;
  start: () => void;
  cancel: () => void;
  confirm: () => void;
};

const AddNewCragContext = createContext<AddNewCragContextType>(undefined);

export const AddNewCragProvider: React.FC = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  const markerRef = useRef<maplibregl.Marker>();
  const { setFeature } = useFeatureContext();
  const { open } = useEditDialogContext();

  const removeMarker = useCallback(() => {
    markerRef.current?.remove();
    markerRef.current = undefined;
  }, []);

  const start = useCallback(() => {
    const map = getGlobalMap();
    if (!map) {
      return;
    }
    removeMarker();
    markerRef.current = new maplibregl.Marker(createCragMarkerOptions())
      .setLngLat(map.getCenter())
      .addTo(map);
    setIsActive(true);
  }, [removeMarker]);

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
