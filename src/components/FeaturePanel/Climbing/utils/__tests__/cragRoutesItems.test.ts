import { EditDataItem } from '../../../EditDialog/context/types';
import { getDraftCragCenter } from '../cragRoutesItems';

const item = (props: Partial<EditDataItem>) => props as EditDataItem;

const sector1 = item({
  shortId: 'r-3',
  members: [],
  relationClickedLonLat: [14.1, 50.1],
});
const sector2 = item({
  shortId: 'r-4',
  members: [],
  relationClickedLonLat: [14.2, 50.2],
});

describe('getDraftCragCenter', () => {
  it('keeps the position of each new sector converted from a node', () => {
    const items = [sector1, sector2];
    expect(getDraftCragCenter(items, sector1)).toEqual([14.1, 50.1]);
    expect(getDraftCragCenter(items, sector2)).toEqual([14.2, 50.2]);
  });

  it('prefers the routes already placed in the new sector', () => {
    const route = item({ shortId: 'n-5', nodeLonLat: [14.3, 50.3] });
    const sector = item({
      ...sector1,
      members: [{ shortId: 'n-5', role: '' }],
    });
    expect(getDraftCragCenter([sector, route], sector)).toEqual([14.3, 50.3]);
  });

  it('ignores crags already in OSM', () => {
    const existing = item({ ...sector1, shortId: 'r123' });
    expect(getDraftCragCenter([existing], existing)).toBeUndefined();
  });
});
