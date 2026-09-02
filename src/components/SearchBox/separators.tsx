import styled from '@emotion/styled';
import React from 'react';
import { Option } from './types';
import { t } from '../../services/intl';
import type { TranslationId } from '../../services/types';

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

const SECTION_LABELS: Record<string, TranslationId> = {
  'climbing-group': 'searchbox.section.climbing',
  'climbing-route': 'searchbox.section.routes',
  geocoder: 'searchbox.section.places',
  preset: 'searchbox.section.categories',
};

const Header = styled.div`
  width: 100%;
  padding: 10px 12px 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.palette.text.secondary};
`;

type SeparatorRowProps = {
  section?: string;
};

export const SeparatorRow = ({ section }: SeparatorRowProps) => {
  const labelId = section ? SECTION_LABELS[section] : undefined;
  if (!labelId) {
    return null;
  }
  return <Header>{t(labelId)}</Header>;
};
