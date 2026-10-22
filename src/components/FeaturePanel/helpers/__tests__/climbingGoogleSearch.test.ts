import { intl } from '../../../../services/intl';
import { Feature, FeatureTags } from '../../../../services/types';
import { climbingGoogleSearch } from '../climbingGoogleSearch';

const place = (
  climbing: string,
  name: string,
  extra: FeatureTags = {},
  parents: Feature[] = [],
  osmType: 'node' | 'way' | 'relation' = 'relation',
): Feature =>
  ({
    osmMeta: { type: osmType, id: 1 },
    tags: { climbing, name, ...extra },
    parentFeatures: parents,
  }) as Feature;

const area = (name: string, extra: FeatureTags = {}) =>
  place('area', name, extra);

const crag = (name: string, extra: FeatureTags = {}, parents: Feature[] = []) =>
  place('crag', name, extra, parents);

describe('climbingGoogleSearch', () => {
  beforeEach(() => {
    intl.lang = 'en';
  });

  it('searches the climbing area name and the crag name', () => {
    const result = climbingGoogleSearch(
      crag('Královská věž', {}, [area('Adršpach')]),
    );

    expect(result).toEqual({
      query: 'Adršpach Královská věž',
      href: 'https://www.google.com/search?q=Adr%C5%A1pach%20Kr%C3%A1lovsk%C3%A1%20v%C4%9B%C5%BE',
    });
  });

  it('uses the nearest climbing area', () => {
    const result = climbingGoogleSearch(
      crag('Věž', {}, [area('Sektor'), area('Oblast')]),
    );

    expect(result?.query).toBe('Sektor Věž');
  });

  it('does not search from a climbing area', () => {
    expect(climbingGoogleSearch(area('Adršpach'))).toBeNull();
  });

  it('searches only the crag when it has no climbing area', () => {
    const result = climbingGoogleSearch(crag('Samotný crag'));

    expect(result?.query).toBe('Samotný crag');
  });

  it('does not repeat a name shared by the area and the crag', () => {
    const result = climbingGoogleSearch(
      crag('Adršpach', {}, [area('Adršpach')]),
    );

    expect(result?.query).toBe('Adršpach');
  });

  it('prefers the localized name', () => {
    intl.lang = 'cs';
    const result = climbingGoogleSearch(
      crag('Kralovska vez', { 'name:cs': 'Královská věž' }, [
        area('Adrspach', { 'name:cs': 'Adršpach' }),
      ]),
    );

    expect(result?.query).toBe('Adršpach Královská věž');
  });

  it('stays available next to an existing website', () => {
    expect(
      climbingGoogleSearch(
        crag('Věž', { 'climbing:url:thecrag': 'https://www.thecrag.com/1' }, [
          area('Oblast'),
        ]),
      )?.query,
    ).toBe('Oblast Věž');
  });

  it('searches a boulder and a climbing peak drawn with the crag pin', () => {
    expect(
      climbingGoogleSearch(
        place('boulder', 'Blok', {}, [area('Oblast')], 'node'),
      )?.query,
    ).toBe('Oblast Blok');

    expect(
      climbingGoogleSearch(
        place(
          '',
          'Winkelturm',
          { natural: 'peak', sport: 'climbing' },
          [area('Oblast')],
          'node',
        ),
      )?.query,
    ).toBe('Oblast Winkelturm');

    expect(
      climbingGoogleSearch(
        place(
          '',
          'Brandjochkreuz',
          { natural: 'peak' },
          [area('Area')],
          'node',
        ),
      )?.query,
    ).toBe('Area Brandjochkreuz');
  });

  it('skips areas, gyms and route dots', () => {
    expect(climbingGoogleSearch(area('Adršpach'))).toBeNull();
    expect(
      climbingGoogleSearch(
        place(
          '',
          'Gym',
          { leisure: 'sports_centre', sport: 'climbing' },
          [],
          'node',
        ),
      ),
    ).toBeNull();
    expect(
      climbingGoogleSearch(
        place('route_bottom', 'Cesta', {}, [area('Oblast')], 'node'),
      ),
    ).toBeNull();
  });

  it('returns nothing without a name', () => {
    expect(
      climbingGoogleSearch({ tags: { climbing: 'crag' } } as Feature),
    ).toBeNull();
    expect(
      climbingGoogleSearch({
        tags: { climbing: 'route', name: 'Cesta' },
      } as Feature),
    ).toBeNull();
  });
});
