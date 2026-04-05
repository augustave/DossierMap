import { useEffect, useState } from 'react';
import type { ViewId } from '../features/map/types';

type TopStripProps = {
  activeView: ViewId;
  onViewChange: (view: ViewId) => void;
  onCommandOpen: () => void;
};

export function TopStrip({ activeView, onViewChange, onCommandOpen }: TopStripProps) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const updateClock = () => {
      setClock(new Date().toISOString().replace('T', ' ').slice(0, 19) + 'Z');
    };

    updateClock();
    const interval = window.setInterval(updateClock, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <header className="strip">
      <div className="strip-left">
        <span className="strip-logo">DOSSIER VOL</span>
        <nav className="strip-nav" aria-label="Primary">
          <button
            className={`strip-btn ${activeView === 'ops' ? 'active' : ''}`}
            onClick={() => onViewChange('ops')}
            type="button"
          >
            (1) Ops
          </button>
          <button
            className={`strip-btn ${activeView === 'tokens' ? 'active' : ''}`}
            onClick={() => onViewChange('tokens')}
            type="button"
          >
            (2) Tokens
          </button>
        </nav>
      </div>
      <div className="strip-right">
        <button className="strip-kbd" onClick={onCommandOpen} type="button" title="Command palette">
          ⌘K
        </button>
        <span className="strip-clock">{clock || '--'}</span>
      </div>
    </header>
  );
}
