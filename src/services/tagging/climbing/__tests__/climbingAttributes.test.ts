import { getClimbingAttributes } from '../climbingAttributes';

describe('getClimbingAttributes', () => {
  it('reads material from the material tag', () => {
    expect(getClimbingAttributes({ material: 'sandstone' }).materials).toEqual([
      'sandstone',
    ]);
  });

  it('does not read the deprecated climbing:rock tag', () => {
    expect(
      getClimbingAttributes({ 'climbing:rock': 'sandstone' }).materials,
    ).toEqual([]);
  });
});
