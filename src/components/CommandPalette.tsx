import { useEffect, useState } from 'react';

export type CommandItem = {
  id: string;
  name: string;
  description: string;
  keyHint: string;
  action: () => void;
};

type CommandPaletteProps = {
  commands: CommandItem[];
  open: boolean;
  onClose: () => void;
};

export function CommandPalette({ commands, open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  const matches = commands.filter((command) => {
    const haystack = `${command.name} ${command.description}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const runCommand = (command: CommandItem) => {
    command.action();
    onClose();
  };

  return (
    <div className="cmd-overlay" onClick={onClose} role="presentation">
      <div
        aria-modal="true"
        className="cmd-box"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="cmd-input-wrap">
          <span className="cmd-chevron">›</span>
          <input
            autoFocus
            className="cmd-input"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && matches[0]) {
                runCommand(matches[0]);
              }
            }}
            placeholder="Type a command..."
            value={query}
          />
        </div>
        <div className="cmd-list">
          {matches.length === 0 ? (
            <div className="cmd-empty">No commands match this query.</div>
          ) : (
            matches.map((command, index) => (
              <button
                className={`cmd-item ${index === 0 ? 'active' : ''}`}
                key={command.id}
                onClick={() => runCommand(command)}
                type="button"
              >
                <div className="cmd-item-icon">{command.keyHint}</div>
                <div className="cmd-item-text">
                  {command.name}
                  <span>{command.description}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
