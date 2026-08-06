import { CRAG_ROUTES_LAYER } from '../climbingLayers/routesPoints';
import {
  setHoveredCragRoutes,
  setSelectedCragRoutes,
} from '../selectedCragRoutes';

const setFilter = jest.fn();
const map = { getLayer: () => ({}), setFilter };

jest.mock('../../../../services/mapStorage', () => ({
  getGlobalMap: () => map,
}));

const lastFilter = () => setFilter.mock.calls.at(-1);

describe('selectedCragRoutes', () => {
  beforeEach(() => {
    setFilter.mockClear();
    setSelectedCragRoutes(undefined);
    setHoveredCragRoutes(undefined);
  });

  it('filters the routes by the parent of the selected relation', () => {
    setSelectedCragRoutes(1234);

    expect(lastFilter()).toEqual([
      CRAG_ROUTES_LAYER,
      ['==', ['get', 'parentId'], 123],
    ]);
  });

  it('matches nothing when nothing is selected', () => {
    setSelectedCragRoutes(undefined);

    expect(lastFilter()).toEqual([
      CRAG_ROUTES_LAYER,
      ['==', ['get', 'parentId'], -1],
    ]);
  });

  it('matches nothing for a node/way - only relations have children', () => {
    setSelectedCragRoutes(1230);

    expect(lastFilter()).toEqual([
      CRAG_ROUTES_LAYER,
      ['==', ['get', 'parentId'], -1],
    ]);
  });

  it('lets hover win over the selected crag and falls back to it', () => {
    setSelectedCragRoutes(1234);
    setHoveredCragRoutes(5674);

    expect(lastFilter()).toEqual([
      CRAG_ROUTES_LAYER,
      ['==', ['get', 'parentId'], 567],
    ]);

    setHoveredCragRoutes(undefined);

    expect(lastFilter()).toEqual([
      CRAG_ROUTES_LAYER,
      ['==', ['get', 'parentId'], 123],
    ]);
  });
});
