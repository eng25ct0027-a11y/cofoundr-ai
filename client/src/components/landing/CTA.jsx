import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import Reveal from '../ui/Reveal';

export default function CTA() {
  return (
    <section className="section landing-section">
      <div className="container">
        <Reveal>
          <div className="cta-panel">
            <div className="cta-glow" aria-hidden="true" />
            <span className="cta-eyebrow">
              <Sparkles size={14} /> Ready when you are
            </span>
            <h2>Your co-founder is not going to appear in your inbox.</h2>
            <p>
              Create a profile, complete onboarding, and let the matching engine show you
              who complements you. Free to start.
            </p>
            <div className="cta-actions">
              <Link to="/register" className="btn btn-on-dark btn-lg">
                <span>Create your profile</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-outline-light btn-lg">
                Try the demo account
              </Link>
            </div>
            <p className="cta-hint">
              Demo credentials: <code>demo@cofoundr.ai</code> · <code>Password123!</code>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
