import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How it works' },
    { href: '#matching', label: 'Matching' },
    { href: '#stories', label: 'Stories' },
  ];

  return (
    <header className={`landing-nav ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="landing-nav-inner">
        <Link to="/" className="brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="brand-text">
            CoFoundr <em>AI</em>
          </span>
        </Link>

        <nav className="landing-links" aria-label="Landing page">
          {links.map((link) => (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className="landing-nav-actions">
          {isAuthenticated ? (
            <button className="btn btn-primary btn-sm" type="button" onClick={() => navigate('/dashboard')}>
              Open dashboard
            </button>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Get started free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="icon-btn landing-menu-btn"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open ? (
        <div className="landing-mobile-menu">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="landing-mobile-actions">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary">
                Open dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
