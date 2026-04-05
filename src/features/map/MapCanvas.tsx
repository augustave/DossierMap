import { useEffect, useRef } from 'react';
import maplibregl, { type GeoJSONSource, type Map } from 'maplibre-gl';
import type { FeatureCollection, GeoJsonProperties, Geometry } from 'geojson';
import { boundsToMapLibre } from './geojson';
import type { Bounds2D, LayerVisibility } from './types';

type MapCanvasProps = {
  data: FeatureCollection<Geometry, GeoJsonProperties>;
  selected: FeatureCollection<Geometry, GeoJsonProperties>;
  bounds: Bounds2D | null;
  layerVisibility: LayerVisibility;
  fitSignal: number;
  onFeatureSelect: (featureId: string | null) => void;
};

const FEATURE_SOURCE_ID = 'dossier-features';
const SELECTED_SOURCE_ID = 'dossier-selected';
const INTERACTIVE_LAYER_IDS = ['dossier-points', 'dossier-lines', 'dossier-area-fill'];

const colorExpression: any = [
  'match',
  ['get', '_category'],
  'infrastructure',
  '#F0F0F0',
  'pathway',
  '#FF6600',
  'organic',
  '#FF007F',
  'zone',
  '#E5FF00',
  '#8A8D8C',
];

export function MapCanvas({
  data,
  selected,
  bounds,
  layerVisibility,
  fitSignal,
  onFeatureSelect,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const readyRef = useRef(false);
  const lastFittedSignalRef = useRef(-1);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: [-73.965, 40.744],
      zoom: 11.2,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on('load', () => {
      readyRef.current = true;

      map.addSource(FEATURE_SOURCE_ID, {
        type: 'geojson',
        data,
      });

      map.addSource(SELECTED_SOURCE_ID, {
        type: 'geojson',
        data: selected,
      });

      map.addLayer({
        id: 'dossier-area-fill',
        type: 'fill',
        source: FEATURE_SOURCE_ID,
        filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
        paint: {
          'fill-color': colorExpression,
          'fill-opacity': 0.18,
        },
      });

      map.addLayer({
        id: 'dossier-area-outline',
        type: 'line',
        source: FEATURE_SOURCE_ID,
        filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
        paint: {
          'line-color': colorExpression,
          'line-opacity': 0.9,
          'line-width': 2,
        },
      });

      map.addLayer({
        id: 'dossier-lines',
        type: 'line',
        source: FEATURE_SOURCE_ID,
        filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
        paint: {
          'line-color': colorExpression,
          'line-width': 3,
          'line-opacity': 0.85,
        },
      });

      map.addLayer({
        id: 'dossier-points',
        type: 'circle',
        source: FEATURE_SOURCE_ID,
        filter: ['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]],
        paint: {
          'circle-color': colorExpression,
          'circle-radius': 6,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#0A0A0A',
        },
      });

      map.addLayer({
        id: 'dossier-selected-area',
        type: 'line',
        source: SELECTED_SOURCE_ID,
        filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
        paint: {
          'line-color': '#00E5FF',
          'line-width': 3,
          'line-dasharray': [2, 1],
        },
      });

      map.addLayer({
        id: 'dossier-selected-line',
        type: 'line',
        source: SELECTED_SOURCE_ID,
        filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
        paint: {
          'line-color': '#00E5FF',
          'line-width': 5,
        },
      });

      map.addLayer({
        id: 'dossier-selected-point',
        type: 'circle',
        source: SELECTED_SOURCE_ID,
        filter: ['in', ['geometry-type'], ['literal', ['Point', 'MultiPoint']]],
        paint: {
          'circle-color': '#00E5FF',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#0A0A0A',
        },
      });

      map.on('click', INTERACTIVE_LAYER_IDS, (event) => {
        const featureId = event.features?.[0]?.properties?._featureId;
        onFeatureSelect(typeof featureId === 'string' ? featureId : null);
      });

      map.on('click', (event) => {
        const features = map.queryRenderedFeatures(event.point, {
          layers: INTERACTIVE_LAYER_IDS,
        });

        if (features.length === 0) {
          onFeatureSelect(null);
        }
      });

      map.on('mouseenter', INTERACTIVE_LAYER_IDS, () => {
        map.getCanvas().style.cursor = 'crosshair';
      });

      map.on('mouseleave', INTERACTIVE_LAYER_IDS, () => {
        map.getCanvas().style.cursor = '';
      });
    });

    mapRef.current = map;

    return () => {
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, [data, onFeatureSelect, selected]);

  useEffect(() => {
    if (!readyRef.current || !mapRef.current) {
      return;
    }

    const source = mapRef.current.getSource(FEATURE_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(data);
  }, [data]);

  useEffect(() => {
    if (!readyRef.current || !mapRef.current) {
      return;
    }

    const source = mapRef.current.getSource(SELECTED_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData(selected);
  }, [selected]);

  useEffect(() => {
    if (!readyRef.current || !mapRef.current) {
      return;
    }

    const map = mapRef.current;
    const setVisibility = (layerId: string, visible: boolean) => {
      if (map.getLayer(layerId)) {
        map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
      }
    };

    setVisibility('dossier-points', layerVisibility.points);
    setVisibility('dossier-lines', layerVisibility.lines);
    setVisibility('dossier-area-fill', layerVisibility.areas);
    setVisibility('dossier-area-outline', layerVisibility.areas);
  }, [layerVisibility]);

  useEffect(() => {
    if (!readyRef.current || !mapRef.current || !bounds) {
      return;
    }

    if (fitSignal === lastFittedSignalRef.current) {
      return;
    }

    lastFittedSignalRef.current = fitSignal;
    mapRef.current.fitBounds(boundsToMapLibre(bounds), {
      padding: 72,
      duration: 700,
    });
  }, [bounds, fitSignal]);

  return <div className="map-canvas" ref={containerRef} />;
}
