import React from 'react';
import { render, screen } from '@testing-library/react';
import { intl } from '../../../../services/intl';
import { RouteNumberBadge, RoutesSummary } from '../ClimbingPdfExportDialog';

jest.mock('../../../../services/my-ticks/TickStyleBadge', () => ({
  TickStyleBadge: ({ style }: { style: string }) => (
    <span data-testid="tick-style-badge">{style}</span>
  ),
}));

jest.mock('../ClimbingBadges', () => ({
  ClimbingBadges: () => null,
}));

jest.mock('../ConvertedRouteDifficultyBadge', () => ({
  ConvertedRouteDifficultyBadge: () => <span>grade-badge</span>,
}));

jest.mock('../../../../services/tagging/climbing/routeGrade', () => ({
  getDifficulty: () => 'vb',
  getDifficultyColor: () => '#123456',
  getDifficulties: () => [],
  findOrConvertRouteGrade: () => ({ routeDifficulty: null }),
}));

jest.mock('../../../../helpers/featureLabel', () => ({
  getLabel: () => 'Crag',
  getDescription: () => '',
}));

jest.mock('../../../../services/helpers', () => ({
  getShortId: () => 'route-1',
  getFullOsmappLink: () => 'https://openclimbing.org',
}));

describe('PDF export tick visibility', () => {
  beforeAll(() => {
    intl.messages = {
      ...intl.messages,
      'climbingpanel.pdf_export_route_name': 'Route',
      'climbingpanel.pdf_export_grade': 'Grade',
      'climbingpanel.pdf_export_tick_short': '✓',
    };
  });

  const items = [
    {
      displayNumber: 1,
      route: {
        id: 'route-1',
        feature: {
          osmMeta: { type: 'way', id: 1 },
          tags: { name: 'First route' },
        },
        paths: { 'photo.jpg': [{ x: 0.2, y: 0.3 }] },
      },
    },
  ] as any;

  const ticks = [{ shortId: 'route-1', style: 'flash' }] as any;

  test('hides tick column and badge by default', () => {
    render(<RoutesSummary items={items} ticks={ticks} showTicks={false} />);

    expect(screen.queryByText('✓')).toBeNull();
    expect(screen.queryByTestId('tick-style-badge')).toBeNull();
    expect(screen.getByText('First route')).toBeTruthy();
    expect(screen.getByText('grade-badge')).toBeTruthy();
  });

  test('shows tick column and badge when enabled', () => {
    render(<RoutesSummary items={items} ticks={ticks} showTicks={true} />);

    expect(screen.getByText('✓')).toBeTruthy();
    expect(screen.getByTestId('tick-style-badge').textContent).toBe('flash');
  });

  test('renders route tick marker on photo badges only when enabled', () => {
    const hidden = render(
      <svg>
        <RouteNumberBadge
          routeNumber={1}
          cx={50}
          cy={50}
          unit={4}
          fill="#123456"
          isTicked={false}
        />
      </svg>,
    );
    expect(hidden.container.querySelectorAll('circle')).toHaveLength(0);

    hidden.unmount();

    const visible = render(
      <svg>
        <RouteNumberBadge
          routeNumber={1}
          cx={50}
          cy={50}
          unit={4}
          fill="#123456"
          isTicked={true}
        />
      </svg>,
    );
    expect(visible.container.querySelectorAll('circle')).toHaveLength(2);
  });
});
