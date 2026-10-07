import { getPhotoMarkerNames } from '../CragPhotoMarkers';
import { getImageDefs } from '../../../services/images/getImageDefs';
import { Feature, FeatureTags, LonLat, OsmType } from '../../../services/types';

const center: LonLat = [11.4029, 47.2868];

const getFeature = (tags: FeatureTags, osmType: OsmType = 'node') =>
  ({
    center,
    osmMeta: { type: osmType, id: 14248046611 },
    tags,
    imageDefs: getImageDefs(tags, osmType, center),
  }) as Feature;

const photos = {
  wikimedia_commons: 'File:Crag.jpg',
  'wikimedia_commons:2': 'File:Crag 2.jpg',
};

describe('getPhotoMarkerNames', () => {
  it('returns photos of a crag mapped as a node', () => {
    const feature = getFeature({ climbing: 'crag', ...photos });

    expect(getPhotoMarkerNames(feature)).toEqual(['Crag.jpg', 'Crag 2.jpg']);
  });

  it('returns photos of a crag mapped as a relation', () => {
    const feature = getFeature({ climbing: 'crag', ...photos }, 'relation');

    expect(getPhotoMarkerNames(feature)).toEqual(['Crag.jpg', 'Crag 2.jpg']);
  });

  it('returns photos of crag-like nodes without climbing=crag', () => {
    const boulder = getFeature({ climbing: 'boulder', ...photos });
    const peak = getFeature({
      natural: 'peak',
      sport: 'climbing',
      'climbing:sport': '5',
      ...photos,
    });

    expect(getPhotoMarkerNames(boulder)).toEqual(['Crag.jpg', 'Crag 2.jpg']);
    expect(getPhotoMarkerNames(peak)).toEqual(['Crag.jpg', 'Crag 2.jpg']);
  });

  it('ignores images which are not on Wikimedia Commons', () => {
    const feature = getFeature({
      climbing: 'crag',
      image: 'https://example.com/photo.jpg',
    });

    expect(getPhotoMarkerNames(feature)).toEqual([]);
    expect(getPhotoMarkerNames(getFeature({ climbing: 'crag' }))).toEqual([]);
  });

  it('returns nothing for areas, routes and non-climbing features', () => {
    const area = getFeature({ climbing: 'area', ...photos });
    const route = getFeature({ climbing: 'route_bottom', ...photos });
    const viewpoint = getFeature({ tourism: 'viewpoint', ...photos });

    expect(getPhotoMarkerNames(area)).toEqual([]);
    expect(getPhotoMarkerNames(route)).toEqual([]);
    expect(getPhotoMarkerNames(viewpoint)).toEqual([]);
    expect(getPhotoMarkerNames(null)).toEqual([]);
  });
});
