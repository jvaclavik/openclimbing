import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ClimbingRoute,
  PathPoint,
  PathPoints,
  PointType,
  Position,
  PositionPx,
  Size,
  ZoomState,
} from '../types';
import { updateElementOnIndex } from '../utils/array';
import {
  findCloserPointFactory,
  FindCloserPointOptions,
} from '../utils/findCloserPoint';
import {
  ActionWithCallback,
  State,
  StateAction,
  useStateMachine,
} from '../utils/useStateMachine';
import { useDebugMode } from '../../../utils/debug';
import { positionUtilsFactory } from '../utils/positionUtilsFactory';
import { Feature } from '../../../../services/types';
import { osmToClimbingRoutes } from './osmToClimbingRoutes';
import { publishDbgObject } from '../../../../utils';
import { getContainedSizeImage } from '../utils/image';
import { Setter } from '../../../../types';
import { parseProtectionPointsByPhoto } from '../utils/protectionPathTags';
import { useEditUndoHistory } from './useEditUndoHistory';
import { useHeldPointType } from '../utils/useHeldPointType';

type LoadedPhotos = Record<string, Record<number, boolean>>;
type ImageSize = {
  width: number;
  height: number;
};
type PhotoInfo =
  | null
  | 'hasPathOnThisPhoto'
  | 'isOnThisPhoto'
  | 'hasPathInDifferentPhoto'
  | 'isOnDifferentPhoto';

