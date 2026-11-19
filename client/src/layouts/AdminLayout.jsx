import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowLeft, FileWarning, LayoutDashboard, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: FileWarning },
];

export default function AdminLayout() {
  const { user } = useAuth();
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <Link to="/dashboard" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="brand-text">
            CoFoundr <em>AI</em>
          </span>
        </Link>
        <span className="admin-badge">
          <ShieldCheck size={15} /> Admin console
        </span>
        <div className="admin-topbar-right">
          <span className="admin-user">{user?.name}</span>
          <Link to="/dashboard" className="btn btn-secondary btn-sm">
            <ArrowLeft size={15} /> Back to app
          </Link>
        </div>
      </header>

      <div className="admin-body">
        <nav className="admin-nav" aria-label="Admin navigation">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}
            >
              <link.icon size={17} />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
