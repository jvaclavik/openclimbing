import React, { useCallback, useEffect, useRef, useState } from 'react';
import maplibregl, { GeoJSONSource } from 'maplibre-gl';
import { outdoorStyle } from '../../Map/styles/outdoorStyle';
import { COMPASS_TOOLTIP } from '../../Map/useAddTopRightControls';
import styled from '@emotion/styled';
import { useFeatureContext } from '../../utils/FeatureContext';
import type { LayerSpecification } from '@maplibre/maplibre-gl-style-spec';
import { CircularProgress, useTheme } from '@mui/material';
import { useClimbingContext } from './contexts/ClimbingContext';
import { useGetPhotoExifs } from './utils/usePhotoExifGps';
import { usePhotoMarkers } from './utils/usePhotoMarkers';
import { usePhotoHighlightContext } from './contexts/PhotoHighlightContext';
import { isRouteDrawnOnPhoto } from './utils/photo';
import {
  getDifficulty,
  getDifficultyColor,
} from '../../../services/tagging/climbing/routeGrade';

const Map = styled.div<{ $isVisible: boolean }>`
  visibility: ${({ $isVisible }) => ($isVisible ? 'visible' : 'hidden')};
  height: 100%;
  width: 100%;
`;

const LoadingContainer = styled.div`
  height: 100%;
  width: 100%;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Container = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
`;

const emptyGeojson = {
  type: 'geojson' as const,
  data: {
    type: 'FeatureCollection' as const,
    features: [],
  },
};

export const routes: LayerSpecification[] = [
  {
    id: 'climbing-3-routes-circle',
    type: 'circle',
    source: 'climbing',
    paint: {
      'circle-color': [
        'case',
        ['boolean', ['feature-state', 'hover'], false],
        '#4150a0',
        ['coalesce', ['get', 'color'], '#ea5540'],
      ],
      'circle-radius': 4,
      'circle-stroke-color': '#f8f4f0',
      'circle-stroke-width': 1,
    },
  } as LayerSpecification,
  {
    id: 'climbing-3-routes-labels',
    type: 'symbol',
    source: 'climbing',
    layout: {
      'text-padding': 2,
      // bold the routes drawn on the currently highlighted photo
      'text-font': [
        'case',
        ['boolean', ['get', 'bold'], false],
        ['literal', ['Noto Sans Bold']],
        ['literal', ['Noto Sans Medium']],
      ],
      'text-anchor': 'left',
      'text-field': '{name} {grade}',
      'text-offset': [1, 0],
      'text-size': ['case', ['boolean', ['get', 'bold'], false], 16, 14],
      'text-max-width': 9,
      'text-allow-overlap': false,
      'text-optional': true,
    },
    paint: {
      'text-halo-blur': 0.5,
      'text-color': [
        'case',
        ['boolean', ['get', 'bold'], false],
        '#222',
        '#666',
      ],
      'text-halo-width': 1,
      'text-halo-color': '#ffffff',
    },
  },
];

type Props = {
  setIsMapVisible?: (visible: boolean) => void;
};

const useInitMap = ({ setIsMapVisible }: Props) => {
  const containerRef = useRef(null);
  const mapRef = useRef<maplibregl.Map>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isFirstMapLoad, setIsFirstMapLoad] = useState(true);

  const { feature } = useFeatureContext();
  const { photoPaths, photoPath, setPhotoPath } = useClimbingContext();
  const { highlightedPhoto } = usePhotoHighlightContext();
  const theme = useTheme();
  const themeMode = theme.palette.mode === 'dark' ? 'dark' : 'light';

  const photoExifs = useGetPhotoExifs(photoPaths);

  const onPhotoClick = useCallback(
    (photoName: string) => {
      setPhotoPath(photoName);
      setIsMapVisible?.(false);
    },
    [setPhotoPath, setIsMapVisible],
  );

  usePhotoMarkers(map, photoExifs, photoPaths ?? [], {
    activePhoto: photoPath,
    onPhotoClick,
  });

  const getClimbingSource = useCallback(
    () => mapRef.current.getSource('climbing') as GeoJSONSource | undefined,
    [],
  );

  useEffect(() => {
    const geolocation = new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true,
      },
      fitBoundsOptions: {
        duration: 4000,
      },
      trackUserLocation: true,
    });

    setIsMapLoaded(false);
    if (!containerRef.current) return undefined;
    const mapInstance = new maplibregl.Map({
      container: containerRef.current,
      style: {
        ...outdoorStyle,
        layers: [...outdoorStyle.layers, ...routes],
        sources: { ...outdoorStyle.sources, climbing: emptyGeojson },
      },
      attributionControl: false,
      refreshExpiredTiles: false,
      locale: {
        'NavigationControl.ResetBearing': COMPASS_TOOLTIP,
      },
    });

    mapInstance.scrollZoom.setWheelZoomRate(1 / 200); // 1/450 is default, bigger value = faster
    mapInstance.addControl(geolocation);
    mapRef.current = mapInstance;

    mapInstance.on('load', () => {
      setIsMapLoaded(true);
      setMap(mapInstance);
    });

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [containerRef]);

  useEffect(() => {
    mapRef.current?.on('load', () => {
      if (isFirstMapLoad) {
        mapRef.current.jumpTo({
          center: feature.center,
          zoom: 18.5,
        });

        getClimbingSource()?.setData({
          type: 'FeatureCollection' as const,
          features: transformMemberFeaturesToGeojson(
            feature.memberFeatures,
            themeMode,
            highlightedPhoto,
          ),
        });
        setIsFirstMapLoad(false);
      }
    });
  }, [
    feature.center,
    feature.memberFeatures,
    getClimbingSource,
    highlightedPhoto,
    isFirstMapLoad,
    themeMode,
  ]);

  // re-bold the routes whenever the highlighted photo changes (after first load)
  useEffect(() => {
    if (!map) return;
    (map.getSource('climbing') as GeoJSONSource | undefined)?.setData({
      type: 'FeatureCollection' as const,
      features: transformMemberFeaturesToGeojson(
        feature.memberFeatures,
        themeMode,
        highlightedPhoto,
      ),
    });
  }, [map, feature.memberFeatures, themeMode, highlightedPhoto]);

  return { containerRef, isMapLoaded, mapRef };
};

export const transformMemberFeaturesToGeojson = (
  features,
  mode: 'light' | 'dark' = 'light',
  highlightedPhoto: string | null = null,
) => {
  return features.map((feature) => {
    const difficulty = getDifficulty(feature.tags);
    return {
      ...feature,
      properties: {
        ...feature.properties,
        name: feature.tags.name,
        grade: difficulty?.grade ?? feature.tags['climbing:grade:uiaa'] ?? '',
        color: getDifficultyColor(difficulty, mode),
        bold: isRouteDrawnOnPhoto(feature.tags, highlightedPhoto),
      },
      geometry:
        feature.osmMeta.type === 'node'
          ? { coordinates: feature.center, type: 'Point' }
          : undefined,
    };
  });
};

const CragMap = ({ setIsMapVisible }: Props) => {
  const { containerRef, isMapLoaded } = useInitMap({ setIsMapVisible });

  return (
    <Container>
      {!isMapLoaded && (
        <LoadingContainer>
          <CircularProgress color="primary" />
        </LoadingContainer>
      )}
      <Map $isVisible={isMapLoaded} ref={containerRef} />
    </Container>
  );
};

export default CragMap; // dynamic import
