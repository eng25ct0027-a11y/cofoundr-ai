import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import Button from './Button';

export function EmptyState({ icon: Icon = Inbox, title, description, action, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon size={26} />
      </span>
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action || children}
    </div>
  );
}

export function ErrorState({ message, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="empty-state error-state">
      <span className="empty-icon error">
        <AlertCircle size={26} />
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
      {onRetry ? (
        <Button variant="secondary" icon={RefreshCw} onClick={() => onRetry()}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
