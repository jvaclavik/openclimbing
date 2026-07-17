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

// Rough estimate of how many characters fit on the secondary line (proportional
// font, so it's only an approximation - occasional overflow is fine).
const MAX_SECONDARY_CHARS = 38;
const PARENT_SEPARATOR = ' › ';

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text;

// Builds "crag › area › region, CZ" for the secondary line. Each parent gets an
// equal share of the remaining width (total minus the fixed country suffix and
// the separators) so the whole path roughly fits.
const buildParentPath = (
  parents: ClimbingSearchParent[] | undefined,
  countryCode: string | undefined,
): string => {
  const country = countryCode ? countryCode.toUpperCase() : '';
  if (!parents?.length) {
    return country;
  }

  const countrySuffixLen = country ? country.length + 2 : 0; // ", CZ"
  const separatorsLen = PARENT_SEPARATOR.length * (parents.length - 1);
  const perParent = Math.max(
    4,
    Math.floor(
      (MAX_SECONDARY_CHARS - countrySuffixLen - separatorsLen) / parents.length,
    ),
  );

  const path = parents
    .map((parent) => truncate(parent.name, perParent))
    .join(PARENT_SEPARATOR);
  return country ? `${path}, ${country}` : path;
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
  const secondaryLine = buildParentPath(parents, countryCode);

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