type ClimbingContextType = {
  editorPosition: PositionPx;
  imageSize: ImageSize;
  imageContainerSize: ImageSize;
  isRoutesLayerVisible: boolean;
  setIsRoutesLayerVisible: Setter<boolean>;
  isPointMoving: boolean;
  isPanningDisabled: boolean;
  setIsPanningDisabled: Setter<boolean>;
  isRouteSelected: (routeNumber: number) => boolean;
  isOtherRouteSelected: (routeNumber: number) => boolean;
  isRouteHovered: (routeNumber: number) => boolean;
  isPointSelected: (pointNumber: number) => boolean;
  pointSelectedIndex: number;
  routes: Array<ClimbingRoute>;
  routeSelectedIndex: number | null | undefined;
  isPointClicked: boolean;
  setIsPointClicked: Setter<boolean>;
  setEditorPosition: Setter<PositionPx>;
  setImageSize: Setter<ImageSize>;
  setImageContainerSize: Setter<ImageSize>;
  photoPaths: Array<string>;
  setPhotoPaths: Setter<string[]>;
  photoPath: string;
  setPhotoPath: Setter<string>;
  setIsPointMoving: Setter<boolean>;
  setPointSelectedIndex: Setter<number>;
  setRoutes: Setter<ClimbingRoute[]>;
  setRouteSelectedIndex: Setter<number>;
  updateRouteOnIndex: (
    routeIndex: number,
    callback?: (route: ClimbingRoute) => ClimbingRoute,
  ) => void;
  updatePathOnRouteIndex: (
    routeIndex: number,
    callback?: (path: PathPoints) => PathPoints,
  ) => void;
  getPixelPosition: (position: Position) => PositionPx;
  getPathForRoute: (route: ClimbingRoute) => PathPoints;
  getCurrentPath: () => PathPoints;
  getPercentagePosition: (position: PositionPx) => Position;
  addZoom: (position: PositionPx) => PositionPx;
  machine: {
    currentState: Partial<Record<StateAction, ActionWithCallback>>;
    currentStateName: State;
    execute: (desiredAction: StateAction, props?: unknown) => void;
  };
  scrollOffset: PositionPx;
  setScrollOffset: Setter<PositionPx>;
  findCloserPoint: (
    position: Position,
    options?: FindCloserPointOptions | null,
  ) => PathPoint | null;
  photoZoom: ZoomState;
  setPhotoZoom: Setter<ZoomState>;
  areRoutesLoading: boolean;
  setAreRoutesLoading: Setter<boolean>;
  mousePosition: PositionPx;
  setMousePosition: Setter<PositionPx | null>;
  pointElement: null | HTMLElement;
  setPointElement: (pointElement: null | HTMLElement) => void;
  moveRoute: (from: number, to: number) => void;
  isEditMode: boolean;
  setIsEditMode: Setter<boolean>;
  viewportSize: Size;
  setViewportSize: Setter<Size>;
  routeIndexHovered: number | null | undefined;
  setRouteIndexHovered: Setter<number>;
  routeIndexExpanded: number | null;
  setRouteIndexExpanded: Setter<number | null>;
  loadedPhotos: LoadedPhotos;
  setLoadedPhotos: Setter<LoadedPhotos>;
  loadPhotoRelatedData: () => void;
  filterDifficulty: Array<string>;
  setFilterDifficulty: Setter<string[]>;
  photoRef: React.MutableRefObject<any>;
  svgRef: React.MutableRefObject<any>;
  getAllRoutesPhotos: (cragPhotos: Array<string>) => void;
  showDebugMenu: boolean;
  isAddingPointBlockedRef: React.MutableRefObject<any>;
  isZoomingRef: React.MutableRefObject<any>;
  pointWasDraggedRef: React.MutableRefObject<boolean>;
  isPointClickedRef: React.MutableRefObject<boolean>;
  isProtectionPointClickedRef: React.MutableRefObject<boolean>;
  arePointerEventsDisabled: boolean; // @TODO do we need it?
  setArePointerEventsDisabled: Setter<boolean>;
  preparePhotos: (cragPhotos: Array<string>) => void;
  routeListTopOffsets: Array<number>;
  setRouteListTopOffset: (
    routeIndex: number,
    routeListTopOffset: number,
  ) => void;
  protectionPointsByPhoto: Record<string, PathPoints>;
  isPlacingProtectionPoints: boolean;
  setIsPlacingProtectionPoints: Setter<boolean>;
  protectionPointSelectedIndex: number | null;
  setProtectionPointSelectedIndex: Setter<number | null>;
  getProtectionPointsForCurrentPhoto: () => PathPoints;
  addProtectionPoint: (point: PathPoint) => void;
  removeProtectionPointAtIndex: (index: number) => void;
  setProtectionPointTypeAtIndex: (
    index: number,
    type: PointType | null | undefined,
  ) => void;
  isProtectionPointClicked: boolean;
  setIsProtectionPointClicked: Setter<boolean>;
  isProtectionPointMoving: boolean;
  setIsProtectionPointMoving: Setter<boolean>;
  updateProtectionPointPositionAtIndex: (
    index: number,
    nextCoords: Position,
    snappedFrom?: PathPoint | null,
  ) => void;
  discardEdits: () => void;
  hasUnsavedEdits: boolean;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  deleteLastPathPoint: () => void;
  isMapVisible: boolean;
  setIsMapVisible: Setter<boolean>;
};

// @TODO generate?
export const ClimbingContext = createContext<ClimbingContextType | null>(null);

type Props = {
  children: ReactNode;
  feature: Feature;
};

export const initialPhotoZoom = {
  scale: 1,
  positionX: 0,
  positionY: 0,
};

const clone = <T,>(value: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
};

const stableStringify = (value: unknown): string => {
  const seen = new WeakSet<object>();
  const normalize = (v: any): any => {
    if (v === null || typeof v !== 'object') return v;
    if (seen.has(v)) return '[Circular]';
    seen.add(v);
    if (Array.isArray(v)) return v.map(normalize);
    const out: Record<string, any> = {};
    for (const key of Object.keys(v).sort()) {
      out[key] = normalize(v[key]);
    }
    return out;
  };
  return JSON.stringify(normalize(value));
};

