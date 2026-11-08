import React, { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Stack,
  Typography,
} from '@mui/material';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { t } from '../../../services/intl';
import { Title } from '../../FeaturePanel/Climbing/PanelLabel';
import { useOsmAuthContext } from '../../utils/OsmAuthContext';
import { useTicksContext } from '../../utils/TicksContext';
import { useSnackbar } from '../../utils/SnackbarContext';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';
import { EditTickButton } from '../../FeaturePanel/Climbing/EditTickButton';
import {
  buildTickCopy,
  CopyStyleOption,
  MentionedClimbingTick,
} from '../../../services/my-ticks/tickMentions';
import { FetchedClimbingTick } from '../../../services/my-ticks/getMyTicks';
import { mapFeaturesDataToTicks } from '../mapMyTicksRows';
import { TickSession, toSessions } from '../MyTicksContent';
import { TickColumn, TickSessionCard } from '../TickSessionCard';
import { MyTicksDayHeader } from '../MyTicksDayHeader';
import { TickSelection, useTickSelection } from '../useTickSelection';
import { useMentionedTicksState } from './useMentionedTicks';
import { MentionedTickRow } from './MentionedTickRow';
import { CopyMentionedTicksDialog } from './CopyMentionedTicksDialog';

const byTimestampDesc = (a: FetchedClimbingTick, b: FetchedClimbingTick) =>
  b.tick.timestamp.localeCompare(a.tick.timestamp);

const groupState = (ids: number[], selectedIds: ReadonlySet<number>) => {
  const count = ids.filter((id) => selectedIds.has(id)).length;
  return {
    checked: ids.length > 0 && count === ids.length,
    indeterminate: count > 0 && count < ids.length,
  };
};

const useAddMentionedTicks = () => {
  const { osmUser } = useOsmAuthContext();
  const { bulkAddTicks, setEditedTickId } = useTicksContext();
  const { showToast } = useSnackbar();

  return async (
    sources: MentionedClimbingTick[],
    styleOption?: CopyStyleOption,
  ) => {
    try {
      const ids = await bulkAddTicks(
        sources.map((source) => buildTickCopy(source, osmUser, styleOption)),
      );
      if (ids.length === 1) {
        showToast(
          t('tick.added_toast'),
          'success',
          <EditTickButton onClick={() => setEditedTickId(ids[0])} />,
        );
      } else {
        showToast(
          t('my_ticks.mentions.added_many_toast', {
            count: String(ids.length),
          }),
          'success',
        );
      }
    } catch (e) {
      showToast(`${t('error')}: ${e}`, 'error');
      throw e;
    }
  };
};

const MentionsToolbar = ({
  selection,
  selectedCount,
  selectableIds,
  onCopySelected,
}: {
  selection: TickSelection;
  selectedCount: number;
  selectableIds: number[];
  onCopySelected: () => void;
}) => {
  const canSelect = selectableIds.length > 0;
  const allState = groupState(selectableIds, selection.selectedIds);
  if (!canSelect) return null;
  if (!selection.active) {
    return (
      <Button size="small" color="secondary" onClick={selection.start}>
        {t('my_ticks.select.start')}
      </Button>
    );
  }
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
      <Checkbox
        size="small"
        checked={allState.checked}
        indeterminate={allState.indeterminate}
        onChange={() => selection.setMany(selectableIds, !allState.checked)}
        slotProps={{ input: { 'aria-label': t('my_ticks.select.select_all') } }}
      />
      <Typography
        variant="body2"
        sx={{ color: 'text.secondary', whiteSpace: 'nowrap' }}
      >
        {t('my_ticks.select.selected_count', { count: String(selectedCount) })}
      </Typography>
      <Button
        size="small"
        variant="outlined"
        startIcon={<PlaylistAddIcon />}
        disabled={selectedCount === 0}
        onClick={onCopySelected}
      >
        {t('my_ticks.mentions.add_selected')}
      </Button>
      <Button size="small" color="secondary" onClick={selection.stop}>
        {t('my_ticks.select.cancel')}
      </Button>
    </Stack>
  );
};

type MentionsTableProps = {
  rows: FetchedClimbingTick[];
  selection: TickSelection;
  selectableIds: number[];
  alreadyLoggedIds: ReadonlySet<number>;
  ownerById: Map<number, MentionedClimbingTick>;
  addingIds: ReadonlySet<number>;
  onAdd: (source: MentionedClimbingTick) => void;
};

