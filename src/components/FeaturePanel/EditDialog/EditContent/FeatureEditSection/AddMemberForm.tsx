import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import LinkIcon from '@mui/icons-material/Link';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  Button,
  IconButton,
  ListItemIcon,
  MenuItem,
  Stack,
  TextareaAutosize,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useRef, useState } from 'react';
import { getApiId } from '../../../../../services/helpers';
import { t } from '../../../../../services/intl';
import { GRADE_TABLE } from '../../../../../services/tagging/climbing/gradeData';
import { getOsmTagFromGradeSystem } from '../../../../../services/tagging/climbing/routeGrade';
import { getPresetTranslation } from '../../../../../services/tagging/translations';
import { FeatureTags } from '../../../../../services/types';
import { Setter } from '../../../../../types';
import { useSnackbar } from '../../../../utils/SnackbarContext';
import { useUserSettingsContext } from '../../../../utils/userSettings/UserSettingsContext';
import { GradeSystemSelect } from '../../../Climbing/GradeSystemSelect';
import { useMoreMenu } from '../../../Climbing/useMoreMenu';
import { useCurrentItem, useEditContext } from '../../context/EditContext';
import { fetchFreshItem, getNewNodeItem } from '../../context/itemsHelpers';
import { DataItem, Members } from '../../context/types';
import { findInItems, getPresetKey } from '../../context/utils';
import { NearbyClimbingAutocomplete } from './NearbyClimbingAutocomplete';
import { parseOsmShortId } from './parseOsmShortId';
import { parseTagBatch } from './parseTagBatch';
import { useLinkEditItem } from './useLinkEditItem';

export type Scene = null | 'single' | 'batch' | 'url';

const ROUTE_BOTTOM_TAGS = {
  climbing: 'route_bottom',
  sport: 'climbing',
};

const CRAG_TAGS = {
  climbing: 'crag',
  sport: 'climbing',
};

const getMemberTags = (parentTags: FeatureTags) => {
  if (parentTags.climbing === 'crag') {
    return ROUTE_BOTTOM_TAGS;
  }
  if (parentTags.climbing === 'area') {
    return CRAG_TAGS;
  }
  return {};
};

const parseGradeFromLine = (line: string, gradeSystem?: string) => {
  if (!gradeSystem) {
    return { gradeTags: {}, name: line };
  }

  const grades = GRADE_TABLE[gradeSystem];
  const words = line.split(' ');
  const lastWord = words[words.length - 1];
  if (grades.includes(lastWord)) {
    return {
      gradeTags: {
        [getOsmTagFromGradeSystem(gradeSystem)]: lastWord,
      },
      name: line.substring(0, line.length - lastWord.length - 1),
    };
  }

  return { gradeTags: {}, name: line };
};

const applyMissingTags = (tags: FeatureTags, defaults: FeatureTags) => {
  const merged = { ...tags };
  for (const [key, value] of Object.entries(defaults)) {
    if (!(key in merged)) merged[key] = value;
  }
  return merged;
};

const toMemberDraft = (newItem: DataItem) => {
  // TODO this code could be removed, if we lookup the label in render among editItems
  const presetKey = getPresetKey(newItem);
  const presetLabel = getPresetTranslation(presetKey);
  const tags = Object.fromEntries(newItem.tagsEntries);
  return {
    newItem,
    newMember: {
      shortId: newItem.shortId,
      role: '',
      originalLabel: tags.name ?? presetLabel,
      originalTags: tags,
    },
  };
};

const convertLine = async (
  line: string,
  parentTags: FeatureTags,
  gradeSystem: string | undefined,
) => {
  const shortId = parseOsmShortId(line);
  if (shortId) {
    return toMemberDraft(await fetchFreshItem(getApiId(shortId)));
  }

  const { gradeTags, name } = parseGradeFromLine(line, gradeSystem);
  return toMemberDraft(
    getNewNodeItem(undefined, {
      name,
      ...getMemberTags(parentTags),
      ...gradeTags,
    }),
  );
};

const useGetGradeSystemOrUndefined = (scene: string) => {
  const relation = useCurrentItem();
  const { gradeSystem } = useUserSettingsContext();
  if (scene === 'batch' && relation.tags.climbing === 'crag') {
    return gradeSystem;
  }
  return undefined;
};

