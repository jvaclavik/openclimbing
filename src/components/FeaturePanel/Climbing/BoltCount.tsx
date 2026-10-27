import styled from '@emotion/styled';
import { SvgIcon, SvgIconProps, Tooltip } from '@mui/material';
import React from 'react';
import { t } from '../../../services/intl';
import { FeatureTags } from '../../../services/types';

/**
 * Number of fixed protection points (bolts) of a route, surveyed by mappers.
 * Protection points drawn on topo photos are deliberately not counted – they
 * are usually incomplete, so they would be a misleading safety hint.
 */
export const parseBoltCount = (tags: FeatureTags = {}): number | null => {
  const raw = tags['climbing:bolts']?.trim();
  if (!raw || !/^\d+$/.test(raw)) {
    return null;
  }
  const count = parseInt(raw, 10);
  return Number.isSafeInteger(count) ? count : null;
};

// Carabiner with an open gate – the body keeps a nose hook (top right) and a
// hinge stub (bottom right), so the gate swinging inwards leaves a clear gap.
const CarabinerIcon = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path
      d="M15.7 9.8C16.5 8.6 16.6 7.4 16.3 6.4 15.6 4.6 13.9 3.4 11.9 3.4 9.6 3.4 7.7 5.5 7.7 8.2v7.6c0 2.8 1.9 4.9 4.2 4.9 1.2 0 2.4-.4 3.2-1.2.5-.6.8-1.3.9-2.1"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12.2 10.8 16 17.4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </SvgIcon>
);

const Container = styled.span`
  color: ${({ theme }) => theme.palette.text.secondary};
  font-size: 0.85em;
  line-height: inherit;
  white-space: nowrap;
`;

type Props = {
  tags: FeatureTags;
};

export const BoltCount = ({ tags }: Props) => {
  const count = parseBoltCount(tags);
  if (count === null) {
    return null;
  }

  const label = t('climbing_bolts.label');
  return (
    <Tooltip title={label} arrow>
      <Container role="img" aria-label={`${label}: ${count}`}>
        {/* inline icon – `vertical-align` keeps it optically centered on the digits */}
        <CarabinerIcon
          sx={{ fontSize: '1.15em', verticalAlign: '-0.2em', mr: '2px' }}
        />
        {count}
      </Container>
    </Tooltip>
  );
};