export const ClimbingContextProvider = ({ children, feature }: Props) => {
  const initialRoutes = osmToClimbingRoutes(feature);
  publishDbgObject('climbingRoutes', initialRoutes);
  const photoRef = useRef(null);
  const svgRef = useRef(null);
  const isAddingPointBlockedRef = useRef(false);
  const isZoomingRef = useRef(false);
  // True once the current pointer gesture has actually dragged a point. Kept in
  // a ref (not state) and cleared only when the next gesture starts, so the
  // point's touchend/mouseup can reliably tell "this was a drag" apart from "a
  // tap" without racing the drag-state reset — otherwise a drag would fall
  // through to opening the PointMenu, whose modal backdrop then swallows all
  // further touches and makes dragging appear to stop working.
  const pointWasDraggedRef = useRef(false);
  const isPointClickedRef = useRef(false);
  const isProtectionPointClickedRef = useRef(false);
  const [photoPaths, setPhotoPaths] = useState<Array<string>>(null);
  const [photoPath, setPhotoPath] = useState<string>(null); // photo URL (pathname), should be null
  const { debugMode: showDebugMenu } = useDebugMode();
  const [isEditMode, setIsEditMode] = useState(false);
  // Whether the bottom panel shows the map (true) or the route list (false).
  // Kept in context so the dialog header's overflow menu can toggle it too.
  const [isMapVisible, setIsMapVisible] = useState<boolean>(false);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [imageContainerSize, setImageContainerSize] = useState({
    width: 0,
    height: 0,
  });
  const [loadedPhotos, setLoadedPhotos] = useState<LoadedPhotos>({});
  const [routes, setRoutes] = useState<Array<ClimbingRoute>>(initialRoutes);
  const [isRoutesLayerVisible, setIsRoutesLayerVisible] =
    useState<boolean>(true);
  const [isPointMoving, setIsPointMoving] = useState<boolean>(false);
  const [isPanningDisabled, setIsPanningDisabled] = useState<boolean>(false);
  const [isPointClicked, setIsPointClicked] = useState<boolean>(false);
  const [isProtectionPointClicked, setIsProtectionPointClicked] =
    useState<boolean>(false);
  const [isProtectionPointMoving, setIsProtectionPointMoving] =
    useState<boolean>(false);
  const [areRoutesLoading, setAreRoutesLoading] = useState<boolean>(true);
  const [arePointerEventsDisabled, setArePointerEventsDisabled] =
    useState<boolean>(false);
  const [routeIndexHovered, setRouteIndexHovered] = useState<number>(null);
  const [mousePosition, setMousePosition] = useState<PositionPx | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<Array<string>>([]);
  const [routeIndexExpanded, setRouteIndexExpanded] = useState<number>(null);
  const [editorPosition, setEditorPosition] = useState<PositionPx>({
    x: 0,
    y: 0,
    units: 'px',
  });
  const [photoZoom, setPhotoZoom] = useState<ZoomState>(initialPhotoZoom);
  const [viewportSize, setViewportSize] = useState<Size>({
    width: 0,
    height: 0,
  });
  const [scrollOffset, setScrollOffset] = useState<PositionPx>({
    x: 0,
    y: 0,
    units: 'px',
  });
  const [routeSelectedIndex, setRouteSelectedIndex] = useState<number>(null);
  const [pointSelectedIndex, setPointSelectedIndex] = useState<number>(null);
  const [protectionPointsByPhoto, setProtectionPointsByPhoto] = useState<
    Record<string, PathPoints>
  >(() => parseProtectionPointsByPhoto(feature.tags));
  const [isPlacingProtectionPoints, setIsPlacingProtectionPoints] =
    useState(false);
  const [protectionPointSelectedIndex, setProtectionPointSelectedIndex] =
    useState<number | null>(null);

  const [editSnapshot, setEditSnapshot] = useState<{
    routes: Array<ClimbingRoute>;
    protectionPointsByPhoto: Record<string, PathPoints>;
  } | null>(null);

  const editSnapshotRef = useRef<{
    routes: Array<ClimbingRoute>;
    protectionPointsByPhoto: Record<string, PathPoints>;
  } | null>(null);

  useEffect(() => {
    if (!isEditMode) return;
    const snapshot = {
      routes: clone(routes),
      protectionPointsByPhoto: clone(protectionPointsByPhoto),
    };
    editSnapshotRef.current = snapshot;
    setEditSnapshot(snapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode]);

  const { undo, redo, canUndo, canRedo } = useEditUndoHistory({
    isEditMode,
    routes,
    protectionPointsByPhoto,
    setRoutes,
    setProtectionPointsByPhoto,
    setPointSelectedIndex,
    setProtectionPointSelectedIndex,
    // A drag gesture (point or protection point) keeps one of these true from
    // mousedown to mouseup, so all its intermediate updates coalesce into a
    // single undo step.
    isCoalescing: isPointClicked || isProtectionPointClicked,
  });

  const discardEdits = useCallback(() => {
    const snapshot = editSnapshotRef.current;
    if (snapshot) {
      setRoutes(snapshot.routes);
      setProtectionPointsByPhoto(snapshot.protectionPointsByPhoto);
      return;
    }
    // Fallback (should be rare): reset from original feature tags.
    setRoutes(osmToClimbingRoutes(feature));
    setProtectionPointsByPhoto(parseProtectionPointsByPhoto(feature.tags));
  }, [feature]);

  // Serializing all routes on every render (incl. mouse move / drag / zoom)
  // is wasteful; only recompute when the edited data actually changes.
  const hasUnsavedEdits = useMemo(
    () =>
      isEditMode &&
      editSnapshot !== null &&
      (stableStringify(editSnapshot.routes) !== stableStringify(routes) ||
        stableStringify(editSnapshot.protectionPointsByPhoto) !==
          stableStringify(protectionPointsByPhoto)),
    [isEditMode, editSnapshot, routes, protectionPointsByPhoto],
  );

  const [pointElement, setPointElement] = useState<null | HTMLElement>(null);
  const [routeListTopOffsets, setRouteListTopOffsets] = useState<Array<number>>(
    [],
  );

  const setRouteListTopOffset = useCallback((index: number, offset: number) => {
    setRouteListTopOffsets((prevPositions) => {
      const newPositions = [...prevPositions];
      newPositions[index] = offset;
      return newPositions;
    });
  }, []);

  useEffect(() => {
    setProtectionPointSelectedIndex(null);
    setIsProtectionPointClicked(false);
    setIsProtectionPointMoving(false);
  }, [photoPath]);

  const heldPointTypeRef = useHeldPointType(isEditMode);

  const getProtectionPointsForCurrentPhoto = useCallback(
    () => protectionPointsByPhoto[photoPath] ?? [],
    [protectionPointsByPhoto, photoPath],
  );

  const addProtectionPoint = useCallback(
    (point: PathPoint) => {
      setProtectionPointsByPhoto((prev) => {
        const current = prev[photoPath] ?? [];
        return {
          ...prev,
          [photoPath]: [...current, { ...point, units: 'percentage' as const }],
        };
      });
    },
    [photoPath],
  );

  const removeProtectionPointAtIndex = useCallback(
    (index: number) => {
      setProtectionPointsByPhoto((prev) => {
        const current = prev[photoPath] ?? [];
        return {
          ...prev,
          [photoPath]: current.filter((_, i) => i !== index),
        };
      });
      setProtectionPointSelectedIndex((prev) => (prev === index ? null : prev));
    },
    [photoPath],
  );

  const setProtectionPointTypeAtIndex = useCallback(
    (index: number, type: PointType | null | undefined) => {
      setProtectionPointsByPhoto((prev) => {
        const current = prev[photoPath] ?? [];
        return {
          ...prev,
          [photoPath]: updateElementOnIndex(current, index, (p) => {
            const next = { ...p };
            if (type == null) {
              delete next.type;
            } else {
              next.type = type;
            }
            return next;
          }),
        };
      });
    },
    [photoPath],
  );

  const updateProtectionPointPositionAtIndex = useCallback(
    (index: number, nextCoords: Position, snappedFrom?: PathPoint | null) => {
      setProtectionPointsByPhoto((prev) => {
        const current = prev[photoPath] ?? [];
        return {
          ...prev,
          [photoPath]: updateElementOnIndex(current, index, (p) => {
            const next: PathPoint = {
              ...p,
              x: nextCoords.x,
              y: nextCoords.y,
              units: 'percentage',
            };
            if (snappedFrom?.type) {
              next.type = snappedFrom.type;
            }
            return next;
          }),
        };
      });
    },
    [photoPath],
  );

  const getPathOnIndex = (index: number) =>
    routes[index]?.paths?.[photoPath] || [];

  const getPathForRoute = (route: ClimbingRoute) =>
    route?.paths?.[photoPath] || [];

  const getCurrentPath = () => getPathOnIndex(routeSelectedIndex);

  const updateRouteOnIndex = (
    routeIndex: number,
    callback?: (route: ClimbingRoute) => ClimbingRoute,
  ) => {
    setRoutes((prevRoutes) => {
      return updateElementOnIndex<ClimbingRoute>(
        prevRoutes,
        routeIndex,
        callback,
      );
    });
  };

  const updatePathOnRouteIndex = (
    routeIndex: number,
    callback?: (route: PathPoints) => PathPoints,
  ) =>
    updateRouteOnIndex(routeSelectedIndex, (route) => ({
      ...route,
      paths: {
        ...(route?.paths ?? {}),
        [photoPath]: callback(getPathOnIndex(routeIndex)),
      },
    }));

  const deleteLastPathPoint = () => {
    if (routeSelectedIndex === null || routeSelectedIndex === undefined) return;
    const path = routes[routeSelectedIndex]?.paths?.[photoPath] ?? [];
    if (path.length === 0) return;
    updatePathOnRouteIndex(routeSelectedIndex, (p) => p.slice(0, -1));
    setPointSelectedIndex(null);
  };

  const moveRoute = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex < routes.length &&
      toIndex < routes.length &&
      fromIndex >= 0 &&
      toIndex >= 0
    ) {
      const itemToMove = routes[fromIndex];
      const newArray = routes.filter((_, index) => index !== fromIndex); // Vytvoří nové pole bez přesunutého prvku
      newArray.splice(toIndex, 0, itemToMove); // Vloží prvek na novou pozici
      setRoutes(newArray);
    }
  };

  const findCloserPoint = findCloserPointFactory({
    routeSelectedIndex,
    routes,
    getPathForRoute,
    getProtectionPoints: getProtectionPointsForCurrentPhoto,
  });

  const { getPixelPosition, getPercentagePosition, addZoom } =
    positionUtilsFactory({
      editorPosition,
      imageSize,
      photoZoom,
    });

  const machine = useStateMachine({
    setRouteSelectedIndex,
    setPointSelectedIndex,
    updatePathOnRouteIndex,
    updateElementOnIndex,
    routeSelectedIndex,
    pointSelectedIndex,
    setRouteIndexHovered,
    setMousePosition,
    setRoutes,
    routes,
    updateRouteOnIndex,
    getPercentagePosition,
    findCloserPoint,
    svgRef,
    photoZoom,
    setIsPanningDisabled,
    photoPath,
    protectionPointSelectedIndex,
    setProtectionPointSelectedIndex,
    setProtectionPointTypeAtIndex,
    removeProtectionPointAtIndex,
    setIsPlacingProtectionPoints,
    heldPointTypeRef,
  });

  const isRouteSelected = (index: number) => routeSelectedIndex === index;
  const isOtherRouteSelected = (index: number) =>
    routeSelectedIndex !== null && isRouteSelected(index) === false;
  const isRouteHovered = (index: number) => routeIndexHovered === index;
  const isPointSelected = (index: number) => pointSelectedIndex === index;

  const getAllRoutesPhotos = (cragPhotos: Array<string>) => {
    const photos = routes.reduce((acc, route) => {
      if (!route.paths) return [];
      const routePhotos = Object.keys(route.paths);
      return [...new Set([...acc, ...cragPhotos, ...routePhotos])];
    }, []);

    setPhotoPaths(photos);
  };

  const preparePhotos = (cragPhotos: Array<string>) => {
    if (photoPaths === null) getAllRoutesPhotos(cragPhotos);
  };

  const loadPhotoRelatedData = () => {
    if (photoRef.current) {
      const [width, height] = getContainedSizeImage(photoRef.current);
      const { left, top } = photoRef.current.getBoundingClientRect();

      setImageContainerSize({
        width: photoRef.current.width,
        height: photoRef.current.height,
      });
      setImageSize({
        width,
        height,
      });
      setEditorPosition({ x: left, y: top, units: 'px' });
      setViewportSize({
        width: window?.innerWidth,
        height: window?.innerHeight,
      });
    }
    setAreRoutesLoading(false);
  };

  const climbingState: ClimbingContextType = {
    editorPosition,
    getPercentagePosition,
    getPixelPosition,
    imageSize,
    isPointClicked,
    isRoutesLayerVisible,
    setIsRoutesLayerVisible,
    isPointMoving,
    isPanningDisabled,
    setIsPanningDisabled,
    isRouteSelected,
    isOtherRouteSelected,
    isRouteHovered,
    isPointSelected,
    pointSelectedIndex,
    routes,
    routeSelectedIndex,
    setEditorPosition,
    setImageSize,
    setIsPointClicked,
    isProtectionPointClicked,
    setIsProtectionPointClicked,
    isProtectionPointMoving,
    setIsProtectionPointMoving,
    setIsPointMoving,
    setPointSelectedIndex,
    setRoutes,
    setRouteSelectedIndex,
    updateRouteOnIndex,
    updatePathOnRouteIndex,
    machine: machine,
    getPathForRoute,
    getCurrentPath,
    scrollOffset,
    setScrollOffset,
    findCloserPoint,
    mousePosition,
    setMousePosition,
    pointElement,
    setPointElement,
    moveRoute,
    isEditMode,
    setIsEditMode,
    viewportSize,
    setViewportSize,
    routeIndexHovered,
    setRouteIndexHovered,
    photoPath,
    photoPaths,
    setPhotoPaths,
    setPhotoPath,
    routeIndexExpanded,
    setRouteIndexExpanded,
    loadPhotoRelatedData,
    filterDifficulty,
    setFilterDifficulty,
    photoRef, // @TODO rename: technically it's not photoRef but photoContainerRef, because photo is scaled by object-fit: contain
    svgRef,
    areRoutesLoading,
    setAreRoutesLoading,
    photoZoom,
    setPhotoZoom,
    addZoom,
    getAllRoutesPhotos,
    showDebugMenu,
    isAddingPointBlockedRef,
    isZoomingRef,
    pointWasDraggedRef,
    isPointClickedRef,
    isProtectionPointClickedRef,
    arePointerEventsDisabled,
    setArePointerEventsDisabled,
    preparePhotos,
    imageContainerSize,
    setImageContainerSize,
    loadedPhotos,
    setLoadedPhotos,
    routeListTopOffsets,
    setRouteListTopOffset,
    protectionPointsByPhoto,
    isPlacingProtectionPoints,
    setIsPlacingProtectionPoints,
    protectionPointSelectedIndex,
    setProtectionPointSelectedIndex,
    getProtectionPointsForCurrentPhoto,
    addProtectionPoint,
    removeProtectionPointAtIndex,
    setProtectionPointTypeAtIndex,
    updateProtectionPointPositionAtIndex,
    discardEdits,
    hasUnsavedEdits,
    undo,
    redo,
    canUndo,
    canRedo,
    deleteLastPathPoint,
    isMapVisible,
    setIsMapVisible,
  };

  return (
    <ClimbingContext.Provider value={climbingState}>
      {children}
    </ClimbingContext.Provider>
  );
};

export const useClimbingContext = () => {
  const context = useContext(ClimbingContext);
  if (!context) {
    throw new Error(
      'useClimbingContext must be used within a ClimbingProvider',
    );
  }
  return context;
};
