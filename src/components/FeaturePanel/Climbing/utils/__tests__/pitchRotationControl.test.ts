import {
  pointerToBearing,
  snapBearing,
  stepBearing,
  wrapBearing,
} from '../pitchRotationControl';

describe('pitchRotationControl', () => {
  it('treats up as north and right as east', () => {
    expect(pointerToBearing(0, -10)).toBe(0);
    expect(pointerToBearing(10, 0)).toBe(90);
    expect(pointerToBearing(0, 10)).toBe(180);
    expect(pointerToBearing(-10, 0)).toBe(270);
  });

  it('snaps a drag to 15° and wraps a 45° step', () => {
    expect(snapBearing(22)).toBe(15);
    expect(snapBearing(23)).toBe(30);
    expect(stepBearing(null, 45)).toBe(45);
    expect(stepBearing(null, -45)).toBe(315);
    expect(stepBearing(350, 45)).toBe(35);
    expect(wrapBearing(-20)).toBe(340);
  });
});
