import React, { useEffect, useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { t } from '../../../../services/intl';
import { FeatureTags } from '../../../../services/types';
import { useSnackbar } from '../../../utils/SnackbarContext';
import { useCurrentItem, useEditContext } from '../context/EditContext';
import { EditDataItem, TagsEntries } from '../context/types';
import { allPresets } from '../../../../services/tagging/data';
import { isClimbingRoute } from '../../../../utils';
import { switchPresetTags } from './FeatureEditSection/PresetSelect/switchPreset';
import { getTagBatchDrafts } from './FeatureEditSection/memberDrafts';
import {
  isConvertible,
  useConvertCurrentToRelation,
} from './FeatureEditSection/ConvertNodeToRelation';
import { parseTagBatch } from './FeatureEditSection/parseTagBatch';

// Safari doesn't fire `paste` outside editable elements, so after Cmd/Ctrl+V we
// fall back to the async clipboard API if no paste event arrived by then.
const PASTE_EVENT_WAIT_MS = 100;

const isEditableTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    !!target.closest('input, textarea, select, [contenteditable="true"]'));

// Calls onText with the clipboard text of every Cmd/Ctrl+V that doesn't go into
// a form field.
const usePasteOutsideInputs = (onText: (text: string) => void) => {
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    let fallbackTimeout: ReturnType<typeof setTimeout> | undefined;

    const onPaste = (e: ClipboardEvent) => {
      if (isEditableTarget(e.target)) return;
      clearTimeout(fallbackTimeout);
      fallbackTimeout = undefined;
      onTextRef.current(e.clipboardData?.getData('text/plain') ?? '');
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const isPaste =
        (e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'v';
      if (!isPaste || isEditableTarget(e.target)) return;
      clearTimeout(fallbackTimeout);
      fallbackTimeout = setTimeout(() => {
        fallbackTimeout = undefined;
        navigator.clipboard
          ?.readText()
          .then((text) => onTextRef.current(text))
          .catch(() => {}); // permission denied – nothing to paste
      }, PASTE_EVENT_WAIT_MS);
    };

    document.addEventListener('paste', onPaste);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      clearTimeout(fallbackTimeout);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);
};

const isRouteBlock = (tags: FeatureTags) =>
  isClimbingRoute(tags) ||
  Object.keys(tags).some((key) => key.startsWith('climbing:grade:'));

const isRoutesPaste = (tagBlocks: FeatureTags[]) =>
  tagBlocks.some(isRouteBlock) &&
  tagBlocks.every((tags) => !tags.climbing || isClimbingRoute(tags));

// Routes pasted into something that can't hold them turn it into a crag – the
// same tag swap as picking "Climbing crag" in the type select.
const needsCragType = (item: EditDataItem, tagBlocks: FeatureTags[]) =>
  isRoutesPaste(tagBlocks) &&
  !['crag', 'area'].includes(item.tags.climbing) &&
  !isClimbingRoute(item.tags);

const CRAG_PRESET = allPresets['climbing/crag'];

// Same tags as a relation created by convertToRelation.
const CRAG_RELATION_TAGS = { type: 'site', site: 'climbing' };

// A peak or a cliff line keeps its own tags and only gets climbing=crag, so the
// conversion leaves it standing beside the new crag relation. A relation keeps
// type=site, which the preset swap would drop.
const getCragTagsEntries = (item: EditDataItem): TagsEntries => {
  const keepsOwnType =
    item.shortId.startsWith('w') ||
    (item.shortId.startsWith('n') && item.tags.natural === 'peak');
  if (keepsOwnType) {
    return Object.entries({ ...item.tags, ...CRAG_PRESET.addTags });
  }
  const switched = switchPresetTags(
    item.tagsEntries,
    item.presetKey,
    CRAG_PRESET,
  );
  return item.shortId.startsWith('r')
    ? Object.entries({ ...CRAG_RELATION_TAGS, ...Object.fromEntries(switched) })
    : switched;
};

const useAddPastedMembers = () => {
  const { addItem } = useEditContext();
  const { showToast } = useSnackbar();

  return (
    relation: EditDataItem,
    tagBlocks: FeatureTags[],
    parentTags: FeatureTags = relation.tags,
  ) => {
    const drafts = getTagBatchDrafts(tagBlocks, parentTags);
    drafts.forEach(({ newItem }) => addItem(newItem));
    relation.setMembers((prev) => [
      ...(prev ?? []),
      ...drafts.map(({ newMember }) => newMember),
    ]);
    relation.setSections((prev) =>
      prev.includes('members') ? prev : [...prev, 'members'],
    );
    showToast(
      t('editdialog.members.pasted', { count: drafts.length }),
      'success',
    );
  };
};

