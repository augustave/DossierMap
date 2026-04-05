import { useEffect, useRef, useState } from 'react';
import { CommandPalette, type CommandItem } from './components/CommandPalette';
import { TopStrip } from './components/TopStrip';
import { ToastViewport } from './components/ToastViewport';
import {
  combineBounds,
  parseGeoJsonText,
  toFeatureCollection,
} from './features/map/geojson';
import type {
  DossierCategory,
  LayerVisibility,
  NormalizedFeature,
  ToastItem,
  ViewId,
} from './features/map/types';
import { OpsView } from './views/OpsView';
import { TokensView } from './views/TokensView';

const DEFAULT_FILTERS: Record<DossierCategory, boolean> = {
  infrastructure: true,
  pathway: true,
  organic: true,
  zone: true,
  uncategorized: true,
};

const DEFAULT_LAYERS: LayerVisibility = {
  points: true,
  lines: true,
  areas: true,
};

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('ops');
  const [datasetLabel, setDatasetLabel] = useState('Awaiting GeoJSON');
  const [features, setFeatures] = useState<NormalizedFeature[]>([]);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [layerVisibility, setLayerVisibility] = useState(DEFAULT_LAYERS);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fitSignal, setFitSignal] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragCounterRef = useRef(0);

  const visibleFeatures = features.filter((feature) => filters[feature.category]);
  const visibleBounds = combineBounds(visibleFeatures.map((feature) => feature.bounds));
  const selectedFeature =
    visibleFeatures.find((feature) => feature.id === selectedFeatureId) ??
    features.find((feature) => feature.id === selectedFeatureId) ??
    null;

  useEffect(() => {
    if (selectedFeatureId && !visibleFeatures.some((feature) => feature.id === selectedFeatureId)) {
      setSelectedFeatureId(null);
    }
  }, [selectedFeatureId, visibleFeatures]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        Boolean(target?.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen(true);
        return;
      }

      if (commandOpen || isEditable) {
        return;
      }

      const key = event.key.toLowerCase();

      if (key === '1') {
        setActiveView('ops');
      }
      if (key === '2') {
        setActiveView('tokens');
      }
      if (activeView !== 'ops') {
        return;
      }
      if (key === 'g' && visibleBounds) {
        setFitSignal((current) => current + 1);
      }
      if (key === 'e' && visibleFeatures.length > 0) {
        exportVisibleFeatures(visibleFeatures, datasetLabel);
        pushToast('nominal', 'Export', `${visibleFeatures.length} visible features exported.`);
      }
      if (key === 'x') {
        setSelectedFeatureId(null);
      }
      if (key === 'p') {
        toggleLayer('points');
      }
      if (key === 'l') {
        toggleLayer('lines');
      }
      if (key === 'a') {
        toggleLayer('areas');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeView, commandOpen, datasetLabel, visibleBounds, visibleFeatures]);

  useEffect(() => {
    const handleDragEnter = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes('Files')) {
        return;
      }
      event.preventDefault();
      dragCounterRef.current += 1;
      setDragActive(true);
    };

    const handleDragLeave = (event: DragEvent) => {
      if (!event.dataTransfer?.types.includes('Files')) {
        return;
      }
      event.preventDefault();
      dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
      if (dragCounterRef.current === 0) {
        setDragActive(false);
      }
    };

    const handleDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) {
        event.preventDefault();
      }
    };

    const handleDrop = () => {
      dragCounterRef.current = 0;
      setDragActive(false);
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  const pushToast = (
    tone: ToastItem['tone'],
    title: string,
    message: string,
  ) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((current) => [...current, { id, tone, title, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4200);
  };

  const importFiles = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) {
      return;
    }

    try {
      const result = parseGeoJsonText(await file.text(), file.name);
      setDatasetLabel(result.datasetLabel);
      setFeatures(result.features);
      setFilters(DEFAULT_FILTERS);
      setLayerVisibility(DEFAULT_LAYERS);
      setSelectedFeatureId(null);
      setActiveView('ops');
      setFitSignal((current) => current + 1);

      pushToast(
        'nominal',
        'Import complete',
        `${result.features.length} features normalized from ${file.name}.`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'GeoJSON import failed.';
      pushToast('critical', 'Import failed', message);
    }
  };

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayerVisibility((current) => ({
      ...current,
      [layer]: !current[layer],
    }));
  };

  const handleExport = () => {
    if (visibleFeatures.length === 0) {
      pushToast('warning', 'Export skipped', 'No visible features to export.');
      return;
    }

    exportVisibleFeatures(visibleFeatures, datasetLabel);
    pushToast('nominal', 'Export', `${visibleFeatures.length} visible features exported.`);
  };

  const commands: CommandItem[] = [
    {
      id: 'view-ops',
      name: 'View: Operational',
      description: 'Switch to the primary map workflow.',
      keyHint: '1',
      action: () => setActiveView('ops'),
    },
    {
      id: 'view-tokens',
      name: 'View: Tokens',
      description: 'Open the live design system reference.',
      keyHint: '2',
      action: () => setActiveView('tokens'),
    },
    {
      id: 'toggle-points',
      name: 'Toggle Point Layers',
      description: 'Show or hide points and multipoints.',
      keyHint: 'P',
      action: () => toggleLayer('points'),
    },
    {
      id: 'toggle-lines',
      name: 'Toggle Line Layers',
      description: 'Show or hide lines and multilines.',
      keyHint: 'L',
      action: () => toggleLayer('lines'),
    },
    {
      id: 'toggle-areas',
      name: 'Toggle Area Layers',
      description: 'Show or hide polygons and multipolygons.',
      keyHint: 'A',
      action: () => toggleLayer('areas'),
    },
    {
      id: 'fit-data',
      name: 'Fit To Visible Data',
      description: 'Recenter and zoom the map to the active dataset.',
      keyHint: 'G',
      action: () => setFitSignal((current) => current + 1),
    },
    {
      id: 'clear-selection',
      name: 'Clear Selection',
      description: 'Dismiss the active feature detail panel.',
      keyHint: 'X',
      action: () => setSelectedFeatureId(null),
    },
    {
      id: 'export',
      name: 'Export Visible GeoJSON',
      description: 'Download the filtered working set.',
      keyHint: 'E',
      action: handleExport,
    },
  ];

  return (
    <div className="app-shell">
      <TopStrip
        activeView={activeView}
        onCommandOpen={() => setCommandOpen(true)}
        onViewChange={setActiveView}
      />
      <div className="view-root">
        {activeView === 'ops' ? (
          <OpsView
            allFeatures={features}
            datasetLabel={datasetLabel}
            dragActive={dragActive}
            filters={filters}
            fitSignal={fitSignal}
            layerVisibility={layerVisibility}
            onClearSelection={() => setSelectedFeatureId(null)}
            onExport={handleExport}
            onFeatureSelect={setSelectedFeatureId}
            onFileDrop={(fileList) => {
              setDragActive(false);
              void importFiles(fileList);
            }}
            onFitToData={() => setFitSignal((current) => current + 1)}
            onImportClick={() => fileInputRef.current?.click()}
            onToggleCategory={(category) =>
              setFilters((current) => ({
                ...current,
                [category]: !current[category],
              }))
            }
            onToggleLayer={toggleLayer}
            selectedFeature={selectedFeature}
            visibleBounds={visibleBounds}
            visibleFeatures={visibleFeatures}
          />
        ) : (
          <TokensView />
        )}
      </div>

      <input
        accept=".geojson,.json,application/geo+json,application/json"
        className="sr-only"
        onChange={(event) => {
          void importFiles(event.target.files);
          event.target.value = '';
        }}
        ref={fileInputRef}
        type="file"
      />

      <CommandPalette commands={commands} onClose={() => setCommandOpen(false)} open={commandOpen} />
      <ToastViewport toasts={toasts} />
    </div>
  );
}

function exportVisibleFeatures(features: NormalizedFeature[], datasetLabel: string) {
  const blob = new Blob([JSON.stringify(toFeatureCollection(features), null, 2)], {
    type: 'application/geo+json',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const safeLabel = datasetLabel.replace(/\.[a-z0-9]+$/i, '').replace(/\s+/g, '-').toLowerCase();
  anchor.href = url;
  anchor.download = `${safeLabel || 'dossier-export'}.geojson`;
  anchor.click();
  URL.revokeObjectURL(url);
}
