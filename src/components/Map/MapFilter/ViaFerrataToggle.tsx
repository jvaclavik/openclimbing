import { useState } from 'react';
import { Tooltip } from '@mui/material';
import styled from '@emotion/styled';
import React from 'react';
import ViaFerrataIcon from '../../../../public/icons-climbing/icons/via-ferrata-gray.svg';
import { t } from '../../../services/intl';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';
import { useMobileMode } from '../../helpers';
import { convertHexToRgba } from '../../utils/colorUtils';
import { VIA_FERRATA_LINE_COLOR } from '../../../services/tagging/viaFerrataScale';
import { isFerrataOnly, toggleFerrataOnly } from './ferrataToggle';
import { PoiTypes } from '../../utils/userSettings/getClimbingFilter';

const Button = styled('button', {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<{ $active: boolean }>`
  pointer-events: all;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 10px 0 8px;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  color: ${({ $active }) => ($active ? '#fff' : 'inherit')};
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(15px);
  background: ${({ theme, $active }) =>
    $active
      ? VIA_FERRATA_LINE_COLOR
      : convertHexToRgba(theme.palette.background.paper, 0.8)};

  &:hover {
    background: ${({ theme, $active }) =>
      $active ? VIA_FERRATA_LINE_COLOR : theme.palette.background.paper};
  }
`;

const Icon = styled('img', {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<{ $active: boolean }>`
  width: 16px;
  height: 20px;
  pointer-events: none;
  filter: ${({ $active }) =>
    $active ? 'brightness(0) invert(1)' : 'contrast(1.4)'};
`;

export const ViaFerrataToggle = () => {
  const isMobileMode = useMobileMode();
  const { poiTypes, setPoiTypes } = useUserSettingsContext().climbingFilter;
  const [restore, setRestore] = useState<PoiTypes | null>(null);
  const active = isFerrataOnly(poiTypes);

  if (!process.env.NEXT_PUBLIC_ENABLE_CLIMBING_TILES) {
    return null;
  }

  const onClick = () => {
    const next = toggleFerrataOnly(poiTypes, restore);
    setRestore(next.restore);
    setPoiTypes(next.poiTypes);
  };

  return (
    <Tooltip title={t('crag_filter.only_ferrata')} arrow>
      <Button
        type="button"
        $active={active}
        aria-pressed={active}
        aria-label={t('crag_filter.only_ferrata')}
        onClick={onClick}
      >
        <Icon src={ViaFerrataIcon.src} alt="" $active={active} />
        {!isMobileMode && t('crag_filter.type_ferrata')}
      </Button>
    </Tooltip>
  );
};
