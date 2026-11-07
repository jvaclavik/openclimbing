import { linesFromGeometry, viaFerrataGpx } from '../komootGpx';

test('builds one GPX track from the via ferrata line', () => {
  const lines = linesFromGeometry({
    type: 'GeometryCollection',
    geometries: [
      { type: 'Point', coordinates: [11, 49] },
      {
        type: 'LineString',
        coordinates: [
          [11.5, 49.5],
          [11.6, 49.6],
        ],
      },
    ],
  });
  const gpx = viaFerrataGpx('Norissteig & Tal', lines);
  expect(gpx).toContain('<name>Norissteig ' + '&' + 'amp; Tal</name>');
  expect(gpx).toContain('<trkpt lat="49.5" lon="11.5"></trkpt>');
  expect(gpx.match(/<trkseg>/g)).toHaveLength(1);
});
