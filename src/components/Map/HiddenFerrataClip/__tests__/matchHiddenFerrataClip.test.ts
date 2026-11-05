import { View } from '../../../utils/MapStateContext';
import {
  HIDDEN_FERRATA_MAX_DISTANCE_M,
  HIDDEN_FERRATA_MIN_ZOOM,
  matchHiddenFerrataClip,
} from '../matchHiddenFerrataClip';

const lenzsteig = {
  id: 'lenzsteig',
  src: '/versteckt/lenzsteig.mp4',
};
const tegelberg = {
  id: 'tegelberg',
  src: '/versteckt/tegelberg.mp4',
};

describe('matchHiddenFerrataClip', () => {
  it('exposes the zoom and distance used to reveal a clip', () => {
    expect(HIDDEN_FERRATA_MIN_ZOOM).toBe(14);
    expect(HIDDEN_FERRATA_MAX_DISTANCE_M).toBe(700);
  });

  it('matches Lenzsteig when the map is zoomed onto Kalbenstein', () => {
    expect(matchHiddenFerrataClip(['16', '49.9913425', '9.7612947'])).toEqual(
      lenzsteig,
    );
    expect(matchHiddenFerrataClip(['16', '49.9913', '9.7613'])).toEqual(
      lenzsteig,
    );
  });

  it('matches Tegelbergsteig, including its entry node', () => {
    expect(matchHiddenFerrataClip(['16', '47.5626131', '10.7747456'])).toEqual(
      tegelberg,
    );
    expect(matchHiddenFerrataClip(['16', '47.5626', '10.7747'])).toEqual(
      tegelberg,
    );
    // OSM node 6403488285, about 120m from the way centre
    expect(matchHiddenFerrataClip(['16', '47.5629386', '10.7732414'])).toEqual(
      tegelberg,
    );
  });

  it('matches Ferrata Burrone Giovannelli at Mezzocorona', () => {
    expect(matchHiddenFerrataClip(['16', '46.2304', '11.0988'])).toEqual({
      id: 'mezzocorona',
      src: '/versteckt/mezzocorona.mp4',
    });
    // OSM node 2284261173, the board at the start, about 450m away
    expect(matchHiddenFerrataClip(['15', '46.227577', '11.0948826'])).toEqual({
      id: 'mezzocorona',
      src: '/versteckt/mezzocorona.mp4',
    });
  });

  it('stays hidden below zoom 14', () => {
    const onThePoint: View = ['13.99', '49.9913425', '9.7612947'];
    expect(matchHiddenFerrataClip(onThePoint)).toBeNull();
    expect(matchHiddenFerrataClip(['14', '49.9913425', '9.7612947'])).toEqual(
      lenzsteig,
    );
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
    expect(matchHiddenFerrataClip(['14.4', '49.9963425', '9.7612947'])).toEqual(
      lenzsteig,
    );
    // ~640m east of Lenzsteig
    expect(matchHiddenFerrataClip(['15', '49.9913425', '9.7702'])).toEqual(
      lenzsteig,
    );
  });

  it('ignores a view that is not three finite numbers', () => {
    expect(matchHiddenFerrataClip(['', '', ''])).toBeNull();
    expect(matchHiddenFerrataClip(['16', 'nope', '9.76'])).toBeNull();
  });
});
