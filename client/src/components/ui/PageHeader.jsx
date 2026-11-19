import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  actionLabel,
  actionTo,
  actionIcon: ActionIcon = ArrowRight,
  children,
}) {
  return (
    <header className="page-header">
      <div className="page-header-main">
        {eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
        {children}
      </div>
      {actions || (actionLabel && actionTo) ? (
        <div className="page-header-actions">
          {actions}
          {actionLabel && actionTo ? (
            <Link className="btn btn-primary btn-md" to={actionTo}>
              <span>{actionLabel}</span>
              <ActionIcon size={17} />
            </Link>
          ) : null}
        </div>
      ) : null}
    </header>
  );
}
