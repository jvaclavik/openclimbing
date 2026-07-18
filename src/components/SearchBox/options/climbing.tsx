import { Grid, Typography, useTheme } from '@mui/material';
import styled from '@emotion/styled';
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
import { GRADE_TABLE } from '../../../services/tagging/climbing/gradeData';
import {
  getDifficultyColor,
  getGradeLabel,
} from '../../../services/tagging/climbing/routeGrade';

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
const MAX_SECONDARY_CHARS = 43;
const PARENT_SEPARATOR = ' › ';

const truncate = (text: string, max: number) =>
  text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text;

// Builds the secondary line, e.g. "crag › area, CZ". With no parents it falls
// back to just the country code ("CZ"). Each shown parent gets an equal
// share of the remaining width (total minus the country suffix and separator).
const buildSecondaryLine = (
  parents: ClimbingSearchParent[] | undefined,
  countryCode: string | undefined,
): string => {
  const countryText = countryCode ? countryCode.toUpperCase() : '';

  if (!parents?.length) {
    return countryText;
  }

  const suffix = countryText ? `, ${countryText}` : '';
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

const RouteGradeDot = styled.span<{ $color: string }>`
  display: inline-block;
  width: 14px;
  height: 14px;
  margin-top: 3px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
`;

type Props = {
  option: ClimbingOption;
  inputValue: string;
};

export const ClimbingRow = ({ option, inputValue }: Props) => {
  const mapCenter = useMapCenter();
  const theme = useTheme();
  const { userSettings } = useUserSettingsContext();
  const { isImperial } = userSettings;
  const { name, type, lon, lat, parents, countryCode, gradeId, gradeTxt } =
    option.climbing;

  const isRoute = type === 'route' || type === 'route_top';
  const gradeLabel = isRoute
    ? getGradeLabel(gradeId, gradeTxt, userSettings['climbing.gradeSystem'])
    : undefined;
  const gradeColor = isRoute
    ? getDifficultyColor(
        { gradeSystem: 'uiaa', grade: GRADE_TABLE.uiaa[gradeId] },
        theme.palette.mode,
      )
    : undefined;

  const distance = getHumanDistance(isImperial, mapCenter, [lon, lat]);
  const secondaryLine = buildSecondaryLine(parents, countryCode);

  return (
    <>
      <IconPart>
        {isRoute ? (
          <RouteGradeDot $color={gradeColor} />
        ) : (
          <PoiIcon tags={{ climbing: type }} ico="climbing" size={20} />
        )}
        <div>{distance}</div>
      </IconPart>
      <Grid size={{ xs: 12 }}>
        {highlightText(name, inputValue)}
        {gradeLabel && ` ${gradeLabel}`}
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
