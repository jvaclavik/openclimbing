import React from 'react';
import { act, renderHook } from '@testing-library/react';
import {
  FAVORITES_ID,
  VISITED_ID,
} from '../../../services/my-lists/localFerrataLists';
import { MyListsProvider, useMyListsContext } from '../MyListsContext';

jest.mock('../../../services/osm/consts', () => ({ HAS_USER_DB: false }));
jest.mock('../OsmAuthContext', () => ({}));
jest.mock('../../../services/my-lists/myListsApi', () => ({}));

describe('local Klettersteig lists', () => {
  beforeEach(() => window.localStorage.clear());

  it('saves favorites and custom lists across reloads and preserves removed visits', async () => {
    const wrapper: React.FC = ({ children }) => (
      <MyListsProvider>{children}</MyListsProvider>
    );
    const { result, unmount } = renderHook(useMyListsContext, { wrapper });
    const visited = result.current.lists!.find(({ id }) => id === VISITED_ID)!;
    expect(result.current.visibleListIds).toContain(VISITED_ID);

    const item = visited.items[0];
    let customId = 0;
    await act(async () => {
      customId = await result.current.createList('Alpen', '⛰️');
      await result.current.addToList(customId, item);
      await result.current.addToList(FAVORITES_ID, item);
      await result.current.addToList(FAVORITES_ID, item);
      await result.current.removeFromList(VISITED_ID, item.shortId);
    });
    expect(
      result.current.lists!.find(({ id }) => id === FAVORITES_ID)!.items,
    ).toHaveLength(1);
    unmount();

    const reopened = renderHook(useMyListsContext, { wrapper });
    expect(
      reopened.result.current.listsContaining(item.shortId).map(({ id }) => id),
    ).toEqual([FAVORITES_ID, customId]);
  });
});
