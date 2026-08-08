import { expression, latest } from '@maplibre/maplibre-gl-style-spec';
import { outlinesLayer } from '../climbingLayers/outlinesLayer';

const evaluate = (
  property: 'line-opacity' | 'line-width',
  zoom: number,
  featureState: Record<string, unknown>,
  minZoom: number | null = 10,
) => {
  const paint = outlinesLayer.paint as Record<string, unknown>;
  const result = expression.createPropertyExpression(
    paint[property],
    latest.paint_line[property],
  );
  if (result.result === 'error') {
    throw new Error(result.value.map((error) => error.message).join(', '));
  }

  const feature = { type: 1 as const, properties: { minZoom } };
  return result.value.evaluate({ zoom }, feature, featureState);
};

describe('outlinesLayer', () => {
  it('hides the outline until hovered', () => {
    expect(evaluate('line-opacity', 14, {})).toBe(0);
    expect(evaluate('line-opacity', 14, { hover: true })).toBe(0.5);
  });

  it('keeps the outline hidden when zoomed out too far', () => {
    expect(evaluate('line-opacity', 8, { hover: true })).toBe(0);
  });

  it('hides the outline when minZoom is missing', () => {
    expect(evaluate('line-opacity', 18, {}, null)).toBe(0);
    expect(evaluate('line-opacity', 18, { hover: true }, null)).toBe(0);
    expect(evaluate('line-opacity', 18, { selected: true }, null)).toBe(0.5);
  });

  it('shows the outline of the selected feature without hover, in any zoom', () => {
    expect(evaluate('line-opacity', 14, { selected: true })).toBe(0.5);
    expect(evaluate('line-opacity', 8, { selected: true })).toBe(0.5);
    expect(evaluate('line-width', 14, { selected: true })).toBe(3);
    expect(evaluate('line-width', 14, {})).toBe(2);
  });
});
