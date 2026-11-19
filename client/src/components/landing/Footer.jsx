import { Link } from 'react-router-dom';
import { BriefcaseBusiness, Code2, Mail, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="landing-footer">
      <div className="container landing-footer-grid">
        <div className="landing-footer-brand">
          <Link to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              <span />
              <span />
            </span>
            <span className="brand-text">
              CoFoundr <em>AI</em>
            </span>
          </Link>
          <p>
            Find your perfect co-founder. Build something extraordinary. Intelligent matching
            for founders at every stage.
          </p>
          <div className="landing-footer-social">
            <a href="mailto:hello@cofoundr.ai" aria-label="Email CoFoundr AI">
              <Mail size={17} />
            </a>
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="CoFoundr AI on GitHub"
            >
              <Code2 size={17} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="CoFoundr AI on LinkedIn"
            >
              <BriefcaseBusiness size={17} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer noopener"
              aria-label="CoFoundr AI on X"
            >
              <MessageCircle size={17} />
            </a>
          </div>
        </div>

        <div className="landing-footer-col">
          <h4>Product</h4>
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#matching">Matching engine</a>
          <Link to="/register">Create account</Link>
        </div>

        <div className="landing-footer-col">
          <h4>Account</h4>
          <Link to="/login">Log in</Link>
          <Link to="/register">Sign up</Link>
          <Link to="/forgot-password">Reset password</Link>
          <Link to="/onboarding">Complete profile</Link>
        </div>

        <div className="landing-footer-col">
          <h4>Community</h4>
          <a href="#stories">Founder stories</a>
          <Link to="/startups">Browse startups</Link>
          <Link to="/discover">Discover founders</Link>
          <a href="mailto:hello@cofoundr.ai">Contact us</a>
        </div>
      </div>

      <div className="container landing-footer-bottom">
        <span>© {new Date().getFullYear()} CoFoundr AI. All rights reserved.</span>
        <span>Built with React, Express, MongoDB, and a deterministic matching engine.</span>
      </div>
    </footer>
  );
}
