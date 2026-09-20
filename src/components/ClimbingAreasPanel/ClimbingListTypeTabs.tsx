import React from 'react';
import Link from 'next/link';
import { alpha, Box } from '@mui/material';
import styled from '@emotion/styled';
import AreaGray from '../../../public/icons-climbing/icons/area-gray.svg';
import ViaFerrataGray from '../../../public/icons-climbing/icons/via-ferrata-gray.svg';
import ClimbingGymGray from '../../../public/icons-climbing/icons/climbing-gym-gray.svg';
import { intl, t } from '../../services/intl';
import { TranslationId } from '../../services/types';
import { tint } from '../utils/panelUi';
import {
  CLIMBING_LIST_PATHS,
  ClimbingListType,
  exclusivePoiTypes,
} from '../../services/climbing-areas/climbingListTypes';
import { useUserSettingsContext } from '../utils/userSettings/UserSettingsContext';

const Icon = styled.img`
  height: 20px;
  width: 20px;
  pointer-events: none;
  filter: contrast(2);
`;

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
  margin-bottom: 12px;
`;

const typeTabCss = `
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 8px 4px 6px;
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
`;

const TypeTabLink = styled(Link, {
  shouldForwardProp: (prop) => prop !== '$selected',
})<{ $selected: boolean }>`
  ${typeTabCss}
  background: ${({ theme, $selected }) =>
    $selected ? alpha(theme.palette.primary.main, 0.16) : tint(theme, 0.03)};
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.palette.primary.main : tint(theme, 0.12)};
  transition:
    background 0.15s ease,
    border-color 0.15s ease;

  &:hover,
  &:focus {
    text-decoration: none;
    background: ${({ theme, $selected }) =>
      $selected ? alpha(theme.palette.primary.main, 0.22) : tint(theme, 0.07)};
  }
`;

const TypeTabButton = styled('button', {
  shouldForwardProp: (prop) => prop !== '$selected',
})<{ $selected: boolean }>`
  appearance: none;
  font: inherit;
  cursor: pointer;
  ${typeTabCss}
  background: ${({ theme, $selected }) =>
    $selected ? alpha(theme.palette.primary.main, 0.16) : tint(theme, 0.03)};
  border: 1px solid
    ${({ theme, $selected }) =>
      $selected ? theme.palette.primary.main : tint(theme, 0.12)};
  transition:
    background 0.15s ease,
    border-color 0.15s ease;

  &:hover,
  &:focus {
    text-decoration: none;
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

const TABS: {
  key: ClimbingListType;
  icon: string;
  label: TranslationId;
}[] = [
  { key: 'rock', icon: AreaGray.src, label: 'climbingareas.tab_rock' },
  {
    key: 'ferrata',
    icon: ViaFerrataGray.src,
    label: 'climbingareas.tab_ferrata',
  },
  { key: 'gym', icon: ClimbingGymGray.src, label: 'climbingareas.tab_gym' },
];

const TabContent = ({
  icon,
  label,
}: {
  icon: string;
  label: TranslationId;
}) => (
  <>
    <Box
      component="span"
      sx={{
        display: 'flex',
      }}
    >
      <Icon src={icon} alt="" />
    </Box>
    <TypeCaption>{t(label)}</TypeCaption>
  </>
);

type Props = {
  listType: ClimbingListType;
  navigate?: boolean;
};

export const ClimbingListTypeTabs = ({ listType, navigate = true }: Props) => {
  const { setPoiTypes } = useUserSettingsContext().climbingFilter;

  return (
    <TypeGrid>
      {TABS.map(({ key, icon, label }) => {
        const selected = listType === key;
        const onClick = () => setPoiTypes(exclusivePoiTypes(key));
        const content = <TabContent icon={icon} label={label} />;

        if (navigate) {
          return (
            <TypeTabLink
              key={key}
              href={CLIMBING_LIST_PATHS[key]}
              locale={intl.lang}
              $selected={selected}
              aria-current={selected ? 'page' : undefined}
              onClick={onClick}
            >
              {content}
            </TypeTabLink>
          );
        }

        return (
          <TypeTabButton
            key={key}
            type="button"
            $selected={selected}
            aria-pressed={selected}
            onClick={onClick}
          >
            {content}
          </TypeTabButton>
        );
      })}
    </TypeGrid>
  );
};
