import styled from '@emotion/styled';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import EditIcon from '@mui/icons-material/Edit';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import MapIcon from '@mui/icons-material/Map';
import { CircularProgress, Fab, IconButton, Tooltip } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import SplitPane from 'react-split-pane';
import { TransformComponent } from 'react-zoom-pan-pinch';
import {
  CommonsAllowedWidth,
  getCommonsImageUrl,
} from '../../../services/images/getCommonsImageUrl';
import { t } from '../../../services/intl';
import { convertHexToRgba } from '../../utils/colorUtils';
import { useFeatureContext } from '../../utils/FeatureContext';
import { useUserSettingsContext } from '../../utils/userSettings/UserSettingsContext';
import { ClimbingViewContent } from './ClimbingViewContent';
import { CLIMBING_ROUTE_ROW_HEIGHT, SPLIT_PANE_DEFAULT_SIZE } from './config';
import { useClimbingContext } from './contexts/ClimbingContext';
import { RouteFloatingMenu } from './Editor/RouteFloatingMenu';
import { RoutesEditor } from './Editor/RoutesEditor';
import { TransformWrapper } from './TransformWrapper';
import {
  getResolution,
  getWikimediaCommonsPhotoValues,
  removeFilePrefix,
} from './utils/photo';
import { useClimbingViewShortcuts } from './utils/useClimbingViewShortcuts';
import { useGetCragViewLayout } from './utils/useCragViewLayout';
import { useReplacePhotoIfNeeded } from './utils/useReplacePhotoIfNeeded';

export const DEFAULT_CRAG_VIEW_LAYOUT = 'horizontal';

const BottomContainer = styled.div`
  overflow: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  // Establish a container so descendants can adapt to the right panel's width
  // via @container queries (header, edit button, grade alignment, ...).
  container-type: inline-size;
`;
const FabContainer = styled.div`
  position: absolute;
  bottom: 12px;
  right: 12px;
  z-index: 1000;
`;
const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;

  .Resizer {
    &.horizontal {
      cursor: row-resize;
      height: 15px;
      margin: -7px 0;
      &::before {
        width: 40px;
        height: 12px;
        content: '...';
        justify-content: center;
        align-items: unset;
      }
      &::after {
        border-top: solid 1px #222;
        width: 100%;
        height: 1px;
        margin-top: 1px;
      }
    }
    &.vertical {
      width: 15px;
      cursor: col-resize;
      margin: 0 -7px;
      &::before {
        width: 12px;
        height: 40px;
        content: '⋮';
      }
      &::after {
        border-left: solid 1px #222;
        height: 100%;
        width: 1px;
      }
    }

    z-index: 100000;
    display: flex;
    justify-content: center;
    align-items: center;
    &::before {
      position: absolute;
      display: flex;
      align-items: center;
      border-radius: 6px;
      background: ${({ theme }) => theme.palette.background.paper};
      margin-top: 1px;
      z-index: 1;
      transition: all 0.1s ease;
      border: solid 1px ${({ theme }) => theme.palette.divider};
      text-align: center;
      line-height: 0px;
      font-size: 20px;
      color: ${({ theme }) => theme.palette.primary.main};
      letter-spacing: 1px;
    }
    &::after {
      position: absolute;
      content: '';
      transition: all 0.1s ease;
    }

    &:hover {
      &::before {
        background-color: ${({ theme }) => theme.palette.primary.main};
        border: solid 1px ${({ theme }) => theme.palette.primary.main};
        color: ${({ theme }) => theme.palette.primary.contrastText};
      }
      &::after {
        border-color: ${({ theme }) => theme.palette.primary.main};
        border-width: 1px;
        transition-delay: 500ms;
      }
    }
  }
  .Pane.horizontal.Pane2 {
    overflow: hidden;
  }
`;
const BottomPanel = styled.div`
  height: 100%;
  overflow: auto;
`;

const MiniLoadingContainer = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  z-index: 1;
  background: ${({ theme }) =>
    convertHexToRgba(theme.palette.background.default, 0.3)};
  -webkit-backdrop-filter: blur(22px);
  backdrop-filter: blur(22px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FullLoadingContainer = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  z-index: 1;
  background: ${({ theme }) =>
    convertHexToRgba(theme.palette.background.default, 0.7)};
  -webkit-backdrop-filter: blur(40px);
  backdrop-filter: blur(40px);
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;
  align-items: center;
`;

const ArrowExpanderContainer = styled.div<{
  $cragViewLayout: 'horizontal' | 'vertical';
}>`
  position: absolute;
  z-index: 1000000;

  ${({ $cragViewLayout }) =>
    $cragViewLayout === 'horizontal'
      ? `
    top: -6px;
    width: 100%;`
      : `
      left: -6px;
      height: 100%;
      top: 50%;
      `}
`;

