import { LonLat } from '../../../../services/types';
import { getApiId } from '../../../../services/helpers';
import { Setter } from '../../../../types';
import { useCallback, useMemo, useRef, useState } from 'react';
import { publishDbgObject } from '../../../../utils';
import { getPresetTranslation } from '../../../../services/tagging/translations';
import isEqual from 'lodash/isEqual';
import {
  DataItem,
  EditDataItem,
  Members,
  SetMembers,
  SetSections,
  SetShortId,
  SetTagsEntries,
} from './types';
import { convertToRelationFactory } from './convertToRelationFactory';
import { getPresetKey } from './utils';

type SetDataItem = (updateFn: (prevValue: DataItem) => DataItem) => void;
const setDataItemFactory =
  (setData: Setter<DataItem[]>, shortId: string): SetDataItem =>
  (updateFn) => {
    setData((prev) => {
      return prev.map((item) =>
        item.shortId === shortId ? updateFn(item) : item,
      );
    });
  };

const setTagsEntriesFactory =
  (setDataItem: SetDataItem): SetTagsEntries =>
  (updateFn) =>
    setDataItem((prev) => ({
      ...prev,
      tagsEntries: updateFn(prev.tagsEntries),
    }));

const setShortIdFactory =
  (setDataItem: SetDataItem): SetShortId =>
  (shortId) =>
    setDataItem((prev) => ({
      ...prev,
      shortId: shortId,
    }));

const setMembersFactory =
  (setDataItem: SetDataItem, members: Members): SetMembers =>
  (updateFn) =>
    setDataItem((prev) => ({
      ...prev,
      members: updateFn(members),
    }));

type SetNodeLonLat = (lonLat: LonLat) => void;
const setNodeLonLatFactory =
  (setDataItem: SetDataItem): SetNodeLonLat =>
  (lonLat) =>
    setDataItem((prev) => ({
      ...prev,
      nodeLonLat: lonLat,
    }));

type SetTag = (k: string, v: string) => void;
const setTagFactory =
  (setTagsEntries: SetTagsEntries): SetTag =>
  (k, v) => {
    setTagsEntries((prev) => {
      const position = prev.findIndex(([key]) => key === k);
      return position === -1
        ? [...prev, [k, v]]
        : prev.map((entry, index) => (index === position ? [k, v] : entry));
    });
  };

const toggleToBeDeletedFactory = (setDataItem: SetDataItem) => {
  return () =>
    setDataItem((prev) => ({
      ...prev,
      toBeDeleted: !prev.toBeDeleted,
    }));
};

const setSectionsFactory =
  (setDataItem: SetDataItem): SetSections =>
  (updateFn) =>
    setDataItem((prev) => ({
      ...prev,
      sections: updateFn(prev.sections),
    }));

const revertChangesFactory = (setDataItem: SetDataItem) => () =>
  setDataItem((prev) => {
    const orig = prev.originalState;
    return {
      ...prev,
      tagsEntries: Object.entries(orig.tags),
      toBeDeleted: orig.isDeleted,
      nodeLonLat: orig.nodeLonLat,
      nodes: orig.nodes,
      members: orig.members,
    };
  });

const getModifiedFlag = (dataItem: DataItem): boolean => {
  if (dataItem.shortId.includes('-')) {
    return true;
  }

  const { tagsEntries, toBeDeleted, nodeLonLat, nodes, members } = dataItem;
  const orig = dataItem.originalState;
  return (
    !isEqual(
      tagsEntries.filter(([k, v]) => k && v),
      Object.entries(orig.tags),
    ) ||
    !isEqual(nodeLonLat, orig.nodeLonLat) ||
    !isEqual(nodes, orig.nodes) ||
    !isEqual(members, orig.members) ||
    toBeDeleted !== orig.isDeleted
  );
};

export const useEditItems = () => {
  const [data, setDataState] = useState<DataItem[]>([]);
  const generationRef = useRef(0);
  const generation = generationRef.current;
  const setData = useCallback<Setter<DataItem[]>>(
    (update) => {
      if (generation !== generationRef.current) return;
      setDataState((prev) => {
        if (generation !== generationRef.current) return prev;
        return typeof update === 'function' ? update(prev) : update;
      });
    },
    [generation],
  );

  const items = useMemo<EditDataItem[]>(
    () =>
      data.map((dataItem) => {
        const { shortId, tagsEntries, members } = dataItem;
        const setDataItem = setDataItemFactory(setData, shortId);
        const setTagsEntries = setTagsEntriesFactory(setDataItem);
        const presetKey = getPresetKey(dataItem);
        return {
          ...dataItem,
          setTagsEntries,
          setShortId: setShortIdFactory(setDataItem),
          tags: Object.fromEntries(tagsEntries),
          setTag: setTagFactory(setTagsEntries),
          toggleToBeDeleted: toggleToBeDeletedFactory(setDataItem),
          setMembers: setMembersFactory(setDataItem, members),
          setNodeLonLat: setNodeLonLatFactory(setDataItem),
          presetKey,
          presetLabel: getPresetTranslation(presetKey),
          convertToRelation: convertToRelationFactory(setData, shortId),
          modified: getModifiedFlag(dataItem),
          revertChanges: revertChangesFactory(setDataItem),
          setSections: setSectionsFactory(setDataItem),
        };
        // TODO maybe keep reference to original EditDataItem if DataItem didnt change? #performance
      }),
    [data, setData],
  );

  const addItem = useCallback((newItem: DataItem) => {
    setDataState((state) => [...state, newItem]);
  }, []);

  const removeItem = useCallback((shortId: string) => {
    if (getApiId(shortId).id > 0) {
      throw new Error('Existing item should not be removed from items.');
    }
    setDataState((state) => state.filter((item) => item.shortId !== shortId));
  }, []);

  const reset = useCallback(() => {
    generationRef.current += 1;
    setDataState([]);
  }, []);

  publishDbgObject('EditContext state', data);

  return { items, addItem, removeItem, reset };
};
