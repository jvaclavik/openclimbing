import React from 'react';
import { render, screen } from '@testing-library/react';
import { intl } from '../../../../services/intl';
import { Feature } from '../../../../services/types';
import { ClimbingBadges } from '../ClimbingBadges';

const feature = (tags: Record<string, string>) =>
  ({
    type: 'Feature',
    osmMeta: { type: 'node', id: 1 },
    tags,
    properties: {},
  }) as unknown as Feature;

describe('ClimbingBadges aid and dry tooling', () => {
  beforeAll(() => {
    intl.messages = {
      ...intl.messages,
      'climbing_badges.aid_label': 'Aid',
      'climbing_badges.aid_description': 'Aid climbing',
      'climbing_badges.dry_label': 'Dry tooling',
      'climbing_badges.dry_description': 'Dry tooling description',
    };
  });

  it('renders the aid badge for climbing:aid=yes', () => {
    render(<ClimbingBadges feature={feature({ 'climbing:aid': 'yes' })} />);

    expect(screen.getByText('Aid')).toBeTruthy();
  });

  it('renders the dry tooling badge for climbing:dry=yes', () => {
    render(<ClimbingBadges feature={feature({ 'climbing:dry': 'yes' })} />);

    expect(screen.getByText('Dry tooling')).toBeTruthy();
  });

  it('does not render the aid badge for climbing:aid=no', () => {
    render(<ClimbingBadges feature={feature({ 'climbing:aid': 'no' })} />);

    expect(screen.queryByText('Aid')).toBeNull();
  });

  it('does not render the dry tooling badge for climbing:dry=no', () => {
    render(<ClimbingBadges feature={feature({ 'climbing:dry': 'no' })} />);

    expect(screen.queryByText('Dry tooling')).toBeNull();
  });
});
