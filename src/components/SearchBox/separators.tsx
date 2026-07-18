import { Divider } from '@mui/material';
import styled from '@emotion/styled';
import React from 'react';
import { Option } from './types';

// Groups that can appear in the results, in the order they're built in
// useGetOptions. A separator is inserted wherever two neighbouring options
// belong to a different group.
const getSection = (option: Option): string => {
  if (option.type === 'climbing') {
    const { type } = option.climbing;
    return type === 'route' || type === 'route_top'
      ? 'climbing-route'
      : 'climbing-group';
  }
  return option.type;
};

export const withSeparators = (options: Option[]): Option[] => {
  const result: Option[] = [];
  let prevSection: string | undefined;

  options.forEach((option) => {
    const section = getSection(option);
    if (prevSection !== undefined && section !== prevSection) {
      result.push({ type: 'separator', separator: { section } });
    }
    result.push(option);
    prevSection = section;
  });

  return result;
};

const StyledDivider = styled(Divider)`
  width: 100%;
  margin: 4px 0;
  border-color: ${({ theme }) =>
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(0, 0, 0, 0.12)'};
`;

export const SeparatorRow = () => <StyledDivider />;
