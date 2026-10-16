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

describe('ClimbingBadges', () => {
  beforeAll(() => {
    intl.messages = {
      ...intl.messages,
      'climbing_badges.boulder_label': 'Boulder',
      'climbing_badges.boulder_description': 'Bouldering',
      'climbing_badges.sport_label': 'Sport',
      'climbing_badges.sport_description': 'Sport climbing',
    };
  });

  it('renders a badge for climbing:sport=yes', () => {
    render(<ClimbingBadges feature={feature({ 'climbing:sport': 'yes' })} />);

    expect(screen.getByText('Sport')).toBeTruthy();
  });

  it('renders a badge for numeric values like climbing:sport=10', () => {
    render(<ClimbingBadges feature={feature({ 'climbing:sport': '10' })} />);

    expect(screen.getByText('Sport')).toBeTruthy();
  });

  it('renders numeric and yes badges side by side', () => {
    render(
      <ClimbingBadges
        feature={feature({
          'climbing:sport': '10',
          'climbing:boulder': 'yes',
        })}
      />,
    );

    expect(screen.getByText('Sport')).toBeTruthy();
    expect(screen.getByText('Boulder')).toBeTruthy();
  });

  it.each(['no', '0'])(
    'hides the badge for climbing:sport=%s',
    (value: string) => {
      render(<ClimbingBadges feature={feature({ 'climbing:sport': value })} />);

      expect(screen.queryByText(/Sport/)).toBeNull();
    },
  );
});
