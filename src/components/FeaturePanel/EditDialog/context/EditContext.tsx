import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { SuccessInfo } from '../../../../services/types';
import { useEditItems } from './useEditItems';
import { Setter } from '../../../../types';
import { DataItem, EditDataItem, Section } from './types';
import { useEditDialogContext } from '../../helpers/EditDialogContext';

type ShortId = string;

type EditContextType = {
  successInfo: undefined | SuccessInfo;
  setSuccessInfo: Setter<undefined | SuccessInfo>;
  isSaving: boolean;
  setIsSaving: Setter<boolean>;
  location: string;
  setLocation: Setter<string>;
  comment: string;
  setComment: Setter<string>;
  addItem: (newItem: DataItem) => void;
  removeItem: (shortId: string) => void;
  items: EditDataItem[];
  current: string;
  setCurrent: Setter<string>;
  // Multi-selection of items (shortIds), e.g. several routes selected in the
  // tablist / map to be dragged together. `current` is always one of them.
  selectedIds: string[];
  setSelectedIds: Setter<string[]>;
  validate: boolean;
  setValidate: Setter<boolean>;
  // shortId of the crag whose routes are currently shown on the edit map; kept
  // sticky so the routes/markers stay visible when switching to an unrelated
  // item (a peak, cliff, …) within the same dialog session.
  activeCragId: string;
  setActiveCragId: Setter<string>;
};

const EditContext = createContext<EditContextType>(undefined);

export const EditContextProvider: React.FC = ({ children }) => {
  const { opened } = useEditDialogContext();
  const [successInfo, setSuccessInfo] = useState<undefined | SuccessInfo>();
  const [isSaving, setIsSaving] = useState(false);
  const [location, setLocation] = useState(''); // only for note
  const [comment, setComment] = useState('');
  const [validate, setValidate] = useState(false);
  const { items, addItem, removeItem, reset: resetItems } = useEditItems();
  const [current, setCurrent] = useState<ShortId>(''); // to get currentItem - use `useCurrentItem()`
  const [selectedIds, setSelectedIds] = useState<ShortId[]>([]);
  const [activeCragId, setActiveCragId] = useState<ShortId>('');

  // Keep the multi-selection in sync with `current`. Multi-select actions set
  // `current` to a member of the selection, so this only fires when `current`
  // changes through other means (opening a tab, map popup, initial load),
  // collapsing any stale multi-selection down to the single active item.
  useEffect(() => {
    if (!current) return;
    setSelectedIds((prev) => (prev.includes(current) ? prev : [current]));
  }, [current]);

  // Discard the whole edit session so the next time the dialog opens it starts
  // from freshly fetched data instead of the previous (e.g. cancelled) changes.
  const reset = useCallback(() => {
    resetItems();
    setCurrent('');
    setSelectedIds([]);
    setActiveCragId('');
    setLocation('');
    setComment('');
    setSuccessInfo(undefined);
    setValidate(false);
    setIsSaving(false);
  }, [resetItems]);

  // Reset only on the open -> closed transition (cancel, escape, backdrop, X,
  // success). While closed the in-memory edits are dropped, matching the
  // "Your changes are not saved" warning shown on cancel.
  const wasOpenedRef = useRef(opened);
  useEffect(() => {
    if (wasOpenedRef.current && !opened) {
      reset();
    }
    wasOpenedRef.current = opened;
  }, [opened, reset]);

  const value: EditContextType = {
    successInfo,
    setSuccessInfo,
    isSaving,
    setIsSaving,
    location,
    setLocation,
    comment,
    setComment,
    addItem,
    removeItem,
    items,
    current,
    setCurrent,
    selectedIds,
    setSelectedIds,
    validate,
    setValidate,
    activeCragId,
    setActiveCragId,
  };

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
};

export const useEditContext = () => useContext(EditContext);

export const useCurrentItem = (): EditDataItem => {
  const { items, current } = useEditContext();

  return items.find((item) => item.shortId === current);
};

const isInSections = (sections: Section[], current: Section) =>
  sections.some((section) => section === current);

export const useExpandedSections = (current: Section) => {
  const { sections, setSections } = useCurrentItem();

  return {
    expanded: isInSections(sections, current),
    toggleExpanded: () => {
      setSections((prev) =>
        isInSections(prev, current)
          ? prev.filter((section) => section !== current)
          : [...prev, current],
      );
    },
    expand: () => {
      setSections((prev) =>
        isInSections(prev, current) ? prev : [...prev, current],
      );
    },
  };
};
