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
import { useMapStateContext } from '../utils/MapStateContext';
import { useSnackbar } from '../utils/SnackbarContext';
import { t } from '../../services/intl';
import {
  GeojsonParseError,
  parseGeojsonPoints,
  getUserGeojsonColor,
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

export const AddGeojsonButton = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { userGeojsonLayers, setUserGeojsonLayers, setActiveLayers } =
    useMapStateContext();
  const { showToast } = useSnackbar();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow selecting the same file again
    if (!file) return;

    try {
      const layer: UserGeojsonLayer = {
        id: `geojson-${Date.now()}`,
        name: file.name.replace(/\.(geo)?json$/i, ''),
        data: parseGeojsonPoints(await file.text()),
      };
      const next = [...userGeojsonLayers, layer];
      // usePersistedState writes inside a state updater, so check the quota first
      window.localStorage.setItem(
        USER_GEOJSON_STORAGE_KEY,
        JSON.stringify(next),
      );

      setUserGeojsonLayers(next);
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
    setUserGeojsonLayers((prev) =>
      prev.map((item) => (item.id === layer.id ? { ...item, color } : item)),
    );
  };

  return (
    <ListItemButton onClick={toggle}>
      <ListItemIcon>
        <Box
          component="input"
          type="color"
          aria-label={t('layerswitcher.geojson_color')}
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
            aria-label={t('layerswitcher.remove_geojson')}
            onClick={remove}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
          <Checkbox
            edge="end"
            checked={selected}
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
