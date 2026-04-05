import type {
  Feature,
  FeatureCollection,
  GeoJsonObject,
  GeoJsonProperties,
  Geometry,
  Position,
} from 'geojson';
import type {
  Bounds2D,
  DossierCategory,
  ImportResult,
  NormalizedFeature,
  NormalizedFeatureCollection,
  RawGeoJsonFeature,
} from './types';

const SUPPORTED_GEOMETRIES = new Set([
  'Point',
  'LineString',
  'Polygon',
  'MultiPoint',
  'MultiLineString',
  'MultiPolygon',
]);

const CATEGORY_SYNONYMS: Record<DossierCategory, string[]> = {
  infrastructure: ['infrastructure', 'infra', 'base', 'node', 'site', 'asset', 'facility'],
  pathway: ['pathway', 'path', 'route', 'line', 'corridor', 'network', 'link', 'road'],
  organic: ['organic', 'cluster', 'bio', 'signal', 'density', 'swarm'],
  zone: ['zone', 'area', 'sector', 'region', 'boundary', 'district', 'cell'],
  uncategorized: ['uncategorized', 'unknown', 'other'],
};

export function parseGeoJsonText(text: string, datasetLabel = 'Uploaded GeoJSON'): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Failed to parse JSON.');
  }

  return normalizeGeoJsonObject(parsed, datasetLabel);
}

export function normalizeGeoJsonObject(
  input: unknown,
  datasetLabel = 'Uploaded GeoJSON',
): ImportResult {
  if (!input || typeof input !== 'object' || !('type' in input)) {
    throw new Error('Input must be a GeoJSON Feature or FeatureCollection.');
  }

  const geo = input as GeoJsonObject;
  const features = getInputFeatures(geo);
  const normalized = features.map((feature, index) => normalizeFeature(feature, index));

  return {
    datasetLabel,
    features: normalized,
    bounds: combineBounds(normalized.map((feature) => feature.bounds)),
  };
}

export function toFeatureCollection(
  features: NormalizedFeature[],
  includeMeta = false,
): NormalizedFeatureCollection {
  const collection: FeatureCollection<Geometry, GeoJsonProperties> = {
    type: 'FeatureCollection',
    features: features.map((feature) => ({
      type: 'Feature',
      id: feature.id,
      geometry: feature.geometry,
      properties: includeMeta
        ? {
            ...(feature.properties ?? {}),
            _featureId: feature.id,
            _category: feature.category,
          }
        : (feature.properties ?? {}),
    })),
  };

  return collection;
}

export function combineBounds(boundsList: Array<Bounds2D | null>): Bounds2D | null {
  const valid = boundsList.filter(Boolean) as Bounds2D[];
  if (valid.length === 0) {
    return null;
  }

  return valid.reduce<Bounds2D>(
    (acc, current) => [
      Math.min(acc[0], current[0]),
      Math.min(acc[1], current[1]),
      Math.max(acc[2], current[2]),
      Math.max(acc[3], current[3]),
    ],
    [...valid[0]] as Bounds2D,
  );
}

export function featureLabel(feature: NormalizedFeature): string {
  const properties = feature.properties ?? {};
  const candidates = [
    properties.name,
    properties.title,
    properties.label,
    properties.id,
    properties.identifier,
  ];

  const label = candidates.find((value) => typeof value === 'string' || typeof value === 'number');
  if (label !== undefined) {
    return String(label);
  }

  return `${feature.category.toUpperCase()}-${feature.id}`;
}

export function categoryColor(category: DossierCategory): string {
  switch (category) {
    case 'infrastructure':
      return '#F0F0F0';
    case 'pathway':
      return '#FF6600';
    case 'organic':
      return '#FF007F';
    case 'zone':
      return '#E5FF00';
    default:
      return '#8A8D8C';
  }
}

export function geometryLabel(geometry: Geometry): string {
  return geometry.type;
}

export function boundsToMapLibre(bounds: Bounds2D): [[number, number], [number, number]] {
  return [
    [bounds[0], bounds[1]],
    [bounds[2], bounds[3]],
  ];
}

function getInputFeatures(input: GeoJsonObject): RawGeoJsonFeature[] {
  if (input.type === 'FeatureCollection') {
    return (input as FeatureCollection<Geometry, GeoJsonProperties>).features as RawGeoJsonFeature[];
  }

  if (input.type === 'Feature') {
    return [input as RawGeoJsonFeature];
  }

  throw new Error('Only GeoJSON Feature and FeatureCollection inputs are supported.');
}

function normalizeFeature(feature: RawGeoJsonFeature, index: number): NormalizedFeature {
  if (!feature.geometry) {
    throw new Error(`Feature ${index + 1} is missing geometry.`);
  }

  if (!SUPPORTED_GEOMETRIES.has(feature.geometry.type)) {
    throw new Error(`Geometry ${feature.geometry.type} is not supported in v1.`);
  }

  return {
    id: feature.id ? String(feature.id) : `feature-${index + 1}`,
    geometry: feature.geometry,
    properties: feature.properties ?? {},
    category: deriveCategory(feature.properties ?? {}, feature.geometry.type),
    bounds: computeGeometryBounds(feature.geometry),
    visible: true,
  };
}

function deriveCategory(
  properties: GeoJsonProperties,
  geometryType: Geometry['type'],
): DossierCategory {
  const safeProperties = properties ?? {};
  const exactCategory = readCategoryCandidate(safeProperties.category);
  if (exactCategory) {
    return exactCategory;
  }

  const inferredType = readCategoryCandidate(safeProperties.type);
  if (inferredType) {
    return inferredType;
  }

  if (geometryType.includes('Polygon')) {
    return 'zone';
  }

  if (geometryType.includes('Line')) {
    return 'pathway';
  }

  return 'uncategorized';
}

function readCategoryCandidate(value: unknown): DossierCategory | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  const matchedEntry = Object.entries(CATEGORY_SYNONYMS).find(([, variants]) =>
    variants.some((variant) => normalized.includes(variant)),
  );

  return (matchedEntry?.[0] as DossierCategory | undefined) ?? null;
}

function computeGeometryBounds(geometry: Geometry): Bounds2D | null {
  const positions = collectGeometryCoordinates(geometry);
  if (positions.length === 0) {
    return null;
  }

  let minLng = Number.POSITIVE_INFINITY;
  let minLat = Number.POSITIVE_INFINITY;
  let maxLng = Number.NEGATIVE_INFINITY;
  let maxLat = Number.NEGATIVE_INFINITY;

  for (const [lng, lat] of positions) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  return [minLng, minLat, maxLng, maxLat];
}

function collectGeometryCoordinates(geometry: Geometry): Position[] {
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates];
    case 'LineString':
    case 'MultiPoint':
      return geometry.coordinates;
    case 'Polygon':
    case 'MultiLineString':
      return geometry.coordinates.flat();
    case 'MultiPolygon':
      return geometry.coordinates.flat(2);
    default:
      return [];
  }
}
