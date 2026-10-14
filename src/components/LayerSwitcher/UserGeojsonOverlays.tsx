import React, { useRef } from 'react';
import {
  Box,
  Checkbox,
  IconButton,
  ListItemButton,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Stack,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import {
  ACTIVE_LAYERS_STORAGE_KEY,
  useMapStateContext,
} from '../utils/MapStateContext';
import { useSnackbar } from '../utils/SnackbarContext';
import { t } from '../../services/intl';
import {
  GeojsonParseError,
  getUserGeojsonColor,
  parseGeojsonPoints,
  USER_GEOJSON_MAX_FILE_BYTES,
  USER_GEOJSON_STORAGE_KEY,
  UserGeojsonLayer,
} from '../../services/userGeojson';

const getErrorMessage = (error: unknown) => {
  if (error instanceof GeojsonParseError) {
    return error.code === 'no_points'
      ? t('layerswitcher.geojson_no_points')
      : t('layerswitcher.geojson_invalid');
  }
  return t('layerswitcher.geojson_storage_error');
};

const restoreItem = (key: string, value: string | null) => {
  if (value === null) {
    window.localStorage.removeItem(key);
  } else {
    window.localStorage.setItem(key, value);
  }
};

// Writes the new layer and its activation together. Both values are read from
// storage (the latest state) and rolled back if either write exceeds the quota.
const persistNewLayer = (layer: UserGeojsonLayer) => {
  const storedLayers = window.localStorage.getItem(USER_GEOJSON_STORAGE_KEY);
  const storedActive = window.localStorage.getItem(ACTIVE_LAYERS_STORAGE_KEY);
  const layers = [...JSON.parse(storedLayers ?? '[]'), layer];
  const active = [...JSON.parse(storedActive ?? '[]'), layer.id];

  try {
    window.localStorage.setItem(
      USER_GEOJSON_STORAGE_KEY,
      JSON.stringify(layers),
    );
    window.localStorage.setItem(
      ACTIVE_LAYERS_STORAGE_KEY,
      JSON.stringify(active),
    );
  } catch (error) {
    restoreItem(USER_GEOJSON_STORAGE_KEY, storedLayers);
    restoreItem(ACTIVE_LAYERS_STORAGE_KEY, storedActive);
    throw error;
  }
};

export const AddGeojsonButton = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { setUserGeojsonLayers, setActiveLayers } = useMapStateContext();
  const { showToast } = useSnackbar();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow selecting the same file again
    if (!file) return;

    if (file.size > USER_GEOJSON_MAX_FILE_BYTES) {
      showToast(t('layerswitcher.geojson_too_large'), 'error');
      return;
    }

    try {
      const layer: UserGeojsonLayer = {
        id: `geojson-${Date.now()}`,
        name: file.name.replace(/\.(geo)?json$/i, ''),
        data: parseGeojsonPoints(await file.text()),
      };
      persistNewLayer(layer);

      setUserGeojsonLayers((prev) => [...prev, layer]);
      setActiveLayers((prev) => [...prev, layer.id]);
    } catch (error) {
      showToast(getErrorMessage(error), 'error');
    }
  };

  return (
    <>
      <Tooltip title={t('layerswitcher.add_geojson')}>
        <IconButton
          size="small"
          aria-label={t('layerswitcher.add_geojson')}
          onClick={() => inputRef.current?.click()}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <input
        ref={inputRef}
        type="file"
        accept=".geojson,.json,application/geo+json,application/json"
        hidden
        onChange={handleFile}
      />
    </>
  );
};

export const UserGeojsonItem = ({ layer }: { layer: UserGeojsonLayer }) => {
  const { activeLayers, setActiveLayers, setUserGeojsonLayers } =
    useMapStateContext();
  const { showToast } = useSnackbar();
  const colorErrorShown = useRef(false);
  const selected = activeLayers.includes(layer.id);

  const toggle = () => {
    setActiveLayers((prev) =>
      prev.includes(layer.id)
        ? prev.filter((key) => key !== layer.id)
        : prev.concat(layer.id),
    );
  };

  const remove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUserGeojsonLayers((prev) => prev.filter(({ id }) => id !== layer.id));
    setActiveLayers((prev) => prev.filter((key) => key !== layer.id));
  };

  const changeColor = (color: string) => {
    // write storage first: a quota error must not leave React state ahead of it
    const stored: UserGeojsonLayer[] = JSON.parse(
      window.localStorage.getItem(USER_GEOJSON_STORAGE_KEY) ?? '[]',
    );
    const next = stored.map((item) =>
      item.id === layer.id ? { ...item, color } : item,
    );
    try {
      window.localStorage.setItem(
        USER_GEOJSON_STORAGE_KEY,
        JSON.stringify(next),
      );
    } catch {
      // the color input fires on every drag step, so report a failure only once
      if (!colorErrorShown.current) {
        colorErrorShown.current = true;
        showToast(t('layerswitcher.geojson_storage_error'), 'error');
      }
      return;
    }
    colorErrorShown.current = false;
    setUserGeojsonLayers(next);
  };

  return (
    <ListItemButton onClick={toggle}>
      <ListItemIcon>
        <Box
          component="input"
          type="color"
          aria-label={t('layerswitcher.geojson_color', { name: layer.name })}
          value={getUserGeojsonColor(layer)}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            changeColor(e.target.value)
          }
          sx={{
            width: 20,
            height: 20,
            p: 0,
            border: 0,
            borderRadius: '50%',
            bgcolor: 'transparent',
            cursor: 'pointer',
            '&::-webkit-color-swatch-wrapper': { p: 0 },
            '&::-webkit-color-swatch': { border: 0, borderRadius: '50%' },
            '&::-moz-color-swatch': { border: 0, borderRadius: '50%' },
          }}
        />
      </ListItemIcon>
      <ListItemText primary={layer.name} />
      <ListItemSecondaryAction>
        <Stack direction="row" sx={{ alignItems: 'center' }}>
          <IconButton
            size="small"
            aria-label={t('layerswitcher.remove_geojson', { name: layer.name })}
            onClick={remove}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <Checkbox
            edge="end"
            checked={selected}
            slotProps={{ input: { 'aria-label': layer.name } }}
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
          />
        </Stack>
      </ListItemSecondaryAction>
    </ListItemButton>
  );
};
