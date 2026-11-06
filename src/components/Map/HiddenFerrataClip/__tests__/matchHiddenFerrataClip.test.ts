import type { View } from '../../../utils/MapStateContext';
import {
  HIDDEN_FERRATA_MAX_DISTANCE_M,
  HIDDEN_FERRATA_MIN_ZOOM,
  matchHiddenFerrataClip,
  getFerrataDetailClips,
} from '../matchHiddenFerrataClip';

const lenzsteig = {
  id: 'lenzsteig',
};
const tegelberg = {
  id: 'tegelberg',
};

describe('matchHiddenFerrataClip', () => {
  it('exposes the zoom and distance used to reveal a clip', () => {
    expect(HIDDEN_FERRATA_MIN_ZOOM).toBe(14);
    expect(HIDDEN_FERRATA_MAX_DISTANCE_M).toBe(700);
  });

  it('matches Lenzsteig when the map is zoomed onto Kalbenstein', () => {
    expect(
      matchHiddenFerrataClip(['16', '49.9913425', '9.7612947']),
    ).toMatchObject(lenzsteig);
    expect(matchHiddenFerrataClip(['16', '49.9913', '9.7613'])).toMatchObject(
      lenzsteig,
    );
  });

  it('matches Tegelbergsteig, including its entry node', () => {
    expect(
      matchHiddenFerrataClip(['16', '47.5626131', '10.7747456']),
    ).toMatchObject(tegelberg);
    expect(matchHiddenFerrataClip(['16', '47.5626', '10.7747'])).toMatchObject(
      tegelberg,
    );
    // OSM node 6403488285, about 120m from the way centre
    expect(
      matchHiddenFerrataClip(['16', '47.5629386', '10.7732414']),
    ).toMatchObject(tegelberg);
  });

  it('matches Ferrata Burrone Giovannelli at Mezzocorona', () => {
    expect(matchHiddenFerrataClip(['16', '46.2304', '11.0988'])).toMatchObject({
      id: 'mezzocorona',
    });
    // OSM node 2284261173, the board at the start, about 450m away
    expect(
      matchHiddenFerrataClip(['15', '46.227577', '11.0948826']),
    ).toMatchObject({
      id: 'mezzocorona',
    });
  });

  it('matches Riva del Garda at the town centre', () => {
    expect(matchHiddenFerrataClip(['14', '45.8848', '10.8397'])).toMatchObject({
      id: 'rivadelgarda',
      sources: ['/versteckt/rivadelgarda.mp4', '/versteckt/szene-33.mp4'],
    });
  });

  it.each([
    ['norissteig', '49.5441152', '11.5306697', 'norissteig'],
    ['laber', '47.5861767', '11.1029747', 'laber'],
    ['stopselzieher', '47.4225221', '10.9729653', 'stopselzieher'],
    ['wiener-neustaedter-huette', '47.423253', '10.970203', 'szene-14'],
    ['zugspitze', '47.42122', '10.98631', 'szene-15'],
    ['neuschwanstein', '47.55755', '10.74952', 'szene-26'],
    ['malcesine', '45.7643', '10.8101', 'szene-27'],
    ['kofel', '47.5869', '11.0595', 'szene-37'],
    ['cima-capi', '45.869364', '10.828636', 'szene-12'],
    ['cima-rocca', '45.87222', '10.82195', 'szene-11'],
  ])('matches the nearest spot at %s', (id, lat, lon, firstClip) => {
    const spot = matchHiddenFerrataClip(['16', lat, lon]);
    expect(spot?.id).toBe(id);
    expect(spot?.sources[0]).toBe(`/versteckt/${firstClip}.mp4`);
  });

  it('keeps the same spot while moving within its radius', () => {
    const summit = matchHiddenFerrataClip(['16', '47.5858442', '11.102169']);
    const station = matchHiddenFerrataClip(['16', '47.5861767', '11.1029747']);
    expect(station).toBe(summit);
  });

  it('stays hidden below zoom 14', () => {
    const onThePoint: View = ['13.99', '49.9913425', '9.7612947'];
    expect(matchHiddenFerrataClip(onThePoint)).toBeNull();
    expect(
      matchHiddenFerrataClip(['14', '49.9913425', '9.7612947']),
    ).toMatchObject(lenzsteig);
  });

  it('stays hidden when the centre is more than about 700 metres away', () => {
    // ~780m north of Lenzsteig
    expect(
      matchHiddenFerrataClip(['16', '49.9983425', '9.7612947']),
    ).toBeNull();
    // ~860m east of Lenzsteig
    expect(matchHiddenFerrataClip(['16', '49.9913425', '9.7733'])).toBeNull();
    expect(matchHiddenFerrataClip(['16', '48.5', '11'])).toBeNull();
  });

  it('still matches several hundred metres from the point', () => {
    // ~560m north of Lenzsteig
    expect(
      matchHiddenFerrataClip(['14.4', '49.9963425', '9.7612947']),
    ).toMatchObject(lenzsteig);
    // ~640m east of Lenzsteig
    expect(
      matchHiddenFerrataClip(['15', '49.9913425', '9.7702']),
    ).toMatchObject(lenzsteig);
  });

  it('ignores a view that is not three finite numbers', () => {
    expect(matchHiddenFerrataClip(['', '', ''])).toBeNull();
    expect(matchHiddenFerrataClip(['16', 'nope', '9.76'])).toBeNull();
  });
});

it('only exposes explicitly assigned clips in a detail view', () => {
  expect(getFerrataDetailClips('w1156787758')).toEqual([
    '/versteckt/norissteig.mp4',
  ]);
  expect(getFerrataDetailClips('r1156787758')).toBeUndefined();
});
