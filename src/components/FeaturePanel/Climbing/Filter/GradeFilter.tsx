import { useUserSettingsContext } from '../../../utils/userSettings/UserSettingsContext';
import { Slider, Stack } from '@mui/material';
import { t } from '../../../../services/intl';
import { GradeSystemSelect } from '../GradeSystemSelect';
import { RouteDifficultyBadge } from '../RouteDifficultyBadge';
import React from 'react';
import { Interval } from '../../../utils/userSettings/getClimbingFilter';
import styled from '@emotion/styled';
import { useGetSliderColors } from '../../../../services/tagging/climbing/gradeData';
import { FilterCard, FilterSectionLabel } from './filterUi';

const convertToUnique = ([minIndex, maxIndex]: Interval, grades: string[]) => {
  const uniqueGrades = [...new Set(grades)];
  const value: Interval = [
    uniqueGrades.indexOf(grades[minIndex]),
    uniqueGrades.indexOf(grades[maxIndex]),
  ];
  return { value, max: uniqueGrades.length - 1 };
};

const convertFromUnique = (
  [minIndex, maxIndex]: Interval,
  grades: string[],
): Interval => {
  const uniqueGrades = [...new Set(grades)];
  return [
    grades.indexOf(uniqueGrades[minIndex]),
    grades.indexOf(uniqueGrades[maxIndex]),
  ];
};

const StyledSlider = styled(Slider, {
  shouldForwardProp: (prop) => !prop.startsWith('$'),
})<{ $colors: string }>`
  .MuiSlider-rail {
    background-image: ${({ $colors }) => $colors};
    opacity: 1;
    height: 6px;
    border-radius: 3px;
  }
  .MuiSlider-track {
    background: none;
    border: 0;
  }
  .MuiSlider-thumb {
    width: 16px;
    height: 16px;
  }
`;

const GradesFilterSlider = () => {
  const { climbingFilter } = useUserSettingsContext();
  const { gradeInterval, setGradeInterval, grades } = climbingFilter;
  const { value, max } = convertToUnique(gradeInterval, grades);

  const onChange = (_: Event, newValue: Interval) => {
    setGradeInterval(convertFromUnique(newValue, grades));
  };
  return (
    <StyledSlider
      value={value}
      onChange={onChange}
      min={0}
      max={max}
      $colors={useGetSliderColors(grades)}
    />
  );
};

export const GradeFilter = () => {
  const { gradeSystem, climbingFilter } = useUserSettingsContext();
  const { gradeInterval, grades } = climbingFilter;

  return (
    <FilterCard>
      <Stack
        direction="row"
        spacing={1}
        justifyContent="space-between"
        alignItems="center"
      >
        <FilterSectionLabel $flush>{t('crag_filter.grade')}</FilterSectionLabel>
        <GradeSystemSelect showDefaultOnButton size="tiny" />
      </Stack>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mt={0.5}
        mb={0.25}
      >
        <RouteDifficultyBadge
          routeDifficulty={{
            gradeSystem,
            grade: grades[gradeInterval[0]],
          }}
        />
        <RouteDifficultyBadge
          routeDifficulty={{
            gradeSystem,
            grade: grades[gradeInterval[1]],
          }}
        />
      </Stack>
      <GradesFilterSlider />
    </FilterCard>
  );
};