const MentionsTable = ({
  rows,
  selection,
  selectableIds,
  alreadyLoggedIds,
  ownerById,
  addingIds,
  onAdd,
}: MentionsTableProps) => {
  const selecting = selection.active;
  const sessions = useMemo(() => toSessions(rows, true), [rows]);
  const columns: TickColumn[] = selecting
    ? ['checkbox', 'name', 'grade', 'style']
    : ['name', 'grade', 'style', 'add'];

  const renderHeader = (session: TickSession) => {
    const dayIds = session.rows
      .map((row) => row.tick.id)
      .filter((id) => !alreadyLoggedIds.has(id));
    const dayState = groupState(dayIds, selection.selectedIds);
    return (
      <MyTicksDayHeader
        sessionDate={session.day}
        sessionTicks={session.rows}
        showShareAction={false}
        selection={
          selecting && dayIds.length > 0
            ? {
                ...dayState,
                onToggle: () => selection.setMany(dayIds, !dayState.checked),
              }
            : undefined
        }
      />
    );
  };

  return (
    <Stack spacing={2.5}>
      {sessions.map((session) => (
        <TickSessionCard
          key={session.day}
          header={renderHeader(session)}
          columns={columns}
        >
          {session.rows.map((row) => {
            const source = ownerById.get(row.tick.id);
            return (
              <MentionedTickRow
                key={row.tick.id}
                row={row}
                ownerDisplayName={source?.ownerDisplayName ?? null}
                alreadyLogged={alreadyLoggedIds.has(row.tick.id)}
                adding={addingIds.has(row.tick.id)}
                onAdd={() => onAdd(source)}
                selection={
                  selecting
                    ? {
                        selected: selection.selectedIds.has(row.tick.id),
                        onClick: (modifiers) =>
                          selection.click(
                            row.tick.id,
                            modifiers,
                            selectableIds,
                          ),
                      }
                    : undefined
                }
              />
            );
          })}
        </TickSessionCard>
      ))}
    </Stack>
  );
};

export const MentionedTicksTab = () => {
  const { gradeSystem } = useUserSettingsContext();
  const { mentionedTicks, alreadyLoggedIds, isLoading, error } =
    useMentionedTicksState(true);
  const selection = useTickSelection();
  const addMentionedTicks = useAddMentionedTicks();
  const [hideLogged, setHideLogged] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addingIds, setAddingIds] = useState<ReadonlySet<number>>(new Set());

  const rows = useMemo(
    () =>
      mapFeaturesDataToTicks(mentionedTicks, [], gradeSystem)
        .filter((row) => !hideLogged || !alreadyLoggedIds.has(row.tick.id))
        .sort(byTimestampDesc),
    [mentionedTicks, gradeSystem, hideLogged, alreadyLoggedIds],
  );
  const ownerById = useMemo(
    () => new Map(mentionedTicks.map((tick) => [tick.id, tick])),
    [mentionedTicks],
  );

  const selectableIds = rows
    .map((row) => row.tick.id)
    .filter((id) => !alreadyLoggedIds.has(id));
  const selectedTicks = selection.active
    ? selectableIds
        .filter((id) => selection.selectedIds.has(id))
        .map((id) => ownerById.get(id))
    : [];

  const addOne = async (source: MentionedClimbingTick) => {
    setAddingIds((prev) => new Set(prev).add(source.id));
    try {
      await addMentionedTicks([source]);
    } catch {
      // toast already shown
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(source.id);
        return next;
      });
    }
  };

  const addSelected = async (styleOption: CopyStyleOption) => {
    try {
      await addMentionedTicks(selectedTicks, styleOption);
      setDialogOpen(false);
      selection.stop();
    } catch {
      // toast already shown, keep dialog open
    }
  };

  const selecting = selection.active;

  return (
    <Box sx={{ pt: 1 }}>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          rowGap: 0.5,
          mb: 0.5,
        }}
      >
        <Title>{t('my_ticks.mentions.title')}</Title>
        <MentionsToolbar
          selection={selection}
          selectedCount={selectedTicks.length}
          selectableIds={selectableIds}
          onCopySelected={() => setDialogOpen(true)}
        />
      </Stack>
      <Typography
        variant="caption"
        component="p"
        sx={{ color: 'text.secondary', mb: 1 }}
      >
        {selecting && selectedTicks.length === 0
          ? t('my_ticks.select.hint')
          : t('my_ticks.mentions.description')}
      </Typography>

      {error ? (
        <Alert severity="error" variant="outlined">
          {t('my_ticks.mentions.load_error')}
        </Alert>
      ) : null}

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : null}

      {!isLoading && !error && mentionedTicks.length === 0 ? (
        <Alert severity="info" variant="outlined">
          {t('my_ticks.mentions.empty')}
        </Alert>
      ) : null}

      {mentionedTicks.length > 0 ? (
        <>
          {alreadyLoggedIds.size > 0 ? (
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={hideLogged}
                  onChange={(e) => setHideLogged(e.target.checked)}
                />
              }
              label={
                <Typography variant="body2">
                  {t('my_ticks.mentions.hide_logged')}
                </Typography>
              }
              sx={{ mb: 0.5 }}
            />
          ) : null}
          <MentionsTable
            rows={rows}
            selection={selection}
            selectableIds={selectableIds}
            alreadyLoggedIds={alreadyLoggedIds}
            ownerById={ownerById}
            addingIds={addingIds}
            onAdd={addOne}
          />
        </>
      ) : null}

      {dialogOpen ? (
        <CopyMentionedTicksDialog
          count={selectedTicks.length}
          onClose={() => setDialogOpen(false)}
          onConfirm={addSelected}
        />
      ) : null}
    </Box>
  );
};
