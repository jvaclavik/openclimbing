import styled from '@emotion/styled';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import DeleteIcon from '@mui/icons-material/Delete';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useCallback, useState } from 'react';

import UndoIcon from '@mui/icons-material/Undo';
import {
  Button,
  ButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import { t } from '../../../../services/intl';
import { useClimbingContext } from '../contexts/ClimbingContext';
import { PointType } from '../types';
import { LineTypeButtons } from './LineTypeButtons';
import { PointTypeButtons } from './PointTypeButtons';
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
  const [showPointTypeMenu, setShowPointTypeMenu] = useState(false);
  const [showLineTypeMenu, setShowLineTypeMenu] = useState(false);
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
  } = useClimbingContext();
  const path = getCurrentPath();

  const isExtendVisible =
    (machine.currentStateName === 'pointMenu' &&
      routes[routeSelectedIndex] &&
      pointSelectedIndex === getCurrentPath().length - 1) ||
    (machine.currentStateName === 'editRoute' && routeSelectedIndex !== null);
  const isDoneVisible = machine.currentStateName === 'extendRoute';
  const isUndoVisible =
    machine.currentStateName === 'extendRoute' && path.length !== 0;

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

      setShowPointTypeMenu(false);
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

  const onMouseEnter = () => {
    setRouteIndexHovered(routeSelectedIndex);
  };

  const onMouseLeave = () => {
    setRouteIndexHovered(null);
  };
  const handleUndo = useCallback(
    (e) => {
      machine.execute('undoPoint');
      e.preventDefault();
    },
    [machine],
  );

  useFloatingMenuShortcuts(
    onPointTypeChange,
    onContinueClimbingRouteClick,
    toggleProtectionPlacement,
    isUndoVisible,
    handleUndo,
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
        <DialogTitle id="alert-dialog-title">Delete point?</DialogTitle>
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
          {showPointTypeMenu || showLineTypeMenu ? (
            <>
              <Button
                onClick={() => {
                  setShowPointTypeMenu(false);
                  setShowLineTypeMenu(false);
                }}
                startIcon={<ArrowBackIcon />}
                sx={{
                  '> *': {
                    margin: 0,
                  },
                }}
              />
              {showPointTypeMenu && (
                <PointTypeButtons
                  setShowRouteMarksMenu={setShowPointTypeMenu}
                />
              )}
              {showLineTypeMenu && (
                <LineTypeButtons setShowLineTypeMenu={setShowLineTypeMenu} />
              )}
            </>
          ) : (
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
              {isEditMode && (
                <Tooltip
                  title={t('climbingpanel.protection_points_tooltip')}
                  arrow
                >
                  <IconButton
                    color={isPlacingProtectionPoints ? 'secondary' : 'primary'}
                    size="small"
                    onClick={toggleProtectionPlacement}
                  >
                    <RadioButtonUncheckedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {isPointMenuLike && (
                <>
                  <Button
                    onClick={() => {
                      setShowPointTypeMenu(true);
                    }}
                  >
                    {t('climbingpanel.type')}
                  </Button>
                  {machine.currentStateName === 'pointMenu' && (
                    <Button
                      onClick={() => {
                        setShowLineTypeMenu(true);
                      }}
                    >
                      {t('climbingpanel.line')}
                    </Button>
                  )}
                </>
              )}

              {isUndoVisible && (
                <Button
                  onClick={handleUndo}
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                  startIcon={<UndoIcon fontSize="small" />}
                >
                  {t('climbingpanel.undo')}
                </Button>
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
            </>
          )}
        </ButtonGroup>
      </Container>
    </>
  );
};
