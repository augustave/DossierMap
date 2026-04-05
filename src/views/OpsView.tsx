import type { DragEvent } from 'react';
import {
  categoryColor,
  featureLabel,
  geometryLabel,
  toFeatureCollection,
} from '../features/map/geojson';
import { MapCanvas } from '../features/map/MapCanvas';
import type {
  DossierCategory,
  LayerVisibility,
  NormalizedFeature,
} from '../features/map/types';

type OpsViewProps = {
  datasetLabel: string;
  allFeatures: NormalizedFeature[];
  visibleFeatures: NormalizedFeature[];
  selectedFeature: NormalizedFeature | null;
  filters: Record<DossierCategory, boolean>;
  layerVisibility: LayerVisibility;
  dragActive: boolean;
  fitSignal: number;
  visibleBounds: [number, number, number, number] | null;
  onFeatureSelect: (featureId: string | null) => void;
  onImportClick: () => void;
  onFileDrop: (files: FileList | null) => void;
  onToggleCategory: (category: DossierCategory) => void;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  onFitToData: () => void;
  onExport: () => void;
  onClearSelection: () => void;
};

const FILTER_ORDER: DossierCategory[] = [
  'infrastructure',
  'pathway',
  'organic',
  'zone',
  'uncategorized',
];

export function OpsView({
  datasetLabel,
  allFeatures,
  visibleFeatures,
  selectedFeature,
  filters,
  layerVisibility,
  dragActive,
  fitSignal,
  visibleBounds,
  onFeatureSelect,
  onImportClick,
  onFileDrop,
  onToggleCategory,
  onToggleLayer,
  onFitToData,
  onExport,
  onClearSelection,
}: OpsViewProps) {
  const visibleData = toFeatureCollection(visibleFeatures, true);
  const selectedData = toFeatureCollection(selectedFeature ? [selectedFeature] : [], true);
  const featureCount = visibleFeatures.length;
  const totalCount = allFeatures.length;
  const geometryCounts = {
    points: visibleFeatures.filter((feature) => feature.geometry.type.includes('Point')).length,
    lines: visibleFeatures.filter((feature) => feature.geometry.type.includes('Line')).length,
    areas: visibleFeatures.filter((feature) => feature.geometry.type.includes('Polygon')).length,
  };
  const categoryCounts = FILTER_ORDER.reduce<Record<DossierCategory, number>>(
    (acc, category) => {
      acc[category] = visibleFeatures.filter((feature) => feature.category === category).length;
      return acc;
    },
    {
      infrastructure: 0,
      pathway: 0,
      organic: 0,
      zone: 0,
      uncategorized: 0,
    },
  );
  const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);
  const intelFeed = visibleFeatures.slice(0, 8);
  const geoJsonPreview = JSON.stringify(toFeatureCollection(visibleFeatures.slice(0, 3)), null, 2);

  return (
    <section className="vp active">
      <div className="ops">
        <aside className="sb" aria-label="Derived feature feed">
          <div className="sb-head">
            <h2>Intel Feed</h2>
            <span className="sb-badge">{featureCount}</span>
          </div>
          <div className="sb-scroll">
            {intelFeed.length === 0 ? (
              <p className="empty-copy">Upload GeoJSON to generate a live dossier feed.</p>
            ) : (
              intelFeed.map((feature, index) => (
                <article className="ic" key={feature.id}>
                  <div className="ic-head">
                    <span className="ic-type">{feature.category.toUpperCase()}</span>
                    <span className="ic-time">{String(index + 1).padStart(2, '0')}</span>
                  </div>
                  <div className="ic-title">{featureLabel(feature)}</div>
                  <div className="ic-coord">{geometryLabel(feature.geometry)}</div>
                </article>
              ))
            )}
          </div>
        </aside>

        <main className="main">
          <div className="tb">
            <div className="tb-group">
              <button className="tb-btn" onClick={onImportClick} type="button">
                IMP
              </button>
              <button
                className={`tb-btn ${layerVisibility.points ? 'on' : ''}`}
                onClick={() => onToggleLayer('points')}
                type="button"
              >
                PNT
              </button>
              <button
                className={`tb-btn ${layerVisibility.lines ? 'on' : ''}`}
                onClick={() => onToggleLayer('lines')}
                type="button"
              >
                LIN
              </button>
              <button
                className={`tb-btn ${layerVisibility.areas ? 'on' : ''}`}
                onClick={() => onToggleLayer('areas')}
                type="button"
              >
                POL
              </button>
              <span className="tb-sep" />
              <button className="tb-btn" onClick={onFitToData} type="button">
                FIT
              </button>
              <button className="tb-btn" disabled={featureCount === 0} onClick={onExport} type="button">
                EXP
              </button>
            </div>
            <span className="tb-label">{datasetLabel}</span>
          </div>

          <div
            className={`canvas-wrap ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDrop={(event) => {
              event.preventDefault();
              onFileDrop(event.dataTransfer.files);
            }}
          >
            <div className="map-shell">
              <MapCanvas
                bounds={visibleBounds}
                data={visibleData}
                fitSignal={fitSignal}
                layerVisibility={layerVisibility}
                onFeatureSelect={onFeatureSelect}
                selected={selectedData}
              />
              <div className="coord-hud">
                <span>{featureCount} visible</span>
                <span>{totalCount} total</span>
              </div>
              <div className="canvas-stamp">GEOINT • DOSSIER VOL</div>
              {dragActive ? (
                <div className="drop-zone active">
                  <div className="drop-label">
                    Drop GeoJSON
                    <span>RFC 7946 Feature or FeatureCollection</span>
                  </div>
                </div>
              ) : null}
              {featureCount === 0 ? (
                <div className="empty-state">
                  <span className="badge b-act">Upload First</span>
                  <h3>Load a GeoJSON dossier onto the map.</h3>
                  <p>
                    Import a local <code>.geojson</code> or <code>.json</code> file to normalize
                    features, fit the map, drive filters, and enable export.
                  </p>
                  <button className="empty-cta" onClick={onImportClick} type="button">
                    Select GeoJSON
                  </button>
                </div>
              ) : null}
              {selectedFeature ? (
                <aside className="detail-panel open">
                  <div className="dp-head">
                    <h4>{featureLabel(selectedFeature)}</h4>
                    <button className="dp-close" onClick={onClearSelection} type="button">
                      ×
                    </button>
                  </div>
                  <div className="dp-body">
                    <div className="dp-row">
                      <span className="dp-row-k">Category</span>
                      <span className="dp-row-v">{selectedFeature.category}</span>
                    </div>
                    <div className="dp-row">
                      <span className="dp-row-k">Geometry</span>
                      <span className="dp-row-v">{selectedFeature.geometry.type}</span>
                    </div>
                    <div className="dp-row">
                      <span className="dp-row-k">Feature ID</span>
                      <span className="dp-row-v">{selectedFeature.id}</span>
                    </div>
                  </div>
                </aside>
              ) : null}
            </div>
          </div>

          <div className="legend-bar">
            {FILTER_ORDER.map((category) => (
              <button
                className={`lg-btn ${filters[category] ? '' : 'off'}`}
                key={category}
                onClick={() => onToggleCategory(category)}
                type="button"
              >
                <span className="ld" style={{ background: categoryColor(category) }} />
                {category}
              </button>
            ))}
          </div>
        </main>

        <aside className="sb sb-r" aria-label="Dataset analysis">
          <div className="pn">
            <div className="pn-head">
              <h3>Properties</h3>
              <span className="rfc-tag">RFC 7946</span>
            </div>
            <div className="sr">
              <span className="sr-l">Type</span>
              <span className="sr-v">FeatureCollection</span>
            </div>
            <div className="sr">
              <span className="sr-l">Dataset</span>
              <span className="sr-v bl">{datasetLabel}</span>
            </div>
            <div className="sr">
              <span className="sr-l">Visible</span>
              <span className="sr-v yl">{featureCount}</span>
            </div>
            <div className="sr">
              <span className="sr-l">Total</span>
              <span className="sr-v">{totalCount}</span>
            </div>
          </div>

          <div className="pn">
            <div className="pn-head">
              <h3>Density</h3>
            </div>
            <div className="db-group">
              {FILTER_ORDER.map((category) => (
                <div className="db-row" key={category}>
                  <span className="db-lbl">{category.slice(0, 5)}</span>
                  <div className="db-track">
                    <div
                      className="db-fill"
                      style={{
                        background: categoryColor(category),
                        width: `${(categoryCounts[category] / maxCategoryCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="db-val">{categoryCounts[category]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pn">
            <div className="pn-head">
              <h3>Coverage</h3>
            </div>
            <div className="gauge-row">
              <div className="cd">
                <div className="cd-head">Points</div>
                <div className="cd-val">{geometryCounts.points}</div>
                <div className="cd-foot">Point + MultiPoint</div>
              </div>
              <div className="cd">
                <div className="cd-head">Lines</div>
                <div className="cd-val">{geometryCounts.lines}</div>
                <div className="cd-foot">LineString families</div>
              </div>
              <div className="cd">
                <div className="cd-head">Areas</div>
                <div className="cd-val">{geometryCounts.areas}</div>
                <div className="cd-foot">Polygon families</div>
              </div>
            </div>
          </div>

          <div className="pn">
            <div className="pn-head">
              <h3>Selection</h3>
            </div>
            {selectedFeature ? (
              <div className="gj-block">
                <div className="dp-row">
                  <span className="dp-row-k">Label</span>
                  <span className="dp-row-v">{featureLabel(selectedFeature)}</span>
                </div>
                <div className="dp-row">
                  <span className="dp-row-k">Category</span>
                  <span className="dp-row-v">{selectedFeature.category}</span>
                </div>
                <div className="dp-row">
                  <span className="dp-row-k">Geometry</span>
                  <span className="dp-row-v">{selectedFeature.geometry.type}</span>
                </div>
              </div>
            ) : (
              <p className="empty-copy">Click a rendered feature to inspect it.</p>
            )}
          </div>

          <div className="pn grow">
            <div className="pn-head">
              <h3>GeoJSON Preview</h3>
            </div>
            <pre className="gj-block">{geoJsonPreview}</pre>
          </div>
        </aside>
      </div>
    </section>
  );
}

function handleDrag(event: DragEvent<HTMLDivElement>) {
  event.preventDefault();
}
