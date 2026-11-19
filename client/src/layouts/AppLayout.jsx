import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useSocket } from '../context/SocketContext';

const navigation = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/discover', label: 'Discover', icon: Compass },
  { to: '/matches', label: 'AI Matches', icon: Sparkles },
  { to: '/startups', label: 'Startups', icon: BriefcaseBusiness },
  { to: '/connections', label: 'Connections', icon: Users },
  { to: '/chat', label: 'Messages', icon: MessageCircle },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { onlineUsers } = useSocket();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onClick = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <button
        type="button"
        className="mobile-scrim"
        data-open={menuOpen}
        aria-label="Close navigation"
        onClick={() => setMenuOpen(false)}
      />
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/dashboard" className="brand">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
            </span>
            <span className="brand-text">
              CoFoundr <em>AI</em>
            </span>
          </Link>
          <button
            type="button"
            className="icon-btn sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
            >
              <item.icon size={19} />
              <span>{item.label}</span>
              {item.to === '/notifications' && unreadCount > 0 ? (
                <span className="nav-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
              ) : null}
              {item.to === '/chat' && onlineUsers.size > 0 ? (
                <span className="nav-dot" aria-label={`${onlineUsers.size} people online`} />
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-section">
          <span className="sidebar-label">Account</span>
          <NavLink
            to={user ? `/profile/${user._id}` : '/profile'}
            className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
          >
            <UserRound size={19} />
            <span>My Profile</span>
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
          >
            <Settings size={19} />
            <span>Settings</span>
          </NavLink>
          {user?.role === 'admin' ? (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
            >
              <ShieldCheck size={19} />
              <span>Admin</span>
            </NavLink>
          ) : null}
        </div>

        <div className="sidebar-promo">
          <span className="sidebar-promo-icon">
            <Sparkles size={18} />
          </span>
          <strong>Sharper matches start with details</strong>
          <p>Keep your goals and skills current so AI can surface the right people.</p>
          <Link to="/onboarding" className="text-link">
            Review profile →
          </Link>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-btn mobile-menu-btn"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
            <div className="topbar-greeting">
              <span>Welcome back</span>
              <strong>{user?.name?.split(' ')[0] || 'Founder'}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <Link to="/notifications" className="icon-btn topbar-icon" aria-label="Notifications">
              <Bell size={19} />
              {unreadCount > 0 ? <span className="notification-dot" /> : null}
            </Link>

            <div className="user-menu" ref={userMenuRef}>
              <button
                type="button"
                className="user-menu-trigger"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-expanded={userMenuOpen}
              >
                <Avatar user={user} size={36} />
                <span className="user-menu-name">
                  {user?.name}
                  <small>{user?.category || (user?.role === 'admin' ? 'Administrator' : 'Founder')}</small>
                </span>
                <ChevronDown size={16} className={userMenuOpen ? 'rotate' : ''} />
              </button>

              {userMenuOpen ? (
                <div className="dropdown user-dropdown">
                  <div className="dropdown-head">
                    <Avatar user={user} size={40} />
                    <div>
                      <strong>{user?.name}</strong>
                      <span>{user?.email}</span>
                    </div>
                  </div>
                  <Link to={user ? `/profile/${user._id}` : '/profile'} className="dropdown-item">
                    <UserRound size={16} /> View profile
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    <Settings size={16} /> Settings
                  </Link>
                  {user?.role === 'admin' ? (
                    <Link to="/admin" className="dropdown-item">
                      <ShieldCheck size={16} /> Admin panel
                    </Link>
                  ) : null}
                  <button type="button" className="dropdown-item danger" onClick={handleLogout}>
                    <LogOut size={16} /> Log out
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="app-content">
          {user && !user.onboardingCompleted && location.pathname !== '/onboarding' ? (
            <div className="inline-banner">
              <span>
                <Badge tone="violet">Almost there</Badge> Finish onboarding to unlock AI matches.
              </span>
              <Link to="/onboarding" className="text-link">
                Complete profile →
              </Link>
            </div>
          ) : null}
          <Outlet />
        </main>

        <footer className="app-footer">
          <span>© {new Date().getFullYear()} CoFoundr AI</span>
          <span>Built for founders who build together.</span>
        </footer>
      </div>
    </div>
  );
}