const ArrowExpanderButton = styled.div<{ $arrowOnTop?: boolean }>`
  background: ${({ theme }) => theme.palette.background.default};
  width: 30px;
  height: 30px;
  margin: auto;
  border-radius: 50%;
  ${({ $arrowOnTop }) =>
    $arrowOnTop
      ? undefined
      : `
  bottom: 0;
  border-radius: 50%;
  `};
  justify-content: center;
  display: flex;
`;

const BlurContainer = styled.div`
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  background-color: rgba(0, 0, 0, 0.6);
  height: 100%;
`;

const BackgroundContainer = styled.div<{
  $imageHeight: number;
  $imageUrl: string;
}>`
  transition: 0.3s all;
  background: #111 ${({ $imageUrl }) => `url(${$imageUrl}) no-repeat`};
  background-size: cover;
  background-position: center;
  object-fit: cover;
  object-position: center;
  width: 100%;
  height: 100%;
`;

const RestorePaneFab = styled.div<{
  $cragViewLayout: 'horizontal' | 'vertical';
}>`
  position: absolute;
  z-index: 1000001;
  ${({ $cragViewLayout }) =>
    $cragViewLayout === 'horizontal'
      ? `
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
      `
      : `
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
      `}
`;

// Pane2 (routes list) is considered effectively collapsed once its rendered
// size along the split axis drops below this threshold. We don't require it
// to literally reach 0 — once it's this small, the dragger is useless and we
// swap it for a single restore-arrow FAB that brings the routes list back.
const PANE2_COLLAPSED_THRESHOLD_PX = 100;

// Once pane2 crosses the threshold, we set splitPaneSize to this sentinel so
// pane2 actually goes to 0 px (pane1Style: maxHeight/maxWidth 100% clamps
// pane1 back down to the container, so the actual rendered size is fine on
// any screen). Stored in the user setting until the restore arrow resets it.
const COLLAPSED_PANE_SIZE_PX = 100000;

const getWindowDimensions = () => {
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
};

const FabMapSwitcher = ({ isMapVisible, setIsMapVisible }) => (
  <FabContainer>
    <Tooltip
      title={`Show ${isMapVisible ? 'route list' : 'map'}`}
      enterDelay={1500}
      arrow
    >
      <Fab
        size="small"
        color="secondary"
        aria-label="add"
        onClick={() => setIsMapVisible(!isMapVisible)}
      >
        {isMapVisible ? <FormatListNumberedIcon /> : <MapIcon />}
      </Fab>
    </Tooltip>
  </FabContainer>
);

