import { gradeColors } from '../climbing/gradeData';
import {
  getViaFerrataScaleColor,
  getViaFerrataScaleRangeColor,
  getViaFerrataGrades,
  formatViaFerrataScaleRange,
  VIA_FERRATA_SCALE_COLORS,
} from '../viaFerrataScale';

describe('getViaFerrataGrades', () => {
  it('converts scale 0 to F with no German equivalent', () => {
    expect(getViaFerrataGrades('0')).toEqual({
      french: 'F',
      german: undefined,
    });
  });

  it('converts scale 1 to PD / K1', () => {
    expect(getViaFerrataGrades('1')).toEqual({ french: 'PD', german: 'K1' });
  });

  it('converts scale 2 to AD / K2', () => {
    expect(getViaFerrataGrades('2')).toEqual({ french: 'AD', german: 'K2' });
  });

  it('converts scale 3 to D / K3', () => {
    expect(getViaFerrataGrades('3')).toEqual({ french: 'D', german: 'K3' });
  });

  it('converts scale 4 to TD / K4', () => {
    expect(getViaFerrataGrades('4')).toEqual({ french: 'TD', german: 'K4' });
  });

  it('converts scale 5 to ED / K5', () => {
    expect(getViaFerrataGrades('5')).toEqual({ french: 'ED', german: 'K5' });
  });

  it('converts scale 6 to ABO / K6', () => {
    expect(getViaFerrataGrades('6')).toEqual({ french: 'ABO', german: 'K6' });
  });

  it('supports plus and minus grades', () => {
    expect(getViaFerrataGrades('2+')).toEqual({ french: 'AD+', german: 'K2+' });
    expect(getViaFerrataGrades('3-')).toEqual({ french: 'D-', german: 'K3-' });
    expect(getViaFerrataGrades('0+')).toEqual({
      french: 'F+',
      german: undefined,
    });
  });

  it('returns undefined for invalid values', () => {
    expect(getViaFerrataGrades('7')).toBeUndefined();
    expect(getViaFerrataGrades('abc')).toBeUndefined();
    expect(getViaFerrataGrades('')).toBeUndefined();
    expect(getViaFerrataGrades('2++')).toBeUndefined();
  });
});

describe('formatViaFerrataScaleRange', () => {
  it('returns a single scale or a min–max range', () => {
    expect(formatViaFerrataScaleRange(['2+'])).toBe('2+');
    expect(formatViaFerrataScaleRange(['4', '2+', '3'])).toBe('2+–4');
    expect(formatViaFerrataScaleRange(['3', '3', 'x'])).toBe('3');
    expect(formatViaFerrataScaleRange(['nope'])).toBeNull();
  });
});

describe('VIA_FERRATA_SCALE_COLORS', () => {
  it('has colors for all valid scale values', () => {
    expect(VIA_FERRATA_SCALE_COLORS['0']).toBeDefined();
    expect(VIA_FERRATA_SCALE_COLORS['6']).toBeDefined();
  });

  it('uses the same color ramp as climbing grades', () => {
    expect(VIA_FERRATA_SCALE_COLORS['0']).toEqual(gradeColors['1-']);
    expect(VIA_FERRATA_SCALE_COLORS['1']).toEqual(gradeColors['1-']);
    expect(VIA_FERRATA_SCALE_COLORS['2']).toEqual(gradeColors['4-']);
    expect(VIA_FERRATA_SCALE_COLORS['3']).toEqual(gradeColors['6-']);
    expect(VIA_FERRATA_SCALE_COLORS['4']).toEqual(gradeColors['8-']);
    expect(VIA_FERRATA_SCALE_COLORS['5']).toEqual(gradeColors['10-']);
    expect(VIA_FERRATA_SCALE_COLORS['6']).toEqual(gradeColors['10-']);
  });
});

describe('getViaFerrataScaleColor', () => {
  it('uses base color for plus and minus grades', () => {
    expect(getViaFerrataScaleColor('2+', 'light')).toBe(
      VIA_FERRATA_SCALE_COLORS['2'].light,
    );
    expect(getViaFerrataScaleColor('3-', 'dark')).toBe(
      VIA_FERRATA_SCALE_COLORS['3'].dark,
    );
  });

  it('returns undefined for invalid values', () => {
    expect(getViaFerrataScaleColor('8')).toBeUndefined();
    expect(getViaFerrataScaleColor('x')).toBeUndefined();
  });

  it('colors a range by the harder grade', () => {
    expect(getViaFerrataScaleRangeColor('2+–4', 'light')).toBe(
      VIA_FERRATA_SCALE_COLORS['4'].light,
    );
  });
});
