import { Link, Outlet } from 'react-router-dom';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function AuthLayout({ title, subtitle }) {
  return (
    <div className="auth-shell">
      <aside className="auth-aside">
        <Link to="/" className="brand brand-light">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="brand-text">
            CoFoundr <em>AI</em>
          </span>
        </Link>
        <div className="auth-aside-copy">
          <span className="auth-pill">
            <Sparkles size={14} /> Intelligent founder matching
          </span>
          <h1>Find the person who makes your idea inevitable.</h1>
          <p>
            CoFoundr AI pairs your skills, goals, and working style with founders who fill
            the gaps — so you can stop searching and start building.
          </p>
          <ul className="auth-points">
            <li>
              <CheckCircle2 size={17} /> Weighted compatibility across 7 real signals
            </li>
            <li>
              <CheckCircle2 size={17} /> Explanations you can actually understand
            </li>
            <li>
              <CheckCircle2 size={17} /> Direct messaging with accepted connections
            </li>
          </ul>
        </div>
        <p className="auth-aside-foot">Build something extraordinary.</p>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <div className="auth-card-head">
            <h2>{title}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <Outlet />
        </div>
        <p className="auth-main-foot">
          By continuing you agree to our community guidelines. Be honest, be kind, build well.
        </p>
      </main>
    </div>
  );
}
