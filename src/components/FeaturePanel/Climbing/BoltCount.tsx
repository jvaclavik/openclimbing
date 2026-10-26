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

// Bolt hanger – the plate with a hole climbers clip their quickdraws into.
const BoltHangerIcon = (props: SvgIconProps) => (
  <SvgIcon viewBox="0 0 24 24" {...props}>
    <path
      d="M12 2.5a5 5 0 0 0-2.2 9.5l-3.3 6.3A1.6 1.6 0 0 0 7.9 21h8.2a1.6 1.6 0 0 0 1.4-2.7l-3.3-6.3A5 5 0 0 0 12 2.5zm0 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"
      fillRule="evenodd"
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
        <BoltHangerIcon
          sx={{ fontSize: '1.15em', verticalAlign: '-0.2em', mr: '2px' }}
        />
        {count}
      </Container>
    </Tooltip>
  );
};
