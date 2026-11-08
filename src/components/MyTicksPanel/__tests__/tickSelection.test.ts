import {
  applySelectionClick,
  EMPTY_SELECTION,
  setSelectionMany,
} from '../tickSelection';

const order = [10, 20, 30, 40, 50];
const ids = (s: { selectedIds: ReadonlySet<number> }) =>
  [...s.selectedIds].sort((a, b) => a - b);

describe('applySelectionClick', () => {
  it('toggles a row on plain click and sets the anchor', () => {
    const s1 = applySelectionClick(EMPTY_SELECTION, 20, {}, order);
    expect(ids(s1)).toEqual([20]);
    expect(s1.anchorId).toBe(20);

    const s2 = applySelectionClick(s1, 20, {}, order);
    expect(ids(s2)).toEqual([]);
  });

  it('CMD/CTRL click adds individual rows', () => {
    let s = applySelectionClick(EMPTY_SELECTION, 10, {}, order);
    s = applySelectionClick(s, 40, { metaKey: true }, order);
    s = applySelectionClick(s, 50, { ctrlKey: true }, order);
    expect(ids(s)).toEqual([10, 40, 50]);
  });

  it('SHIFT click selects a range from the anchor in both directions', () => {
    let s = applySelectionClick(EMPTY_SELECTION, 40, {}, order);
    s = applySelectionClick(s, 20, { shiftKey: true }, order);
    expect(ids(s)).toEqual([20, 30, 40]);
    expect(s.anchorId).toBe(40);

    s = applySelectionClick(s, 50, { shiftKey: true }, order);
    expect(ids(s)).toEqual([20, 30, 40, 50]);
  });

  it('SHIFT range keeps previously selected rows', () => {
    let s = applySelectionClick(EMPTY_SELECTION, 10, {}, order);
    s = applySelectionClick(s, 40, { metaKey: true }, order);
    s = applySelectionClick(s, 50, { shiftKey: true }, order);
    expect(ids(s)).toEqual([10, 40, 50]);
  });

  it('SHIFT without anchor (or hidden anchor) behaves like toggle', () => {
    const s1 = applySelectionClick(
      EMPTY_SELECTION,
      30,
      { shiftKey: true },
      order,
    );
    expect(ids(s1)).toEqual([30]);

    const s2 = applySelectionClick(
      { selectedIds: new Set([99]), anchorId: 99 },
      30,
      { shiftKey: true },
      order,
    );
    expect(ids(s2)).toEqual([30, 99]);
    expect(s2.anchorId).toBe(30);
  });
});

describe('setSelectionMany', () => {
  it('selects and deselects a group', () => {
    let s = setSelectionMany(EMPTY_SELECTION, [10, 20, 30], true);
    expect(ids(s)).toEqual([10, 20, 30]);
    s = setSelectionMany(s, [20, 30], false);
    expect(ids(s)).toEqual([10]);
  });
});
