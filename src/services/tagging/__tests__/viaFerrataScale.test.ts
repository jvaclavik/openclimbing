import {
  getViaFerrataGrades,
  VIA_FERRATA_SCALE_COLORS,
} from '../viaFerrataScale';

describe('getViaFerrataGrades', () => {
  it('converts scale 0 to F / K0', () => {
    expect(getViaFerrataGrades('0')).toEqual({ french: 'F', german: 'K0' });
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

  it('returns undefined for invalid values', () => {
    expect(getViaFerrataGrades('7')).toBeUndefined();
    expect(getViaFerrataGrades('abc')).toBeUndefined();
    expect(getViaFerrataGrades('')).toBeUndefined();
  });
});

describe('VIA_FERRATA_SCALE_COLORS', () => {
  it('has colors for all valid scale values', () => {
    expect(VIA_FERRATA_SCALE_COLORS['0']).toBeDefined();
    expect(VIA_FERRATA_SCALE_COLORS['6']).toBeDefined();
  });
});
