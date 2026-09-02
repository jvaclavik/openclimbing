import React, { useState } from 'react';
import ViewListIcon from '@mui/icons-material/ViewList';
import { Button, Stack, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  DEFAULT_GRADE_SYSTEM,
  getGradeSystemName,
  GRADE_SYSTEMS,
  GradeSystem,
} from '../../../services/tagging/climbing/gradeSystems';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { t } from '../../../services/intl';
import { ClimbingGradesTable } from './ClimbingGradesTable/ClimbingGradesTable';
import { useVisibleGradeSystems } from './utils/useVisibleGradeSystems';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';
import { GLASS_PAPER_SX, PopperWithArrow } from '../../utils/PopperWithArrow';
import { FilterBody, FilterCard, FilterOption } from './Filter/filterUi';

const GradeSystemItems = ({
  showMinor,
  onClick,
  selectedGradeSystem,
}: {
  showMinor: boolean;
  onClick: (key: GradeSystem) => void;
  selectedGradeSystem: GradeSystem | undefined;
}) => {
  const visibleGradeSystems = useVisibleGradeSystems();

  const filteredGradeSystems = GRADE_SYSTEMS.filter(({ key }) =>
    showMinor
      ? !visibleGradeSystems.includes(key)
      : visibleGradeSystems.includes(key),
  );
  return (
    <>
      {filteredGradeSystems.map(({ key, name, description, flags }) => (
        <Tooltip
          title={description}
          placement="right"
          enterDelay={1000}
          arrow
          key={key}
        >
          <FilterOption
            type="button"
            $selected={selectedGradeSystem === key}
            onClick={() => onClick(key)}
          >
            <span>{name}</span>
            <span>{flags}</span>
          </FilterOption>
        </Tooltip>
      ))}
    </>
  );
};

type Props = {
  size?: 'small' | 'tiny';
  onGradeSystemChange?: (gradeSystem: GradeSystem) => void;
  showDefaultOnButton?: boolean;
};

export const GradeSystemSelect = ({
  size,
  onGradeSystemChange,
  showDefaultOnButton,
}: Props) => {
  const { userSettings, setUserSetting } = useUserSettingsContext();
  const [isGradeTableOpen, setIsGradeTableOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const selectedGradeSystem = userSettings['climbing.gradeSystem'];
  const [showMore, setShowMore] = useState(false);

  const handleClose = () => setAnchorEl(null);

  const handleButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    if (open) {
      handleClose();
      return;
    }
    setAnchorEl(event.currentTarget);
  };

  const changeGradeSystem = (gradeSystem: GradeSystem) => {
    setUserSetting('climbing.gradeSystem', gradeSystem);
    onGradeSystemChange?.(gradeSystem);
    handleClose();
  };

  const buttonLabel = showDefaultOnButton
    ? getGradeSystemName(DEFAULT_GRADE_SYSTEM)
    : t('grade_system_select.convert_grade_short');

  return (
    <>
      <Button
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        disableElevation
        onClick={handleButtonClick}
        sx={{
          maxWidth: 200,
          textTransform: 'none',
          fontWeight: 700,
          borderColor: (theme) => alpha(theme.palette.text.primary, 0.28),
          color: 'text.primary',
          ...(size === 'tiny' ? { fontSize: 10 } : {}),
        }}
        endIcon={open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        size="small"
        variant="outlined"
      >
        {getGradeSystemName(selectedGradeSystem) ?? buttonLabel}
      </Button>
      <PopperWithArrow
        title={t('grade_system_select.select_grade_system')}
        isOpen={open}
        anchorEl={anchorEl}
        placement="bottom-end"
        offset={[0, 8]}
        sx={{ minWidth: 280, maxWidth: 340, zIndex: 1400 }}
        paperSx={GLASS_PAPER_SX}
        onClickAway={(event) => {
          if (anchorEl?.contains(event.target as Node)) return;
          handleClose();
        }}
      >
        <FilterBody>
          <FilterCard>
            <Stack
              sx={{
                gap: 0.5,
              }}
            >
              <FilterOption
                type="button"
                $selected={!selectedGradeSystem}
                onClick={() => changeGradeSystem(undefined)}
              >
                {t('grade_system_select.default_grade_system')}
              </FilterOption>
              <GradeSystemItems
                showMinor={false}
                onClick={changeGradeSystem}
                selectedGradeSystem={selectedGradeSystem}
              />
              {showMore && (
                <GradeSystemItems
                  showMinor
                  onClick={changeGradeSystem}
                  selectedGradeSystem={selectedGradeSystem}
                />
              )}
            </Stack>
          </FilterCard>
          {!showMore && (
            <Button
              size="small"
              onClick={() => setShowMore(true)}
              sx={{
                alignSelf: 'flex-start',
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              {t('grade_system_select.show_more')}
            </Button>
          )}
          <FilterOption
            type="button"
            onClick={() => {
              setIsGradeTableOpen(true);
              handleClose();
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
              }}
            >
              <ViewListIcon fontSize="small" />
              <span>{t('climbing_grade_table.title')}</span>
            </Stack>
          </FilterOption>
        </FilterBody>
      </PopperWithArrow>
      {isGradeTableOpen && (
        <ClimbingGradesTable onClose={() => setIsGradeTableOpen(false)} />
      )}
    </>
  );
};
