import styled from '@emotion/styled';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BackspaceOutlinedIcon from '@mui/icons-material/BackspaceOutlined';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useCallback, useEffect, useState } from 'react';
import { isTypingInFormField } from '../../../../helpers/hooks';

import RedoIcon from '@mui/icons-material/Redo';
import UndoIcon from '@mui/icons-material/Undo';
import {
  Box,
  Button,
  ButtonGroup,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { t } from '../../../../services/intl';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { PointType } from '../types';
import { LineTypeButtons } from './LineTypeButtons';
import { PointTypeButtons } from './PointTypeButtons';
import { useRecognizeBolts } from './useRecognizeBolts';
import { useFloatingMenuShortcuts } from './useFloatingMenuShortcuts';
import { addShortcutUnderline } from './utils';

const Container = styled.div<{ $isEditMode: boolean }>`
  position: absolute;
  z-index: 1;
  bottom: 4px;
  left: 0;
  right: ${({ $isEditMode }) => ($isEditMode ? 0 : 70)}px;
  overflow: auto;
  padding: 0 12px 8px 12px;
  text-align: right;
  pointer-events: none;
`;

export const RouteFloatingMenu = () => {
  const [isDeletePointDialogVisible, setIsDeletePointDialogVisible] =
    useState(false);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const {
    machine,
    pointSelectedIndex,
    routes,
    routeSelectedIndex,
    getCurrentPath,
    setRouteIndexHovered,
    setIsRoutesLayerVisible,
    isRoutesLayerVisible,
    isEditMode,
    isPlacingProtectionPoints,
    setIsPlacingProtectionPoints,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteLastPathPoint,
  } = useClimbingContext();
  const path = getCurrentPath();
  const recognizeBolts = useRecognizeBolts();

  const isExtendVisible =
    (machine.currentStateName === 'pointMenu' &&
      routes[routeSelectedIndex] &&
      pointSelectedIndex === getCurrentPath().length - 1) ||
    (machine.currentStateName === 'editRoute' && routeSelectedIndex !== null);
  const isDoneVisible = machine.currentStateName === 'extendRoute';
  const hasActivePathPoints =
    routeSelectedIndex !== null &&
    routeSelectedIndex !== undefined &&
    path.length > 0;

  const onFinishClimbingRouteClick = useCallback(() => {
    machine.execute('finishRoute');
  }, [machine]);
  const onContinueClimbingRouteClick = useCallback(() => {
    if (routeSelectedIndex === null) return;
    machine.execute('extendRoute');
  }, [machine, routeSelectedIndex]);
  const onDeletePoint = () => {
    machine.execute('deletePoint');
    setIsDeletePointDialogVisible(false);
  };

  const toggleDeletePointDialog = () => {
    setIsDeletePointDialogVisible(!isDeletePointDialogVisible);
  };

  const onPointTypeChange = useCallback(
    (type: PointType | null) => {
      machine.execute('changePointType', { type });
    },
    [machine],
  );

  const toggleProtectionPlacement = useCallback(() => {
    const next = !isPlacingProtectionPoints;
    if (next) {
      machine.execute('finishRoute');
    } else if (machine.currentStateName === 'protectionPointMenu') {
      machine.execute('cancelPointMenu');
    }
    setIsPlacingProtectionPoints(next);
  }, [isPlacingProtectionPoints, machine, setIsPlacingProtectionPoints]);

  const isPointMenuLike =
    machine.currentStateName === 'pointMenu' ||
    machine.currentStateName === 'protectionPointMenu';

  // Delete key opens the delete-point confirmation dialog when a point is
  // selected in edit mode. Matches the trash-can button on the floating
  // toolbar but lets the user delete without reaching for the mouse.
  useEffect(() => {
    if (!isEditMode || !isPointMenuLike) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (isTypingInFormField(e.target as Element)) return;
      if (e.key !== 'Delete') return;
      e.preventDefault();
      setIsDeletePointDialogVisible(true);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isEditMode, isPointMenuLike]);

  const onMouseEnter = () => {
    setRouteIndexHovered(routeSelectedIndex);
  };

  const onMouseLeave = () => {
    setRouteIndexHovered(null);
  };
  const handleUndo = useCallback(
    (e) => {
      undo();
      e?.preventDefault();
    },
    [undo],
  );

  const handleRedo = useCallback(
    (e) => {
      redo();
      e?.preventDefault();
    },
    [redo],
  );

  const closeMoreMenu = () => setMoreMenuAnchor(null);

  const onRecognizeBoltsClick = async () => {
    if (recognizeBolts.isRunning) return;
    await recognizeBolts.run();
    closeMoreMenu();
  };

  const onToggleGearPlacements = () => {
    toggleProtectionPlacement();
    closeMoreMenu();
  };

  const onDeleteLastPointClick = () => {
    deleteLastPathPoint();
    closeMoreMenu();
  };

  // Undo/redo stay in the open menu so they can be triggered repeatedly; the
  // arrows just enable/disable as the history is consumed.
  const onMenuUndo = () => undo();
  const onMenuRedo = () => redo();

  // Backspace removes the last point of the currently active route path (the
  // "delete last part of the route" gesture), independent of the global undo.
  useEffect(() => {
    if (!isEditMode) return undefined;
    const handler = (e: KeyboardEvent) => {
      if (isTypingInFormField(e.target as Element)) return;
      if (e.key !== 'Backspace') return;
      if (routeSelectedIndex === null || routeSelectedIndex === undefined) {
        return;
      }
      e.preventDefault();
      deleteLastPathPoint();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isEditMode, routeSelectedIndex, deleteLastPathPoint]);

  useFloatingMenuShortcuts(
    onPointTypeChange,
    onContinueClimbingRouteClick,
    toggleProtectionPlacement,
    canUndo,
    handleUndo,
    canRedo,
    handleRedo,
    isDoneVisible,
    onFinishClimbingRouteClick,
  );

  if (!isEditMode) {
    return null;
  }

  return (
    <>
      <Dialog
        open={isDeletePointDialogVisible}
        onClose={toggleDeletePointDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {t('climbing_editor.delete_point_question')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {t('climbingpanel.delete_point_text')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={toggleDeletePointDialog} autoFocus>
            {t('climbingpanel.delete_point_cancel')}
          </Button>
          <Button onClick={onDeletePoint} variant="contained">
            {t('climbingpanel.delete_point_delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Container $isEditMode={isEditMode}>
        <ButtonGroup
          variant="contained"
          size="small"
          color="primary"
          sx={{ pointerEvents: 'all', gap: 0.5 }}
        >
          <>
            {isExtendVisible && (
              <Button
                onClick={onContinueClimbingRouteClick}
                startIcon={<AddLocationIcon />}
              >
                {getCurrentPath().length > 0
                  ? addShortcutUnderline(t('climbingpanel.extend'), 'e')
                  : t('climbingpanel.start')}
              </Button>
            )}
            {isPointMenuLike && (
              <>
                <PointTypeButtons />
                {machine.currentStateName === 'pointMenu' && (
                  <LineTypeButtons />
                )}
              </>
            )}

            {isPointMenuLike && (
              <Button
                onClick={toggleDeletePointDialog}
                startIcon={<DeleteIcon />}
                sx={{
                  '> *': {
                    margin: 0,
                  },
                }}
              />
            )}

            {isDoneVisible && (
              <Button
                onClick={onFinishClimbingRouteClick}
                startIcon={<CheckIcon />}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
              >
                {t('climbingpanel.finish_climbing_route')}
              </Button>
            )}
            {!isRoutesLayerVisible && (
              <Tooltip title={t('climbingpanel.show_routes_layer')} arrow>
                <IconButton
                  color="primary"
                  size="medium"
                  onClick={() => {
                    setIsRoutesLayerVisible(true);
                  }}
                >
                  <VisibilityOffIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isEditMode && (
              <>
                <Tooltip title={t('climbingpanel.more_options')} arrow>
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={(e) => setMoreMenuAnchor(e.currentTarget)}
                    aria-label={t('climbingpanel.more_options')}
                  >
                    <MoreVertIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Menu
                  anchorEl={moreMenuAnchor}
                  open={Boolean(moreMenuAnchor)}
                  onClose={closeMoreMenu}
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      gap: 1,
                      px: 1,
                      py: 0.5,
                    }}
                  >
                    <Tooltip title={t('climbingpanel.undo')} arrow>
                      <span>
                        <IconButton
                          size="small"
                          onClick={onMenuUndo}
                          disabled={!canUndo}
                          aria-label={t('climbingpanel.undo')}
                        >
                          <UndoIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={t('climbingpanel.redo')} arrow>
                      <span>
                        <IconButton
                          size="small"
                          onClick={onMenuRedo}
                          disabled={!canRedo}
                          aria-label={t('climbingpanel.redo')}
                        >
                          <RedoIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                  <Divider />
                  <MenuItem
                    onClick={onRecognizeBoltsClick}
                    disabled={recognizeBolts.isRunning}
                  >
                    <ListItemIcon>
                      {recognizeBolts.isRunning ? (
                        <CircularProgress
                          size={18}
                          variant={
                            recognizeBolts.progress
                              ? 'determinate'
                              : 'indeterminate'
                          }
                          value={
                            recognizeBolts.progress &&
                            recognizeBolts.progress.total
                              ? (recognizeBolts.progress.done /
                                  recognizeBolts.progress.total) *
                                100
                              : undefined
                          }
                        />
                      ) : (
                        <AutoAwesomeIcon fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText>
                      {t('climbingpanel.recognize_bolts')}
                    </ListItemText>
                  </MenuItem>
                  <MenuItem onClick={onToggleGearPlacements}>
                    <ListItemIcon>
                      {isPlacingProtectionPoints ? (
                        <CheckIcon fontSize="small" color="secondary" />
                      ) : (
                        <RadioButtonUncheckedIcon fontSize="small" />
                      )}
                    </ListItemIcon>
                    <ListItemText>
                      {t('climbingpanel.protection_points_mode')}
                    </ListItemText>
                  </MenuItem>
                  <MenuItem
                    onClick={onDeleteLastPointClick}
                    disabled={!hasActivePathPoints}
                  >
                    <ListItemIcon>
                      <BackspaceOutlinedIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                      {t('climbingpanel.delete_last_point')}
                    </ListItemText>
                  </MenuItem>
                </Menu>
              </>
            )}
          </>
        </ButtonGroup>
      </Container>
    </>
  );
};
