import { useTheme } from '@mui/material';
import styled from '@emotion/styled';
import React from 'react';
import {
  getHumanDistance,
  highlightText,
  IconPart,
  OptionBody,
  OptionMeta,
  OptionSubtitle,
  OptionTitle,
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
import { GRADE_TABLE } from '../../../services/tagging/climbing/gradeData';
import {
  getDifficultyColor,
  getGradeLabel,
} from '../../../services/tagging/climbing/routeGrade';
import { getCountryFlag } from '../../../services/getCountryFlag';

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
  route_top: getPresetTranslation('climbing/route_top'),
  gym: getPresetTranslation('leisure/sports_centre/climbing'),
  ferrata: t('climbing.type.ferrata'),
});

const PARENT_SEPARATOR = ' · ';

const buildSecondaryLine = (
  typeLabel: string,
  parents: ClimbingSearchParent[] | undefined,
): string => {
  const parentNames = (parents ?? [])
    .map((parent) => parent.name)
    .filter(Boolean);
  return [typeLabel, ...parentNames].filter(Boolean).join(PARENT_SEPARATOR);
};

const RouteGradeDot = styled.span<{ $color: string }>`
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  box-shadow: 0 0 0 2px ${({ $color }) => $color}33;
`;

const CountChip = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
  background: ${({ theme }) =>
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.06)'};
  color: ${({ theme }) => theme.palette.text.primary};

  strong {
    font-size: 12px;
    font-weight: 700;
  }
`;

const GradeChip = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #fff;
  background: ${({ $color }) => $color};
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25);
`;

const Distance = styled.span`
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;

  ${OptionTitle} {
    flex: 1;
    min-width: 0;
  }
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
  const {
    name,
    type,
    lon,
    lat,
    parents,
    countryCode,
    gradeId,
    gradeTxt,
    routeCount,
  } = option.climbing;

  const isRoute = type === 'route' || type === 'route_top';
  const gradeLabel = isRoute
    ? getGradeLabel(gradeId, gradeTxt, userSettings['climbing.gradeSystem'])
    : undefined;
  const gradeColor = isRoute
    ? getDifficultyColor(
        { gradeSystem: 'uiaa', grade: GRADE_TABLE.uiaa[gradeId] },
        theme.palette.mode,
      )
    : theme.palette.text.secondary;

  const distance = getHumanDistance(isImperial, mapCenter, [lon, lat]);
  const typeLabel = getTypeLabels()[type] ?? `climbing ${type}`;
  const secondaryLine = buildSecondaryLine(typeLabel, parents);
  const flag = getCountryFlag(countryCode);

  return (
    <>
      <IconPart>
        {isRoute ? (
          <RouteGradeDot $color={gradeColor} title={typeLabel} />
        ) : (
          <PoiIcon
            tags={{ climbing: type }}
            ico="climbing"
            size={18}
            title={typeLabel}
          />
        )}
      </IconPart>
      <OptionBody>
        <TitleRow>
          <OptionTitle>{highlightText(name, inputValue)}</OptionTitle>
          {gradeLabel && (
            <GradeChip $color={gradeColor}>{gradeLabel}</GradeChip>
          )}
        </TitleRow>
        {secondaryLine && (
          <OptionSubtitle>
            {secondaryLine}
            {flag ? ` ${flag}` : ''}
          </OptionSubtitle>
        )}
      </OptionBody>
      <OptionMeta>
        {!!routeCount && (
          <CountChip>
            <strong>{routeCount}</strong>
            {t('featurepanel.routes')}
          </CountChip>
        )}
        <Distance>{distance}</Distance>
      </OptionMeta>
    </>
  );
};

export const climbingOptionSelected = (option: ClimbingOption) => {
  const { osmType, osmId } = option.climbing;
  Router.push(`/${osmType}/${osmId}`);
};
