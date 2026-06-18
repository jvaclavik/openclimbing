import React, { useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TuneIcon from '@mui/icons-material/Tune';
import styled from '@emotion/styled';
import { t } from '../../../../services/intl';
import { TranslationId } from '../../../../services/types';
import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import {
  CLIMBING_TYPE_FILTER_OPTIONS,
  ClimbingFilterOption,
  INCLINATION_FILTER_OPTIONS,
} from './climbingFilterOptions';
import { CLIMBING_ROCK_OPTIONS } from '../../../../services/tagging/climbing/climbingRockData';

const Label = styled.div`
  font-size: 0.85rem;
  opacity: 0.8;
  margin-bottom: 4px;
`;

const ExpandIcon = styled(ExpandMoreIcon, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{ open: boolean }>`
  transition: transform 0.15s;
  transform: rotate(${({ open }) => (open ? 180 : 0)}deg);
`;

const toggle = (list: string[], value: string) =>
  list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];

type ChipGroupProps = {
  label: TranslationId;
  options: ClimbingFilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
};

const ChipGroup = ({ label, options, selected, onChange }: ChipGroupProps) => (
  <Box>
    <Label>{t(label)}</Label>
    <Stack direction="row" gap={0.5} flexWrap="wrap">
      {options.map((option) => {
        const isSelected = selected.includes(option.value);
        return (
          <Chip
            key={option.value}
            label={t(option.label)}
            size="small"
            color={isSelected ? 'primary' : 'default'}
            variant={isSelected ? 'filled' : 'outlined'}
            onClick={() => onChange(toggle(selected, option.value))}
          />
        );
      })}
    </Stack>
  </Box>
);

type AdvancedFiltersProps = {
  showClimbingType: boolean;
  showInclination: boolean;
  showMaterial: boolean;
  showFamilyFriendly: boolean;
};

export const AdvancedFilters = ({
  showClimbingType,
  showInclination,
  showMaterial,
  showFamilyFriendly,
}: AdvancedFiltersProps) => {
  const { climbingFilter } = useUserSettingsContext();
  const {
    climbingTypes,
    setClimbingTypes,
    inclinations,
    setInclinations,
    materials,
    setMaterials,
    familyFriendly,
    setFamilyFriendly,
    isClimbingTypesDefault,
    isInclinationsDefault,
    isMaterialsDefault,
    isFamilyFriendlyDefault,
  } = climbingFilter;

  const hasActiveAdvanced =
    (showClimbingType && !isClimbingTypesDefault) ||
    (showInclination && !isInclinationsDefault) ||
    (showMaterial && !isMaterialsDefault) ||
    (showFamilyFriendly && !isFamilyFriendlyDefault);

  const [open, setOpen] = useState(hasActiveAdvanced);

  const materialOptions = CLIMBING_ROCK_OPTIONS.map((option) => option.value);
  const getMaterialLabel = (value: string) => {
    const option = CLIMBING_ROCK_OPTIONS.find((item) => item.value === value);
    return option ? t(option.translationKey) : value;
  };

  return (
    <Box ml={2} mr={2} sx={{ paddingBottom: 1 }}>
      <Divider sx={{ mb: 0.5 }} />
      <Button
        fullWidth
        size="small"
        color="inherit"
        onClick={() => setOpen((prev) => !prev)}
        startIcon={<TuneIcon fontSize="small" />}
        endIcon={<ExpandIcon open={open} fontSize="small" />}
        sx={{
          justifyContent: 'space-between',
          textTransform: 'none',
          fontWeight: 600,
          color: 'text.primary',
          px: 0.5,
        }}
      >
        <Box component="span" sx={{ flexGrow: 1, textAlign: 'left' }}>
          {t('crag_filter.advanced')}
        </Box>
      </Button>
      <Collapse in={open}>
        <Stack gap={1.5} sx={{ paddingTop: 1, paddingBottom: 1 }}>
          {showClimbingType && (
            <ChipGroup
              label="climbing_badges.type_label"
              options={CLIMBING_TYPE_FILTER_OPTIONS}
              selected={climbingTypes}
              onChange={setClimbingTypes}
            />
          )}
          {showInclination && (
            <ChipGroup
              label="climbing_badges.inclination_label"
              options={INCLINATION_FILTER_OPTIONS}
              selected={inclinations}
              onChange={setInclinations}
            />
          )}
          {showMaterial && (
            <Box>
              <Label>{t('climbing_rock.label')}</Label>
              <Autocomplete
                multiple
                size="small"
                options={materialOptions}
                value={materials}
                onChange={(_event, next) => setMaterials(next)}
                getOptionLabel={getMaterialLabel}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    placeholder={
                      materials.length === 0
                        ? t('crag_filter.material_placeholder')
                        : undefined
                    }
                  />
                )}
              />
            </Box>
          )}
          {showFamilyFriendly && (
            <FormControlLabel
              control={
                <Switch
                  checked={familyFriendly}
                  onChange={(event) => setFamilyFriendly(event.target.checked)}
                  size="small"
                />
              }
              label={t('climbing_badges.family_friendly_label')}
            />
          )}
        </Stack>
      </Collapse>
    </Box>
  );
};
