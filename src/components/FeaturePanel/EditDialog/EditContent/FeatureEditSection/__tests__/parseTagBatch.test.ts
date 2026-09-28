import { parseTagBatch } from '../parseTagBatch';

const SAMPLE = `climbing=route_bottom
climbing:grade:uiaa=6-/6
name=Tarzanweg / Tarzan
sport=climbing
climbing:length=14m
climbing:sport=yes

climbing=route_bottom
climbing:grade:uiaa=8-
name=Pickel im Nacken
sport=climbing
climbing:length=14m
climbing:sport=yes

climbing=route_bottom
climbing:grade:uiaa=3-
name=Katzensteg
sport=climbing
climbing:sport=yes

climbing=route_bottom
climbing:grade:uiaa=6+
name=Tempo Knacker / Tempo Kacker
sport=climbing
climbing:length=10m
climbing:sport=yes

climbing=route_bottom
climbing:grade:uiaa=5
name=Fer May Weg / Alter Weg
sport=climbing
climbing:length=10m
climbing:sport=yes

climbing=route_bottom
climbing:grade:uiaa=7-
name=Bremse auch für Schwaben
sport=climbing
climbing:length=15m
climbing:sport=yes
`;

describe('parseTagBatch', () => {
  it('parses blank-line separated key=value route blocks', () => {
    const routes = parseTagBatch(SAMPLE);
    expect(routes).toHaveLength(6);
    expect(routes?.[0]).toEqual({
      climbing: 'route_bottom',
      'climbing:grade:uiaa': '6-/6',
      name: 'Tarzanweg / Tarzan',
      sport: 'climbing',
      'climbing:length': '14m',
      'climbing:sport': 'yes',
    });
    expect(routes?.[2]).toEqual({
      climbing: 'route_bottom',
      'climbing:grade:uiaa': '3-',
      name: 'Katzensteg',
      sport: 'climbing',
      'climbing:sport': 'yes',
    });
    expect(routes?.[5].name).toBe('Bremse auch für Schwaben');
    expect(routes?.[5]['climbing:length']).toBe('15m');
  });

  it('keeps the one-name-per-line format out of tag parsing', () => {
    expect(parseTagBatch('Cat in a Hat 6a\nSecond route')).toBeNull();
    expect(parseTagBatch('')).toBeNull();
  });

  it('trims keys and values and keeps equals signs inside the value', () => {
    expect(parseTagBatch('name = Foo = Bar\nclimbing=route_bottom')).toEqual([
      { name: 'Foo = Bar', climbing: 'route_bottom' },
    ]);
  });

  it('accepts windows newlines and extra blank lines', () => {
    expect(
      parseTagBatch('name=A\r\nclimbing=route_bottom\r\n\r\n\r\nname=B\r\n'),
    ).toEqual([{ name: 'A', climbing: 'route_bottom' }, { name: 'B' }]);
  });
});
