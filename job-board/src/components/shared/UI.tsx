import React from 'react';

// ── Button ────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props
}) => (
  <button
    className={`btn btn-${variant} btn-${size} ${loading ? 'btn-loading' : ''} ${className}`}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <span className="spinner" /> : children}
  </button>
);

// ── Input ─────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}
export const Input: React.FC<InputProps> = ({ label, error, hint, id, className = '', ...props }) => (
  <div className={`field ${className}`}>
    {label && <label htmlFor={id} className="field-label">{label}</label>}
    <input id={id} className={`field-input ${error ? 'field-input--error' : ''}`} {...props} />
    {error && <span className="field-error" role="alert">{error}</span>}
    {hint && !error && <span className="field-hint">{hint}</span>}
  </div>
);

// ── Textarea ──────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}
export const Textarea: React.FC<TextareaProps> = ({ label, error, id, ...props }) => (
  <div className="field">
    {label && <label htmlFor={id} className="field-label">{label}</label>}
    <textarea id={id} className={`field-input field-textarea ${error ? 'field-input--error' : ''}`} {...props} />
    {error && <span className="field-error" role="alert">{error}</span>}
  </div>
);

// ── Select ────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}
export const Select: React.FC<SelectProps> = ({ label, error, id, options, ...props }) => (
  <div className="field">
    {label && <label htmlFor={id} className="field-label">{label}</label>}
    <select id={id} className={`field-input field-select ${error ? 'field-input--error' : ''}`} {...props}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <span className="field-error" role="alert">{error}</span>}
  </div>
);

// ── Badge ─────────────────────────────────────────────────────────
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
export const Badge: React.FC<{ children: React.ReactNode; variant?: BadgeVariant; 'data-testid'?: string }> = ({
  children, variant = 'default', ...props
}) => <span className={`badge badge-${variant}`} {...props}>{children}</span>;

// ── Card ──────────────────────────────────────────────────────────
export const Card: React.FC<{ children: React.ReactNode; className?: string; onClick?: () => void; 'data-testid'?: string }> = ({
  children, className = '', onClick, ...props
}) => (
  <div className={`card ${onClick ? 'card--clickable' : ''} ${className}`} onClick={onClick} {...props}>
    {children}
  </div>
);

// ── Modal ─────────────────────────────────────────────────────────
interface ModalProps { title: string; onClose: () => void; children: React.ReactNode; 'data-testid'?: string }
export const Modal: React.FC<ModalProps> = ({ title, onClose, children, ...props }) => (
  <div className="modal-overlay" data-testid="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={title} {...props}>
      <div className="modal-header">
        <h2 className="modal-title">{title}</h2>
        <button onClick={onClose} className="modal-close" aria-label="Close dialog" data-testid="modal-close">✕</button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

// ── Status badge helper ───────────────────────────────────────────
const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  pending: 'warning', reviewed: 'info', interview: 'purple',
  offered: 'success', rejected: 'danger', open: 'success', closed: 'default',
};
export const StatusBadge: React.FC<{ status: string; 'data-testid'?: string }> = ({ status, ...props }) => (
  <Badge variant={STATUS_VARIANTS[status] ?? 'default'} {...props}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </Badge>
);

// ── Empty state ───────────────────────────────────────────────────
export const EmptyState: React.FC<{ icon?: string; title: string; description: string; action?: React.ReactNode; 'data-testid'?: string }> = ({
  icon = '📭', title, description, action, ...props
}) => (
  <div className="empty-state" {...props}>
    <div className="empty-icon">{icon}</div>
    <h3 className="empty-title">{title}</h3>
    <p className="empty-desc">{description}</p>
    {action}
  </div>
);

// ── Toast ─────────────────────────────────────────────────────────
export interface ToastData { id: string; message: string; type: 'success' | 'error' | 'info' }
export const ToastContainer: React.FC<{ toasts: ToastData[]; onDismiss: (id: string) => void }> = ({ toasts, onDismiss }) => (
  <div className="toast-container" data-testid="toast-container" aria-live="polite">
    {toasts.map(t => (
      <div key={t.id} className={`toast toast-${t.type}`} data-testid="toast" role="alert">
        <span data-testid="toast-message">{t.message}</span>
        <button onClick={() => onDismiss(t.id)} aria-label="Dismiss" data-testid="toast-dismiss">✕</button>
      </div>
    ))}
  </div>
);
