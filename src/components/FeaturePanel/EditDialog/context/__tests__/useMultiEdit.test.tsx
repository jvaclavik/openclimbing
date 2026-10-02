import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { EditContextProvider, useEditContext } from '../EditContext';
import { addEmptyOriginalState } from '../itemsHelpers';
import { DataItem } from '../types';
import { useMultiEdit } from '../useMultiEdit';

let mockOpened = true;
jest.mock('../../../helpers/EditDialogContext', () => ({
  useEditDialogContext: () => ({ opened: mockOpened }),
}));

const item = (shortId: string, tags: Record<string, string>): DataItem =>
  addEmptyOriginalState({
    shortId,
    version: 1,
    tagsEntries: Object.entries(tags),
    toBeDeleted: false,
    nodeLonLat: [14, 50],
    sections: ['climbing'],
  });

const wrapper: React.FC = ({ children }) => (
  <EditContextProvider>{children}</EditContextProvider>
);

describe('useMultiEdit', () => {
  beforeEach(() => {
    mockOpened = true;
  });

  it('writes a tag onto every selected item', () => {
    const { result } = renderHook(
      () => ({ ctx: useEditContext(), multi: useMultiEdit() }),
      { wrapper },
    );

    act(() => {
      result.current.ctx.addItem(
        item('n1', { climbing: 'route', name: 'Left' }),
      );
      result.current.ctx.addItem(
        item('n2', { climbing: 'route', name: 'Right' }),
      );
    });
    act(() => {
      result.current.ctx.setCurrent('n1');
      result.current.ctx.setSelectedIds(['n1', 'n2']);
    });

    expect(result.current.multi.isMulti).toBe(true);
    expect(result.current.multi.mixed.name).toEqual(['Left', 'Right']);
    expect(result.current.multi.tags['climbing:boulder']).toBeUndefined();

    act(() => {
      result.current.multi.setTag('climbing:boulder', 'yes');
    });

    expect(
      result.current.ctx.items.map((entry) => entry.tags['climbing:boulder']),
    ).toEqual(['yes', 'yes']);
    expect(result.current.ctx.items.every((entry) => entry.modified)).toBe(
      true,
    );
    expect(result.current.multi.tags['climbing:boulder']).toBe('yes');
  });

  it('removes a tag from every selected item', () => {
    const { result } = renderHook(
      () => ({ ctx: useEditContext(), multi: useMultiEdit() }),
      { wrapper },
    );

    act(() => {
      result.current.ctx.addItem(
        item('n1', { climbing: 'route', 'climbing:boulder': 'yes' }),
      );
      result.current.ctx.addItem(
        item('n2', { climbing: 'route', 'climbing:boulder': 'no' }),
      );
    });
    act(() => {
      result.current.ctx.setCurrent('n1');
      result.current.ctx.setSelectedIds(['n1', 'n2']);
    });

    act(() => {
      result.current.multi.removeTag('climbing:boulder');
    });

    expect(
      result.current.ctx.items.map((entry) => entry.tags['climbing:boulder']),
    ).toEqual([undefined, undefined]);
  });
});
