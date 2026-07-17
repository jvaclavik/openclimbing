import { Grid, Typography } from '@mui/material';
import React from 'react';
import {
  getHumanDistance,
  highlightText,
  IconPart,
  useMapCenter,
} from '../utils';
import { fetchJson } from '../../../services/fetch';
import { ClimbingOption, Option } from '../types';
import { View } from '../../utils/MapStateContext';
import { PoiIcon } from '../../utils/icons/PoiIcon';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';
import Router from 'next/router';
import { CLIMBING_TILES_HOST } from '../../../services/osm/consts';
import { PROJECT_ID } from '../../../services/project';
import { ClimbingSearchParent, ClimbingSearchRecord } from '../../../types';
import { GeocoderAborted } from './geocoder';
import { t } from '../../../services/intl';
import { getPresetTranslation } from '../../../services/tagging/translations';

const getApiUrl = (inputValue: string, view: View) => {
  const [_zoom, lat, lon] = view;
  const q = encodeURIComponent(inputValue);
  return `${CLIMBING_TILES_HOST}api/climbing-tiles/search?q=${q}&lon=${lon}&lat=${lat}`;
};

export const CLIMBING_SEARCH_ABORTABLE_QUEUE = 'climbing-search';

export const fetchClimbingSearchOptions = async (
  inputValue: string,
  view: View,
  abortQueue: string = CLIMBING_SEARCH_ABORTABLE_QUEUE,
): Promise<Option[]> => {
  if (PROJECT_ID !== 'openclimbing') {
    return [];
  }

  try {
    const records = await fetchJson<ClimbingSearchRecord[]>(
      getApiUrl(inputValue, view),
      { abortableQueueName: abortQueue },
    );

    const options = records || [];
    return options.map((record) => ({
      type: 'climbing' as const,
      climbing: record,
    }));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new GeocoderAborted();
    }
    throw e;
  }
};

const getTypeLabels = (): Record<ClimbingSearchRecord['type'], string> => ({
  area: getPresetTranslation('type/site/climbing/area'),
  crag: getPresetTranslation('climbing/crag'),
  route: getPresetTranslation('climbing/route'),
  route_top: getPresetTranslation('climbing/route_top'), // only in ourPresets.ts yet
  gym: getPresetTranslation('leisure/sports_centre/climbing'),
  ferrata: t('climbing.type.ferrata'), // no preset yet
});

// Rough estimate of how many characters fit on the secondary line (proportional
// font, so it's only an approximation - occasional overflow is fine).
const MAX_SECONDARY_CHARS = 43;
const PARENT_SEPARATOR = ' › ';

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text;

// Builds the secondary line, e.g. "crag › area, CZ". With no parents it falls
// back to the type label ("Lezecká cesta"). Each shown parent gets an equal
// share of the remaining width (total minus the country suffix and separator).
const buildSecondaryLine = (
  parents: ClimbingSearchParent[] | undefined,
  countryCode: string | undefined,
  label: string,
): string => {
  const suffix = countryCode ? `, ${countryCode.toUpperCase()}` : '';

  if (!parents?.length) {
    return `${label}${suffix}`;
  }

  const separatorsLen = PARENT_SEPARATOR.length * (parents.length - 1);
  const perParent = Math.max(
    4,
    Math.floor(
      (MAX_SECONDARY_CHARS - suffix.length - separatorsLen) / parents.length,
    ),
  );

  const shown = parents.map((parent) => truncate(parent.name, perParent));
  return `${shown.join(PARENT_SEPARATOR)}${suffix}`;
};

type Props = {
  option: ClimbingOption;
  inputValue: string;
};

export const ClimbingRow = ({ option, inputValue }: Props) => {
  const mapCenter = useMapCenter();
  const { isImperial } = useUserSettingsContext().userSettings;
  const { name, type, lon, lat, parents, countryCode } = option.climbing;

  const distance = getHumanDistance(isImperial, mapCenter, [lon, lat]);
  const label = getTypeLabels()[type] ?? `climbing ${type}`;
  const secondaryLine = buildSecondaryLine(parents, countryCode, label);

  return (
    <>
      <IconPart>
        <PoiIcon tags={{ climbing: type }} ico="climbing" size={20} />
        <div>{distance}</div>
      </IconPart>
      <Grid size={{ xs: 12 }}>
        {highlightText(name, inputValue)}
        {secondaryLine && (
          <Typography variant="body2" color="textSecondary" noWrap>
            {secondaryLine}
          </Typography>
        )}
      </Grid>
    </>
  );
};

export const climbingOptionSelected = (option: ClimbingOption) => {
  const { osmType, osmId } = option.climbing;
  Router.push(`/${osmType}/${osmId}`);
};
