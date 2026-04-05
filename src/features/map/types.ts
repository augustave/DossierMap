import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
} from 'geojson';

export const DOSSIER_CATEGORIES = [
  'infrastructure',
  'pathway',
  'organic',
  'zone',
  'uncategorized',
] as const;

export type DossierCategory = (typeof DOSSIER_CATEGORIES)[number];

export type ViewId = 'ops' | 'tokens';

export type Bounds2D = [number, number, number, number];

export type LayerVisibility = {
  points: boolean;
  lines: boolean;
  areas: boolean;
};

export type NormalizedFeature = {
  id: string;
  geometry: Geometry;
  properties: GeoJsonProperties;
  category: DossierCategory;
  bounds: Bounds2D | null;
  visible: boolean;
};

export type NormalizedFeatureCollection = FeatureCollection<Geometry, GeoJsonProperties>;

export type RawGeoJsonFeature = Feature<Geometry, GeoJsonProperties>;

export type ImportResult = {
  datasetLabel: string;
  features: NormalizedFeature[];
  bounds: Bounds2D | null;
};

export type ToastTone = 'info' | 'nominal' | 'warning' | 'critical';

export type ToastItem = {
  id: string;
  tone: ToastTone;
  title: string;
  message: string;
};
