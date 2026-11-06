import { readFileSync } from 'node:fs';
import { readNorissteigTrack } from '../norissteigTrack';

const gpx = (count: number) => {
  const points = Array.from({ length: count }, (_, index) => {
    if (index === 0) return '<trkpt lat="49.55174" lon="11.52507"/>';
    if (index === count - 1) return '<trkpt lat="49.551741" lon="11.524927"/>';
    return '<trkpt lat="49.546417" lon="11.523"/>';
  });
  return `<gpx xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg>${points.join('')}</trkseg></trk></gpx>`;
};

test('retains the full path in longitude/latitude order and adds both markers', () => {
  const { features } = readNorissteigTrack(gpx(291));
  expect(features[0].geometry.type).toBe('LineString');
  expect(features[0].geometry.coordinates).toHaveLength(291);
  expect(features[0].geometry.coordinates[0]).toEqual([11.52507, 49.55174]);
  expect(features.slice(1).map(({ properties }) => properties?.label)).toEqual([
    'Start',
    'Einstieg',
  ]);
});

test('rejects a different or incomplete track', () => {
  expect(() => readNorissteigTrack(gpx(290))).toThrow();
  expect(() =>
    readNorissteigTrack(gpx(291).replace('11.52507', '180')),
  ).toThrow();
  expect(() => readNorissteigTrack('<gpx')).toThrow();
});

const original = process.env.NORISSTEIG_TEST_GPX;
(original ? test : test.skip)('imports the supplied original GPX', () => {
  const { features } = readNorissteigTrack(readFileSync(original!, 'utf8'));
  expect(features[0].geometry.coordinates).toHaveLength(291);
});