const useHandleAddMember = (
  scene: string,
  setScene: Setter<Scene>,
  label: string,
  setLabel: Setter<string>,
) => {
  const { addItem, items, setCurrent } = useEditContext();
  const relation = useCurrentItem();
  const gradeSystem = useGetGradeSystemOrUndefined(scene);

  return async (e: {
    preventDefault: () => void;
    ctrlKey?: boolean;
    metaKey?: boolean;
  }) => {
    const tagRoutes = parseTagBatch(label);
    const lines = label
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    const drafts = tagRoutes
      ? tagRoutes.map((routeTags) =>
          toMemberDraft(
            getNewNodeItem(
              undefined,
              applyMissingTags(routeTags, getMemberTags(relation.tags)),
            ),
          ),
        )
      : lines.length
        ? await Promise.all(
            lines.map((line) => convertLine(line, relation.tags, gradeSystem)),
          )
        : scene === 'single'
          ? [
              toMemberDraft(
                getNewNodeItem(undefined, getMemberTags(relation.tags)),
              ),
            ]
          : [];

    const newMembers: Members = [];
    for (const { newItem, newMember } of drafts) {
      if (
        relation.members?.some((member) => member.shortId === newMember.shortId)
      ) {
        continue;
      }
      if (!findInItems(items, newMember.shortId)) {
        addItem(newItem);
      }
      newMembers.push(newMember);
    }

    relation.setMembers((prev) => [...(prev ?? []), ...newMembers]);
    setScene(null);
    setLabel('');

    if (newMembers.length && (e.ctrlKey || e.metaKey)) {
      setCurrent(newMembers[0].shortId);
    }
  };
};

const StyledFormatListBulletedIcon = styled(FormatListBulletedIcon)`
  font-size: 16px;
`;
export const BatchButton = ({ onClick }: { onClick: () => void }) => (
  <div>
    <Tooltip title={t('editdialog.members.add_multiple')}>
      <IconButton onClick={onClick}>
        <StyledFormatListBulletedIcon />
      </IconButton>
    </Tooltip>
  </div>
);

const StyledCloseIcon = styled(CloseIcon)`
  font-size: 16px;
`;
export const CancelButton = (props: {
  setLabel: Setter<string>;
  setScene: Setter<Scene>;
}) => (
  <div>
    <IconButton
      onClick={() => {
        props.setLabel('');
        props.setScene(null);
      }}
    >
      <StyledCloseIcon />
    </IconButton>
  </div>
);

const ShowFormButton = (props: { onClick: () => void }) => {
  const relation = useCurrentItem();
  const isClimbingCrag = relation.tags.climbing === 'crag';
  return (
    <Button startIcon={<AddIcon />} onClick={props.onClick} variant="text">
      {isClimbingCrag
        ? t('editdialog.members.add_climbing_route')
        : t('editdialog.members.add_member')}
    </Button>
  );
};

const AddMemberMoreMenu = ({ onAddFromUrl }: { onAddFromUrl: () => void }) => {
  const { MoreMenu, handleClickMore, handleCloseMore } = useMoreMenu();

  return (
    <>
      <IconButton size="small" color="secondary" onClick={handleClickMore}>
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <MoreMenu>
        <MenuItem
          onClick={(e) => {
            handleCloseMore(e);
            onAddFromUrl();
          }}
        >
          <ListItemIcon>
            <LinkIcon
              sx={{
                fontSize: 'small',
              }}
            />
          </ListItemIcon>
          {t('editdialog.members.add_from_url')}
        </MenuItem>
      </MoreMenu>
    </>
  );
};

const UrlInput = (props: { label: string; setLabel: Setter<string> }) => (
  <TextField
    value={props.label}
    size="small"
    label={t('editdialog.members.add_from_url')}
    placeholder={t('editdialog.members.url_placeholder')}
    onChange={(e) => {
      props.setLabel(e.target.value);
    }}
    autoFocus
    sx={{ minWidth: 220, flex: 1 }}
  />
);

const ConfirmButton = (props: { onClick: (e) => Promise<void> }) => (
  <Button onClick={props.onClick} variant="text">
    {t('editdialog.members.confirm')}
  </Button>
);

const MemberNameInput = (props: {
  label: string;
  setLabel: Setter<string>;
  onSelectExisting: (shortId: string) => Promise<void>;
  onCreateNew: (e: { preventDefault: () => void }) => void;
}) => {
  const relation = useCurrentItem();
  if (relation.tags.climbing !== 'area') {
    return (
      <TextField
        value={props.label}
        size="small"
        label={t('editdialog.members.name')}
        onChange={(e) => {
          props.setLabel(e.target.value);
        }}
        autoFocus
      />
    );
  }

  return (
    <NearbyClimbingAutocomplete
      nearbyType="crag"
      label={props.label}
      setLabel={props.setLabel}
      onSelectExisting={props.onSelectExisting}
      onCreateNew={props.onCreateNew}
    />
  );
};

const useKeyboardShortcuts = (
  handleAddMember: (e) => Promise<void>,
  scene: Scene,
  setScene: Setter<Scene>,
  skipEnter: boolean,
) => {
  useEffect(() => {
    const downHandler = (e) => {
      if (scene !== 'single' && scene !== 'url') {
        return;
      }

      if (e.key === 'Enter') {
        if (skipEnter) return;
        handleAddMember(e);
      }

      if (e.key === 'Escape') {
        setScene(null);
      }
    };

    window.addEventListener('keydown', downHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
    };
  }, [handleAddMember, setScene, scene, skipEnter]);
};

const BatchPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-width: 280px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  background-color: ${({ theme }) => theme.palette.action.hover};
`;

const StyledTextareaAutosize = styled(TextareaAutosize)`
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  resize: vertical;
  border: 1px solid ${({ theme }) => theme.palette.divider};
  background-color: ${({ theme }) => theme.palette.background.paper};
  color: ${({ theme }) => theme.palette.text.primary};
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.5;
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.palette.text.disabled};
  }

  &:focus {
    border-color: ${({ theme }) => theme.palette.primary.main};
  }
`;

const BatchTextarea = (props: {
  label: string;
  setLabel: Setter<string>;
  gradeSystem: string | undefined;
}) => {
  const { gradeSystem } = props;
  const grade = gradeSystem ? GRADE_TABLE[gradeSystem][24] : undefined;
  const placeholder = grade
    ? `Cat in a Hat ${grade}

climbing=route_bottom
name=Tarzanweg
${getOsmTagFromGradeSystem(gradeSystem)}=${grade}
climbing:length=14m
climbing:sport=yes`
    : 'name\n...';

  return (
    <Stack spacing={0.75} sx={{ width: '100%' }}>
      <StyledTextareaAutosize
        minRows={8}
        value={props.label}
        placeholder={placeholder}
        onChange={(e) => props.setLabel(e.target.value)}
      />
      <Typography variant="caption" color="text.secondary">
        {t('editdialog.members.batch_tags_hint')}
      </Typography>
    </Stack>
  );
};

export const AddMemberForm = () => {
  const [scene, setScene] = useState<Scene>();
  const [label, setLabel] = useState('');
  const handleAddMember = useHandleAddMember(scene, setScene, label, setLabel);
  const { addAsMember } = useLinkEditItem();
  const { showToast } = useSnackbar();
  const relation = useCurrentItem();
  const gradeSystem = useGetGradeSystemOrUndefined(scene ?? '');
  const skipEnter = scene === 'single' && relation.tags.climbing === 'area';
  const batchPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scene !== 'batch') return undefined;
    const panel = batchPanelRef.current;
    if (!panel) return undefined;

    const scroller = panel.closest('.MuiDialogContent-root');
    const revealFooter = () => {
      if (!(scroller instanceof HTMLElement)) return;
      const overflow =
        panel.getBoundingClientRect().bottom -
        scroller.getBoundingClientRect().bottom;
      if (overflow > 1) scroller.scrollTop += overflow + 8;
    };

    revealFooter();
    panel.querySelector('textarea')?.focus({ preventScroll: true });
    const observer = new ResizeObserver(revealFooter);
    observer.observe(panel);
    const stop = window.setTimeout(() => observer.disconnect(), 1000);
    return () => {
      observer.disconnect();
      window.clearTimeout(stop);
    };
  }, [scene]);

  const handleAddFromUrl = async (e: React.MouseEvent) => {
    e.preventDefault();
    const shortId = parseOsmShortId(label);
    if (!shortId) {
      showToast(t('editdialog.members.url_invalid'), 'warning');
      return;
    }
    try {
      await addAsMember(shortId);
      setScene(null);
      setLabel('');
    } catch {
      showToast(t('editdialog.members.url_invalid'), 'warning');
    }
  };

  const handleSelectExisting = async (shortId: string) => {
    await addAsMember(shortId);
    setScene(null);
    setLabel('');
  };

  useKeyboardShortcuts(
    scene === 'url' ? handleAddFromUrl : handleAddMember,
    scene,
    setScene,
    skipEnter,
  );

  return (
    <>
      {scene === 'single' ? (
        <>
          <MemberNameInput
            label={label}
            setLabel={setLabel}
            onSelectExisting={handleSelectExisting}
            onCreateNew={handleAddMember}
          />
          <ConfirmButton onClick={handleAddMember} />
          <BatchButton onClick={() => setScene('batch')} />
          <AddMemberMoreMenu onAddFromUrl={() => setScene('url')} />
        </>
      ) : scene === 'batch' ? (
        <BatchPanel ref={batchPanelRef}>
          <BatchTextarea
            label={label}
            setLabel={setLabel}
            gradeSystem={gradeSystem}
          />
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            {gradeSystem ? (
              <GradeSystemSelect orderByFeature showDefaultOnButton />
            ) : (
              <span />
            )}
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: 'center', ml: 'auto' }}
            >
              <Button
                variant="text"
                color="inherit"
                onClick={() => {
                  setLabel('');
                  setScene(null);
                }}
              >
                {t('editdialog.cancel_button')}
              </Button>
              <Button
                variant="contained"
                disableElevation
                onClick={handleAddMember}
              >
                {t('editdialog.members.confirm')}
              </Button>
            </Stack>
          </Stack>
        </BatchPanel>
      ) : scene === 'url' ? (
        <>
          <UrlInput label={label} setLabel={setLabel} />
          <ConfirmButton onClick={handleAddFromUrl} />
          <CancelButton setLabel={setLabel} setScene={setScene} />
        </>
      ) : (
        <ShowFormButton onClick={() => setScene('single')} />
      )}
    </>
  );
};