type PendingPaste = { tagBlocks: FeatureTags[]; makeCrag: boolean };

type ConvertDialogProps = {
  pending: PendingPaste | null;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConvertDialog = ({
  pending,
  onConfirm,
  onCancel,
}: ConvertDialogProps) => {
  const count = pending?.tagBlocks.length;
  return (
    <Dialog open={!!pending} onClose={onCancel}>
      <DialogTitle>
        {pending?.makeCrag
          ? t('editdialog.members.paste_crag_title')
          : t('editdialog.members.paste_convert_title')}
      </DialogTitle>
      <DialogContent>
        {pending?.makeCrag
          ? t('editdialog.members.paste_crag_description', { count })
          : t('editdialog.members.paste_convert_description', { count })}
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          {t('editdialog.cancel_button')}
        </Button>
        <Button onClick={onConfirm} variant="contained" autoFocus>
          {pending?.makeCrag
            ? t('editdialog.members.paste_crag_button')
            : t('editdialog.members.convert_button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Cmd/Ctrl+V outside form fields adds the clipboard's OSM tag blocks (the
 * batch format: key=value lines, blank line between items) as new members of
 * the current relation. Climbing routes turn a non-climbing item into a crag
 * first, and a node is converted to a relation after asking.
 */
export const ClipboardMembersPaste = () => {
  const currentItem = useCurrentItem();
  const { isSaving } = useEditContext();
  const { showToast } = useSnackbar();
  const convertCurrentToRelation = useConvertCurrentToRelation();
  const addPastedMembers = useAddPastedMembers();

  // paste waiting for the user to confirm the conversion
  const [toConvert, setToConvert] = useState<PendingPaste | null>(null);
  // tag blocks waiting for the converted relation to become the current item
  const [afterConversion, setAfterConversion] = useState<{
    relationId: string;
    tagBlocks: FeatureTags[];
  } | null>(null);

  usePasteOutsideInputs((text) => {
    const tagBlocks = parseTagBatch(text);
    if (!tagBlocks?.length || !currentItem || isSaving || toConvert) return;

    if (isClimbingRoute(currentItem.tags)) {
      showToast(t('editdialog.members.paste_needs_relation'), 'warning');
      return;
    }

    const makeCrag = needsCragType(currentItem, tagBlocks);
    if (currentItem.shortId.startsWith('r')) {
      if (makeCrag) {
        const cragEntries = getCragTagsEntries(currentItem);
        currentItem.setTagsEntries(() => cragEntries);
        addPastedMembers(
          currentItem,
          tagBlocks,
          Object.fromEntries(cragEntries),
        );
      } else {
        addPastedMembers(currentItem, tagBlocks);
      }
    } else if (
      makeCrag ||
      isConvertible(currentItem.shortId, currentItem.tags)
    ) {
      setToConvert({ tagBlocks, makeCrag });
    } else {
      showToast(t('editdialog.members.paste_needs_relation'), 'warning');
    }
  });

  useEffect(() => {
    if (!afterConversion || currentItem?.shortId !== afterConversion.relationId)
      return;
    addPastedMembers(currentItem, afterConversion.tagBlocks);
    setAfterConversion(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afterConversion, currentItem]);

  const handleConfirm = async () => {
    const { tagBlocks, makeCrag } = toConvert;
    const originalEntries = currentItem.tagsEntries;
    setToConvert(null);
    if (makeCrag) {
      // the conversion reads the item from the queued state, so it sees these
      const cragEntries = getCragTagsEntries(currentItem);
      currentItem.setTagsEntries(() => cragEntries);
    }

    const relationId = await convertCurrentToRelation().catch(() => {
      showToast(t('editdialog.members.paste_needs_relation'), 'warning');
      return undefined;
    });
    if (relationId) {
      setAfterConversion({ relationId, tagBlocks });
    } else if (makeCrag) {
      currentItem.setTagsEntries(() => originalEntries);
    }
  };

  return (
    <ConvertDialog
      pending={toConvert}
      onConfirm={handleConfirm}
      onCancel={() => setToConvert(null)}
    />
  );
};
