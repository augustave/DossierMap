const SUBSTRATE_SWATCHES = [
  ['Void', '--sub-void', '#0A0A0A'],
  ['Ink', '--sub-ink', '#151515'],
  ['Charcoal', '--sub-charcoal', '#1E1E1E'],
  ['Graphite', '--sub-graphite', '#2A2A2A'],
  ['Slate', '--sub-slate', '#333333'],
  ['Terrain', '--sub-terrain', '#5D685C'],
  ['Grey', '--sub-grey', '#8A8D8C'],
  ['Kraft', '--sub-kraft', '#A6927E'],
  ['Leather', '--sub-leather', '#7B5842'],
  ['Bone', '--sub-bone', '#D4CFC8'],
  ['Archival', '--sub-archival', '#F0F0F0'],
] as const;

const MARKER_SWATCHES = [
  ['Blue', '--mark-blue', '#0055D4'],
  ['Blue Lt', '--mark-blue-lt', '#29A5FF'],
  ['Orange', '--mark-orange', '#FF6600'],
  ['Pink', '--mark-pink', '#FF007F'],
  ['Yellow', '--mark-yellow', '#E5FF00'],
  ['Green', '--mark-green', '#00FF88'],
  ['Red', '--mark-red', '#FF2233'],
  ['Cyan', '--mark-cyan', '#00E5FF'],
  ['Violet', '--mark-violet', '#B84DFF'],
] as const;

const RAMP = [
  '#0A0A0A',
  '#1a0a2e',
  '#3b0764',
  '#7c2d8e',
  '#c2185b',
  '#FF007F',
  '#FF6600',
  '#E5FF00',
  '#FFFFFF',
];

export function TokensView() {
  return (
    <section className="tok-view">
      <div className="tok-hero">
        <h1>
          Visual
          <br />
          Operating
          <br />
          <span>Language</span>
        </h1>
        <p>
          Live reference for the DOSSIER VOL token system that powers the app shell, map chrome,
          status language, and map-overlay components.
        </p>
      </div>

      <div className="tok-sect">
        <div className="tok-sect-head">
          <span className="tok-num">(1)</span>
          <span className="tok-title">Substrate Palette</span>
        </div>
        <div className="sw-grid">
          {SUBSTRATE_SWATCHES.map(([name, variable, hex]) => (
            <article className="sw" key={variable}>
              <div className="sw-color" style={{ background: hex }} />
              <div className="sw-info">
                <div className="sw-name">{name}</div>
                <div className="sw-var">{variable}</div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="tok-sect">
        <div className="tok-sect-head">
          <span className="tok-num">(1.1)</span>
          <span className="tok-title">Tactical Markers</span>
        </div>
        <div className="sw-grid">
          {MARKER_SWATCHES.map(([name, variable, hex]) => (
            <article className="sw" key={variable}>
              <div className="sw-color" style={{ background: hex }} />
              <div className="sw-info">
                <div className="sw-name">{name}</div>
                <div className="sw-var">{variable}</div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="tok-sect">
        <div className="tok-sect-head">
          <span className="tok-num">(1.2)</span>
          <span className="tok-title">Heatmap Ramp</span>
        </div>
        <div className="ramp">
          {RAMP.map((color) => (
            <div className="ramp-seg" key={color} style={{ background: color }} />
          ))}
        </div>
      </div>

      <div className="tok-grid">
        <div className="tok-sect">
          <div className="tok-sect-head">
            <span className="tok-num">(2)</span>
            <span className="tok-title">Typography</span>
          </div>
          <div className="type-spec">
            <div className="type-spec-label">
              <span>Display — DM Sans</span>
              <span>--type-display</span>
            </div>
            <div className="ts-hero">GEOINT</div>
            <div className="ts-display">Feature Collection — Tactical Surface</div>
          </div>
          <div className="type-spec">
            <div className="type-spec-label">
              <span>Data — JetBrains Mono</span>
              <span>--type-mono</span>
            </div>
            <div className="ts-mono">
              {`{
  "type": "FeatureCollection",
  "features": [{ "geometry": { "type": "Point" } }]
}

LAT: 40.735291 | LNG: -73.955108`}
            </div>
          </div>
        </div>

        <div className="tok-sect">
          <div className="tok-sect-head">
            <span className="tok-num">(3)</span>
            <span className="tok-title">Status System</span>
          </div>
          <div className="comp-row">
            <span className="badge b-crit">Critical</span>
            <span className="badge b-warn">Warning</span>
            <span className="badge b-nom">Nominal</span>
            <span className="badge b-info">Info</span>
            <span className="badge b-act">Active</span>
            <span className="badge b-inert">Inert</span>
          </div>
          <div className="comp-row">
            <div className="alert-demo a-crit">
              <span className="a-dot" />
              Invalid GeoJSON payload rejected
            </div>
            <div className="alert-demo a-nom">
              <span className="a-dot" />
              FeatureCollection normalized and loaded
            </div>
          </div>
        </div>

        <div className="tok-sect">
          <div className="tok-sect-head">
            <span className="tok-num">(4)</span>
            <span className="tok-title">Cards</span>
          </div>
          <div className="comp-row">
            <div className="cd">
              <div className="cd-head">Total Features</div>
              <div className="cd-val" style={{ color: 'var(--mark-yellow)' }}>
                128
              </div>
              <div className="cd-foot">FeatureCollection • WGS 84</div>
            </div>
            <div className="cd">
              <div className="cd-head">Polygons</div>
              <div className="cd-val" style={{ color: 'var(--mark-orange)' }}>
                12
              </div>
              <div className="cd-foot">Zones and coverage areas</div>
            </div>
          </div>
        </div>

        <div className="tok-sect">
          <div className="tok-sect-head">
            <span className="tok-num">(5)</span>
            <span className="tok-title">Data Table</span>
          </div>
          <table className="dtable">
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Geometry</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>feature-1</td>
                <td>Pathway</td>
                <td>LineString</td>
                <td>
                  <span className="badge b-nom">Ready</span>
                </td>
              </tr>
              <tr>
                <td>feature-2</td>
                <td>Zone</td>
                <td>Polygon</td>
                <td>
                  <span className="badge b-info">Preview</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
