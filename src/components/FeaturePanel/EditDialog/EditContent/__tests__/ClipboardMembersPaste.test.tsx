import React, { useEffect } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { ClipboardMembersPaste } from '../ClipboardMembersPaste';
import { EditContextProvider, useEditContext } from '../../context/EditContext';
import { addEmptyOriginalState } from '../../context/itemsHelpers';
import { DataItem, EditDataItem } from '../../context/types';
import { t } from '../../../../../services/intl';

jest.mock('../../../../../services/osm/fetchParentFeatures', () => ({
  fetchParentFeatures: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../../../../services/osm/fetchWays', () => ({
  fetchWays: jest.fn().mockResolvedValue([]),
}));
jest.mock('../../../helpers/EditDialogContext', () => ({
  useEditDialogContext: () => ({ opened: true }),
}));
jest.mock('../../../../utils/FeatureContext', () => ({
  useFeatureContext: () => ({ feature: undefined }),
}));
const mockShowToast = jest.fn();
jest.mock('../../../../utils/SnackbarContext', () => ({
  useSnackbar: () => ({ showToast: mockShowToast }),
}));

const ROUTES = `name=Cat in a Hat
climbing:grade:uiaa=6

name=Tarzanweg`;

const ROUTES_WITH_TYPE = `climbing=route_bottom
name=Cat in a Hat

climbing=route_bottom
name=Tarzanweg`;

const item = (shortId: string, tags: Record<string, string>): DataItem =>
  addEmptyOriginalState({
    shortId,
    version: shortId.includes('-') ? undefined : 1,
    tagsEntries: Object.entries(tags),
    toBeDeleted: false,
    ...(shortId.startsWith('n') ? { nodeLonLat: [14, 50] } : { members: [] }),
    sections: [],
  });

const crag = (shortId: string) =>
  item(shortId, { climbing: 'crag', sport: 'climbing' });

let context: ReturnType<typeof useEditContext>;
const Setup = ({ item }: { item: DataItem }) => {
  context = useEditContext();
  const { addItem, setCurrent, current } = context;
  useEffect(() => {
    addItem(item);
    setCurrent(item.shortId);
  }, [addItem, item, setCurrent]);
  return current ? (
    <>
      <input aria-label="field" />
      <ClipboardMembersPaste />
    </>
  ) : null;
};

const renderWith = (item: DataItem) =>
  render(
    <EditContextProvider>
      <Setup item={item} />
    </EditContextProvider>,
  );

const paste = (text: string, target: Element = document.body) => {
  const event = new Event('paste', { bubbles: true });
  Object.defineProperty(event, 'clipboardData', {
    value: { getData: () => text },
  });
  act(() => {
    target.dispatchEvent(event);
  });
};

const clickButton = async (name: string) => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name }));
  });
};

const findItem = (shortId: string) =>
  context.items.find((item) => item.shortId === shortId);
const memberTags = (relation: EditDataItem) =>
  relation.members.map(({ shortId }) => findItem(shortId).tags);

describe('ClipboardMembersPaste', () => {
  beforeEach(() => mockShowToast.mockClear());

  it('adds pasted tag blocks as members of the current relation', () => {
    renderWith(crag('r1'));

    paste(ROUTES);

    expect(memberTags(findItem('r1'))).toEqual([
      {
        name: 'Cat in a Hat',
        'climbing:grade:uiaa': '6',
        climbing: 'route_bottom',
        sport: 'climbing',
      },
      { name: 'Tarzanweg', climbing: 'route_bottom', sport: 'climbing' },
    ]);
  });

  it('ignores a paste into a form field and text that is not tags', () => {
    renderWith(crag('r1'));

    paste(ROUTES, screen.getByLabelText('field'));
    paste('just some text');

    expect(findItem('r1').members).toEqual([]);
  });

  it('asks to convert a node first, then adds the members', async () => {
    renderWith(crag('n-100'));

    paste(ROUTES);
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', {
          name: t('editdialog.members.convert_button'),
        }),
      );
    });

    const relation = findItem(context.current);
    expect(relation.shortId).toMatch(/^r-/);
    expect(memberTags(relation).map(({ name }) => name)).toEqual([
      'Cat in a Hat',
      'Tarzanweg',
    ]);
  });

  it('turns another relation into a crag when routes are pasted', () => {
    renderWith(item('r2', { type: 'site', name: 'Somewhere' }));

    paste(ROUTES_WITH_TYPE);

    const relation = findItem('r2');
    expect(relation.tags).toEqual({
      type: 'site',
      site: 'climbing',
      climbing: 'crag',
      sport: 'climbing',
      name: 'Somewhere',
    });
    expect(memberTags(relation).map(({ name }) => name)).toEqual([
      'Cat in a Hat',
      'Tarzanweg',
    ]);
  });

  it('turns another node into a crag relation after asking', async () => {
    renderWith(item('n-200', { leisure: 'park', name: 'Boulder park' }));

    paste(ROUTES_WITH_TYPE);
    await clickButton(t('editdialog.members.paste_crag_button'));

    const relation = findItem(context.current);
    expect(relation.shortId).toMatch(/^r-/);
    expect(relation.tags).toMatchObject({
      climbing: 'crag',
      name: 'Boulder park',
    });
    expect(relation.tags.leisure).toBeUndefined();
    expect(memberTags(relation).map(({ climbing }) => climbing)).toEqual([
      'route_bottom',
      'route_bottom',
    ]);
  });

  it('keeps a peak beside the new crag', async () => {
    renderWith(item('n300', { natural: 'peak', name: 'Vrchol' }));

    paste(ROUTES_WITH_TYPE);
    await clickButton(t('editdialog.members.paste_crag_button'));

    expect(findItem('n300').tags).toEqual({ natural: 'peak', name: 'Vrchol' });
    expect(findItem(context.current).tags.climbing).toBe('crag');
  });

  it('keeps the original type when the conversion is cancelled', async () => {
    renderWith(item('n-400', { leisure: 'park' }));

    paste(ROUTES_WITH_TYPE);
    await clickButton(t('editdialog.cancel_button'));

    expect(findItem('n-400').tags).toEqual({ leisure: 'park' });
  });
});
