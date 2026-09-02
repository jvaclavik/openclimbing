import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import type * as maplibregl from 'maplibre-gl';
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
  /** Bumps on each start() so an older async import can't leave an orphan pin. */
  const startEpochRef = useRef(0);
  const { setFeature } = useFeatureContext();
  const {
    open,
    close: closeEditDialog,
    opened: editDialogOpened,
  } = useEditDialogContext();
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

      const epoch = ++startEpochRef.current;
      removeMarker();
      // previous confirm left a feature marker on the map – drop it
      if (editDialogOpened) {
        closeEditDialog();
      }
      setFeature(null);

      // Import maplibre-gl on demand so it stays out of the shared _app bundle;
      // by the time a crag is added the map's chunk is already loaded.
      const { Marker } = await import('maplibre-gl');
      if (epoch !== startEpochRef.current) {
        return;
      }

      removeMarker();
      const options = createCragMarkerOptions();
      const marker = new Marker(options)
        .setLngLat(getVisibleCenter(map, panelShown && !ignorePanel))
        .addTo(map);

      if (epoch !== startEpochRef.current) {
        marker.remove();
        return;
      }

      markerRef.current = marker;
      animateMarkerDrop(options.element);
      setIsActive(true);
    },
    [closeEditDialog, editDialogOpened, panelShown, removeMarker, setFeature],
  );

  const cancel = useCallback(() => {
    startEpochRef.current += 1;
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
