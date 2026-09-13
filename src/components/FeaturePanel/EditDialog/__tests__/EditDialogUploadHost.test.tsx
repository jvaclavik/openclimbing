import React from 'react';
import { act, render } from '@testing-library/react';
import { EditDialogUploadHost } from '../EditDialogUploadHost';
import { useEditDialogUploadContext } from '../EditDialogUploadContext';
import { useCurrentItem } from '../context/EditContext';

jest.mock('../EditDialogUploadContext', () => ({
  useEditDialogUploadContext: jest.fn(),
}));

jest.mock('../context/EditContext', () => ({
  useCurrentItem: jest.fn(),
}));

const uploadDialogPropsHistory: Array<{
  onUploaded: (fileTagValue: string) => void;
}> = [];

jest.mock(
  '../EditContent/FeatureEditSection/UploadPhotoDialog/UploadPhotoDialog',
  () => ({
    UploadPhotoDialog: (props: {
      onUploaded: (fileTagValue: string) => void;
    }) => {
      uploadDialogPropsHistory.push(props);
      return null;
    },
  }),
);

const useUploadContextMock = useEditDialogUploadContext as jest.Mock;
const useCurrentItemMock = useCurrentItem as jest.Mock;

describe('EditDialogUploadHost', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uploadDialogPropsHistory.length = 0;
  });

  it('allocates slots from current tags state so stale callbacks do not overwrite', () => {
    let uploadRequest = {
      initialFiles: [] as File[],
      targetSlotKey: 'wikimedia_commons',
    };
    useUploadContextMock.mockImplementation(() => ({
      uploadRequest,
      closeUpload: jest.fn(),
    }));

    let tagsEntries: [string, string][] = [['wikimedia_commons', '']];
    const currentItem = {
      tags: Object.fromEntries(tagsEntries),
      setTagsEntries: jest.fn(
        (updateFn: (prev: [string, string][]) => [string, string][]) => {
          tagsEntries = updateFn(tagsEntries);
          currentItem.tags = Object.fromEntries(tagsEntries);
        },
      ),
    };
    useCurrentItemMock.mockReturnValue(currentItem);

    let activeMajorKeys: string[] = [];
    const setActiveMajorKeys = jest.fn(
      (update: React.SetStateAction<string[]>) => {
        activeMajorKeys =
          typeof update === 'function' ? update(activeMajorKeys) : update;
      },
    );

    const { rerender } = render(
      <EditDialogUploadHost
        activeMajorKeys={activeMajorKeys}
        setActiveMajorKeys={setActiveMajorKeys}
      />,
    );

    const staleOnUploaded =
      uploadDialogPropsHistory[uploadDialogPropsHistory.length - 1].onUploaded;

    uploadRequest = {
      initialFiles: [new File(['x'], 'new.jpg', { type: 'image/jpeg' })],
      targetSlotKey: 'wikimedia_commons',
    };
    rerender(
      <EditDialogUploadHost
        activeMajorKeys={activeMajorKeys}
        setActiveMajorKeys={setActiveMajorKeys}
      />,
    );
    const freshOnUploaded =
      uploadDialogPropsHistory[uploadDialogPropsHistory.length - 1].onUploaded;

    act(() => {
      freshOnUploaded('File:new.jpg');
      staleOnUploaded('File:old.jpg');
    });

    expect(currentItem.tags.wikimedia_commons).toBe('File:new.jpg');
    expect(currentItem.tags['wikimedia_commons:2']).toBe('File:old.jpg');
    expect(activeMajorKeys).toEqual([
      'wikimedia_commons',
      'wikimedia_commons:2',
    ]);
  });
});
