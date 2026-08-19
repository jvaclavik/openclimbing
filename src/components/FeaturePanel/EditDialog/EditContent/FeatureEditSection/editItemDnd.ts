import React from 'react';

export const EDIT_TAB_DND = 'text/x-openclimbing-edit-tab';
const TEXT_PREFIX = 'oc-tab:';

export const setEditTabDragData = (
  dataTransfer: DataTransfer,
  shortId: string,
) => {
  dataTransfer.effectAllowed = 'copy';
  dataTransfer.setData(EDIT_TAB_DND, shortId);
  dataTransfer.setData('text/plain', `${TEXT_PREFIX}${shortId}`);
};

export const getEditTabDragShortId = (dataTransfer: DataTransfer) => {
  const fromMime = dataTransfer.getData(EDIT_TAB_DND);
  if (fromMime) return fromMime;
  const text = dataTransfer.getData('text/plain');
  if (text.startsWith(TEXT_PREFIX)) return text.slice(TEXT_PREFIX.length);
  return null;
};

export const isEditTabDrag = (e: React.DragEvent) =>
  e.dataTransfer.types.includes(EDIT_TAB_DND);
