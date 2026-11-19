import { Link } from 'react-router-dom';
import { ArrowLeft, Compass, Home } from 'lucide-react';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');

  return (
    <div className="notfound-shell">
      <div className="notfound-card">
        <span className="notfound-code">404</span>
        <h1>This page does not exist</h1>
        <p>
          The link may be broken, or the page may have moved. Let’s get you back to building.
        </p>
        <div className="notfound-actions">
          <Link to="/" className="btn btn-primary btn-md">
            <Home size={16} /> Back home
          </Link>
          <Link to="/dashboard" className="btn btn-secondary btn-md">
            <Compass size={16} /> Open dashboard
          </Link>
        </div>
        <Link to="/discover" className="text-link">
          <ArrowLeft size={14} /> Or discover founders instead
        </Link>
      </div>
    </div>
  );
}
