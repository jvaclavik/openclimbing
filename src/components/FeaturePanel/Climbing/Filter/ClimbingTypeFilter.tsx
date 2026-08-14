import React from 'react';
import { alpha, Box } from '@mui/material';
import styled from '@emotion/styled';
import AreaGray from '../../../../../public/icons-climbing/icons/area-gray.svg';
import ViaFerrataGray from '../../../../../public/icons-climbing/icons/via-ferrata-gray.svg';
import ClimbingGymGray from '../../../../../public/icons-climbing/icons/climbing-gym-gray.svg';
import { t } from '../../../../services/intl';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import { PoiTypes } from '../../../utils/userSettings/getClimbingFilter';
import { FilterCard, FilterSectionLabel } from './filterUi';
import { tint } from '../../../utils/panelUi';

const Icon = styled.img`
  height: 22px;
  width: 22px;
  pointer-events: none;
  filter: contrast(2);
`;

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
`;

const TypeTile = styled.button<{ $selected: boolean }>`
  appearance: none;
  font: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 4px 8px;
  border-radius: 10px;
  cursor: pointer;
  color: inherit;
  background: ${({ theme, $selected }) =>
    $selected ? alpha(theme.palette.primary.main, 0.16) : tint(theme, 0.03)};
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.palette.primary.main : tint(theme, 0.12)};
  transition:
    background 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    background: ${({ theme, $selected }) =>
      $selected ? alpha(theme.palette.primary.main, 0.22) : tint(theme, 0.07)};
  }
`;

const TypeCaption = styled.span`
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.2;
  text-align: center;
`;

const TYPES: {
  key: keyof PoiTypes;
  icon: string;
  label:
    | 'crag_filter.type_rock'
    | 'crag_filter.type_ferrata'
    | 'crag_filter.type_gym';
}[] = [
  { key: 'rock', icon: AreaGray.src, label: 'crag_filter.type_rock' },
  {
    key: 'ferrata',
    icon: ViaFerrataGray.src,
    label: 'crag_filter.type_ferrata',
  },
  { key: 'gym', icon: ClimbingGymGray.src, label: 'crag_filter.type_gym' },
];

export const ClimbingTypeFilter = () => {
  const { climbingFilter } = useUserSettingsContext();
  const { poiTypes, setPoiTypes } = climbingFilter;

  const toggle = (key: keyof PoiTypes) => {
    setPoiTypes({ ...poiTypes, [key]: !poiTypes[key] });
  };

  return (
    <FilterCard>
      <FilterSectionLabel>{t('crag_filter.type')}</FilterSectionLabel>
      <TypeGrid>
        {TYPES.map(({ key, icon, label }) => (
          <TypeTile
            key={key}
            type="button"
            $selected={poiTypes[key]}
            aria-pressed={poiTypes[key]}
            aria-label={t(label)}
            onClick={() => toggle(key)}
          >
            <Box component="span" display="flex">
              <Icon src={icon} alt="" />
            </Box>
            <TypeCaption>{t(label)}</TypeCaption>
          </TypeTile>
        ))}
      </TypeGrid>
    </FilterCard>
  );
};
