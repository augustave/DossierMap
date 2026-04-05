import type { ToastItem } from '../features/map/types';

type ToastViewportProps = {
  toasts: ToastItem[];
};

export function ToastViewport({ toasts }: ToastViewportProps) {
  return (
    <div aria-live="polite" className="toast-container">
      {toasts.map((toast) => (
        <article className={`toast t-${toast.tone === 'nominal' ? 'nom' : toast.tone}`} key={toast.id}>
          <span className="toast-dot" />
          <div className="toast-msg">
            <strong>{toast.title}</strong>
            {toast.message}
          </div>
        </article>
      ))}
    </div>
  );
}