export const ClimbingView = () => {
  const {
    imageSize,
    routeSelectedIndex,
    machine,
    isEditMode,
    viewportSize,
    editorPosition,
    photoPath,
    loadPhotoRelatedData,
    areRoutesLoading,
    preparePhotos,
    photoZoom,
    loadedPhotos,
    routeListTopOffsets,
    setRouteSelectedIndex,
    setIsEditMode,
    isRoutesLayerVisible,
  } = useClimbingContext();
  const { feature } = useFeatureContext();
  const replacePhotoIfNeeded = useReplacePhotoIfNeeded();

  const [photoResolution, setPhotoResolution] = useState(200);
  const [isSplitViewDragging, setIsSplitViewDragging] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const cragViewLayout = useGetCragViewLayout();
  const { userSettings, setUserSetting } = useUserSettingsContext();
  const splitPaneSize = userSettings['climbing.splitPaneSize'];
  useClimbingViewShortcuts();

  useEffect(() => {
    if (isEditMode && machine.currentStateName === 'routeSelected') {
      machine.execute('editRoute', { routeNumber: routeSelectedIndex }); // možná tímhle nahradit isEditMode
    }

    if (!isEditMode && machine.currentStateName === 'editRoute') {
      machine.execute('routeSelect', { routeNumber: routeSelectedIndex });
    }
  }, [isEditMode]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadPhotoRelatedData();
  }, [splitPaneSize]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadPhotoRelatedData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onSplitPaneSizeReset = () => {
    setUserSetting('climbing.splitPaneSize', null);
  };

  useEffect(() => {
    window.addEventListener('resize', loadPhotoRelatedData);
    window.addEventListener('orientationchange', loadPhotoRelatedData);

    return () => {
      window.removeEventListener('resize', loadPhotoRelatedData);
      window.removeEventListener('orientationchange', loadPhotoRelatedData);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const onDragStarted = () => {
    setIsSplitViewDragging(true);
  };
  const onDragFinished = (splitHeight: number) => {
    setUserSetting('climbing.splitPaneSize', splitHeight);
    setIsSplitViewDragging(false);
  };
  const [windowDimensions, setWindowDimensions] = useState(
    getWindowDimensions(),
  );

  const cragPhotos = getWikimediaCommonsPhotoValues(feature.tags).map(
    removeFilePrefix,
  );
  preparePhotos(cragPhotos);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions(getWindowDimensions());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const resolution = getResolution({
      windowDimensions,
      imageSize,
      photoPath,
      photoZoom,
      loadedPhotos,
    });

    // Wikimedia Commons only serves thumbnails at a fixed set of widths
    // (https://www.mediawiki.org/wiki/Common_thumbnail_sizes). Requests for
    // arbitrary widths — and direct hits on the original file URL — are
    // rejected with "Use thumbnail sizes listed on https://w.wiki/GHai",
    // which used to leave the photo never-loading and the resolution loader
    // spinning forever. Bucket up to the next allowed size, never to
    // 'original' (which doesn't go through /thumb/ and is rate-blocked).
    const allowed: CommonsAllowedWidth[] = [500, 960, 1280, 1920, 3840];
    const bucketedWidth =
      allowed.find((w) => resolution <= w) ?? allowed[allowed.length - 1];

    // Track the bucketed width (not the raw resolution) as the loaded-key,
    // so two close zoom levels that round to the same thumbnail size share
    // the cache entry and the loader hides as soon as that bucket is loaded.
    setPhotoResolution(bucketedWidth);

    const url = getCommonsImageUrl(`File:${photoPath}`, bucketedWidth);

    setImageUrl(url);
    if (!backgroundImageUrl && photoPath) {
      setBackgroundImageUrl(url);
    }
  }, [
    backgroundImageUrl,
    imageSize,
    loadedPhotos,
    photoPath,
    photoZoom,
    photoZoom.scale,
    windowDimensions,
  ]);

  const pane2Ref = useRef<HTMLDivElement>(null);
  const [isPane2Collapsed, setIsPane2Collapsed] = useState(false);

  useEffect(() => {
    const node = pane2Ref.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      const dim = cragViewLayout === 'horizontal' ? height : width;
      setIsPane2Collapsed(dim < PANE2_COLLAPSED_THRESHOLD_PX);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [cragViewLayout]);

  // Once the threshold is crossed (arrow is showing), snap pane2 down to 0
  // by parking splitPaneSize at the sentinel.
  // Skip when:
  //   * user is actively dragging — react-split-pane is the controlled
  //     source then and changing the size mid-drag would teleport the
  //     divider;
  //   * splitPaneSize is null — that means the user just clicked the restore
  //     arrow (or the default is in effect); pane2 hasn't visually grown
  //     yet so isPane2Collapsed is still true from the previous tick. If we
  //     snapped here we'd immediately re-park at the sentinel and the panel
  //     would flash open and close.
  useEffect(() => {
    if (
      isPane2Collapsed &&
      !isSplitViewDragging &&
      splitPaneSize != null &&
      splitPaneSize !== COLLAPSED_PANE_SIZE_PX
    ) {
      setUserSetting('climbing.splitPaneSize', COLLAPSED_PANE_SIZE_PX);
    }
  }, [isPane2Collapsed, isSplitViewDragging, splitPaneSize, setUserSetting]);

  const showArrowOnTop = splitPaneSize === 0;
  const showArrowOnBottom =
    splitPaneSize === viewportSize.height - editorPosition.y;

  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [isMapVisible, setIsMapVisible] = useState(false);

  const isResolutionLoaded =
    loadedPhotos?.[photoPath]?.[photoResolution] || false;
  const resolutions = loadedPhotos?.[photoPath];
  const isFirstPhotoLoaded =
    resolutions &&
    Object.keys(resolutions).filter((key) => resolutions[key] === true).length >
      0;

  const selectRouteByScroll = (e) => {
    const { scrollTop } = e.target;
    const scrollTopWithOffset = scrollTop + 20 + CLIMBING_ROUTE_ROW_HEIGHT;

    const selectedIndex = routeListTopOffsets.findIndex(
      (offset) =>
        offset <= scrollTopWithOffset &&
        offset + CLIMBING_ROUTE_ROW_HEIGHT >= scrollTopWithOffset,
    );

    if (userSettings['climbing.switchPhotosByScrolling'])
      replacePhotoIfNeeded({
        isPhotoLoading,
        setIsPhotoLoading,
        selectedIndex,
      });
    if (selectedIndex !== -1) setRouteSelectedIndex(selectedIndex);
  };

  const handleOnScroll = (e) => {
    if (
      userSettings['climbing.selectRoutesByScrolling'] &&
      routeSelectedIndex !== null &&
      !isEditMode
    ) {
      selectRouteByScroll(e);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setTimeout(() => {
      loadPhotoRelatedData();
    });
  };

  return (
    <Container>
      {(showArrowOnTop || showArrowOnBottom) && (
        <ArrowExpanderContainer $cragViewLayout={cragViewLayout}>
          <ArrowExpanderButton $arrowOnTop={showArrowOnTop}>
            <IconButton
              onClick={onSplitPaneSizeReset}
              color="primary"
              size="small"
            >
              {cragViewLayout === 'horizontal' ? (
                <ArrowDownwardIcon fontSize="small" />
              ) : (
                <ArrowForwardIcon fontSize="small" />
              )}
            </IconButton>
          </ArrowExpanderButton>
        </ArrowExpanderContainer>
      )}
      {photoPath ? (
        <SplitPane
          split={cragViewLayout}
          // Keep the photo pane at least 150 px so the right/bottom panel can
          // never grow to the point of hiding the photo entirely.
          minSize={150}
          // Allow the photo pane to grow all the way (pane2 down to 0 px).
          // When pane2 collapses, a restore-arrow FAB takes the divider's job.
          size={splitPaneSize ?? SPLIT_PANE_DEFAULT_SIZE}
          onDragStarted={onDragStarted}
          onDragFinished={onDragFinished}
          // pane1 needs an explicit max equal to the container size; without
          // it, an oversized inline size set by react-split-pane (e.g. a
          // stored splitPaneSize from before the window shrunk) overflows the
          // container instead of clamping responsively. The previous
          // `calc(100% - 100px)` was the same idea but additionally enforced
          // a 100 px floor for pane2 — which is what blocked drag-to-full.
          pane1Style={
            cragViewLayout === 'vertical'
              ? { maxWidth: '100%' }
              : { maxHeight: '100%' }
          }
          // Without this, pane2's default flex `min-width: auto` is its
          // content's intrinsic width (~417px in this list). Pane2 then refuses
          // to shrink below that, while react-split-pane still inflates pane1's
          // inline width past the visible area, shifting the cover background.
          pane2Style={
            cragViewLayout === 'vertical' ? { minWidth: 0 } : { minHeight: 0 }
          }
        >
          <BackgroundContainer
            $imageHeight={imageSize.height}
            $imageUrl={backgroundImageUrl}
          >
            <>
              {!isEditMode && (
                <FabContainer>
                  <Tooltip
                    title={t('climbingpanel.draw_routes')}
                    enterDelay={1500}
                    arrow
                  >
                    <Fab size="small" color="secondary" onClick={handleEdit}>
                      <EditIcon />
                    </Fab>
                  </Tooltip>
                </FabContainer>
              )}

              {(!isResolutionLoaded || isPhotoLoading) && (
                <MiniLoadingContainer>
                  <CircularProgress color="primary" size={14} thickness={6} />
                </MiniLoadingContainer>
              )}
              {!isFirstPhotoLoaded && (
                <FullLoadingContainer>
                  <CircularProgress color="primary" />
                </FullLoadingContainer>
              )}
              <BlurContainer>
                <RouteFloatingMenu />
                <TransformWrapper>
                  <TransformComponent
                    wrapperStyle={{ height: '100%', width: '100%' }}
                    contentStyle={{ height: '100%', width: '100%' }}
                  >
                    <RoutesEditor
                      setIsPhotoLoading={setIsPhotoLoading}
                      isPhotoLoading={isPhotoLoading}
                      isRoutesLayerVisible={
                        !isSplitViewDragging &&
                        !areRoutesLoading &&
                        isRoutesLayerVisible
                      }
                      imageUrl={imageUrl}
                      photoResolution={photoResolution}
                    />
                  </TransformComponent>
                </TransformWrapper>
              </BlurContainer>
              {isPane2Collapsed && (
                <RestorePaneFab $cragViewLayout={cragViewLayout}>
                  <Tooltip
                    title={t('climbing.photos') /* shown on hover */}
                    enterDelay={500}
                    arrow
                  >
                    <Fab
                      size="small"
                      color="secondary"
                      onClick={onSplitPaneSizeReset}
                      aria-label="Show route list"
                    >
                      {cragViewLayout === 'horizontal' ? (
                        <ArrowUpwardIcon />
                      ) : (
                        <ArrowBackIcon />
                      )}
                    </Fab>
                  </Tooltip>
                </RestorePaneFab>
              )}
            </>
          </BackgroundContainer>

          <BottomContainer ref={pane2Ref}>
            <FabMapSwitcher
              isMapVisible={isMapVisible}
              setIsMapVisible={setIsMapVisible}
            />
            <BottomPanel onScroll={handleOnScroll}>
              <ClimbingViewContent isMapVisible={isMapVisible} />
            </BottomPanel>
          </BottomContainer>
        </SplitPane>
      ) : (
        <>
          <FabMapSwitcher
            isMapVisible={isMapVisible}
            setIsMapVisible={setIsMapVisible}
          />
          <ClimbingViewContent isMapVisible={isMapVisible} />
        </>
      )}
    </Container>
  );
};
