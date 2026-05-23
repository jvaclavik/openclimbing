import React from 'react';
import {
  alpha,
  Box,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import styled from '@emotion/styled';
import AreaGray from '../../../../../public/icons-climbing/icons/area-gray.svg';
import ViaFerrataGray from '../../../../../public/icons-climbing/icons/via-ferrata-gray.svg';
import ClimbingGymGray from '../../../../../public/icons-climbing/icons/climbing-gym-gray.svg';
import { t } from '../../../../services/intl';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import { PoiTypes } from '../../../utils/userSettings/getClimbingFilter';

const Icon = styled.img`
  height: 22px;
  width: 22px;
  pointer-events: none;
  filter: contrast(2);
`;

const TYPE_KEYS: (keyof PoiTypes)[] = ['rock', 'ferrata', 'gym'];

const selectedSx = (theme) => ({
  '&.Mui-selected': {
    backgroundColor: alpha(theme.palette.primary.main, 0.18),
    borderColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.28),
    },
  },
});

export const ClimbingTypeFilter = () => {
  const { climbingFilter } = useUserSettingsContext();
  const { poiTypes, setPoiTypes } = climbingFilter;

  const selectedTypes = TYPE_KEYS.filter((key) => poiTypes[key]);

  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    next: (keyof PoiTypes)[],
  ) => {
    setPoiTypes({
      rock: next.includes('rock'),
      ferrata: next.includes('ferrata'),
      gym: next.includes('gym'),
    });
  };

  return (
    <Stack gap={1} ml={2} mr={2} mt={1} sx={{ paddingBottom: 2 }}>
      <div>{t('crag_filter.type')}</div>
      <ToggleButtonGroup
        value={selectedTypes}
        onChange={handleChange}
        size="small"
        aria-label={t('crag_filter.type')}
      >
        <ToggleButton
          value="rock"
          aria-label={t('crag_filter.type_rock')}
          sx={selectedSx}
        >
          <Tooltip title={t('crag_filter.type_rock')}>
            <Box component="span" display="flex">
              <Icon src={AreaGray.src} alt="" />
            </Box>
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="ferrata"
          aria-label={t('crag_filter.type_ferrata')}
          sx={selectedSx}
        >
          <Tooltip title={t('crag_filter.type_ferrata')}>
            <Box component="span" display="flex">
              <Icon src={ViaFerrataGray.src} alt="" />
            </Box>
          </Tooltip>
        </ToggleButton>
        <ToggleButton
          value="gym"
          aria-label={t('crag_filter.type_gym')}
          sx={selectedSx}
        >
          <Tooltip title={t('crag_filter.type_gym')}>
            <Box component="span" display="flex">
              <Icon src={ClimbingGymGray.src} alt="" />
            </Box>
          </Tooltip>
        </ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
};
