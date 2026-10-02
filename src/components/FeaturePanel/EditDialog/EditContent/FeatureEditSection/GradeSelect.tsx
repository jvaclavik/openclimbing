import { Box } from '@mui/material';
import React from 'react';
import { GRADE_TABLE } from '../../../../../services/tagging/climbing/gradeData';
import { RouteDifficultyBadge } from '../../../Climbing/RouteDifficultyBadge';
import { AutocompleteSelect } from './AutocompleteSelect';
import { useMultiEdit } from '../../context/useMultiEdit';
import { getGradeSystemName } from '../../../../../services/tagging/climbing/gradeSystems';
import { t } from '../../../../../services/intl';

type GradeSelectProps = {
  k: string;
  climbingGradeSystem: string;
};

export const GradeSelect = ({ k, climbingGradeSystem }: GradeSelectProps) => {
  const values = GRADE_TABLE[climbingGradeSystem];
  const uniqueValues = [...new Set(values)];
  const { tags, mixed, setTag } = useMultiEdit();
  const isMixed = Object.prototype.hasOwnProperty.call(mixed, k);
  const currentValue = isMixed ? '' : (tags[k] ?? '');

  const onChange = (_e: React.SyntheticEvent, option: string | null) => {
    setTag(k, option ?? '');
  };

  return (
    <AutocompleteSelect
      values={uniqueValues}
      label={getGradeSystemName(climbingGradeSystem)}
      value={currentValue || null}
      onChange={onChange}
      freeSolo
      placeholder={isMixed ? t('editdialog.multiple_values') : undefined}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <RouteDifficultyBadge
            routeDifficulty={{
              gradeSystem: climbingGradeSystem,
              grade: typeof option === 'string' ? option : option.label,
            }}
          />
        </Box>
      )}
    />
  );
};
