import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Sparkles, Star, TrendingUp } from 'lucide-react';
import Button from '../ui/Button';
import ScoreRing from '../ui/ScoreRing';
import Avatar from '../ui/Avatar';

const floatingProfiles = [
  {
    name: 'Priya Sharma',
    role: 'FinTech founder',
    score: 94,
    match: 'Technical + business fit',
    skills: ['Finance', 'Sales', 'Product'],
    style: { top: '4%', left: '2%' },
    delay: 0,
  },
  {
    name: 'Lucas Oliveira',
    role: 'ML engineer',
    score: 91,
    match: 'Complementary skills',
    skills: ['Python', 'AI/ML', 'Data'],
    style: { top: '44%', right: '0%' },
    delay: 0.15,
  },
];

function FloatCard({ profile }) {
  return (
    <motion.div
      className="hero-float-card"
      style={profile.style}
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.5 + profile.delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="hero-float-head">
        <Avatar user={{ name: profile.name }} size={42} />
        <div>
          <strong>{profile.name}</strong>
          <span>{profile.role}</span>
        </div>
        <ScoreRing score={profile.score} size={46} stroke={5} />
      </div>
      <p className="hero-float-note">
        <BadgeCheck size={14} /> {profile.match}
      </p>
      <div className="tag-row">
        {profile.skills.map((skill) => (
          <span key={skill} className="mini-tag">
            {skill}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-aurora" aria-hidden="true" />
      <div className="hero-grid">
        <div className="hero-copy">
          <motion.span
            className="hero-pill"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles size={15} /> AI-powered co-founder matching
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
          >
            Find Your Perfect Co-Founder.
            <span className="gradient-text">Build Something Extraordinary.</span>
          </motion.h1>

          <motion.p
            className="hero-lede"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
          >
            CoFoundr AI matches entrepreneurs, developers, designers, and marketers using a
            weighted compatibility engine — complementary skills, shared interests, startup
            goals, and how you actually like to work.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
          >
            <Link to="/register" className="btn btn-primary btn-lg">
              <span>Find your co-founder</span>
              <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-secondary btn-lg">
              Explore the demo
            </Link>
          </motion.div>

          <motion.div
            className="hero-proof"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.36 }}
          >
            <div className="avatar-stack" aria-hidden="true">
              {['Sofia Martinez', 'Daniel Kim', 'Amara Okafor', 'Rohan Patel'].map((name) => (
                <Avatar key={name} user={{ name }} size={32} />
              ))}
            </div>
            <div>
              <span className="hero-stars">
                {[0, 1, 2, 3, 4].map((index) => (
                  <Star key={index} size={14} fill="currentColor" />
                ))}
              </span>
              <p>Built for founders at every stage — idea to growth.</p>
            </div>
          </motion.div>

          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.44 }}
          >
            <div>
              <strong>7</strong>
              <span>weighted match signals</span>
            </div>
            <div>
              <strong>25%</strong>
              <span>weight on complementary skills</span>
            </div>
            <div>
              <strong>0</strong>
              <span>fake profiles tolerated</span>
            </div>
          </motion.div>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-orbit hero-orbit-one" />
          <div className="hero-orbit hero-orbit-two" />
          <motion.div
            className="hero-panel"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="hero-panel-head">
              <div>
                <span className="hero-panel-label">Compatibility snapshot</span>
                <strong>Alex Morgan × Priya Sharma</strong>
              </div>
              <span className="hero-panel-badge">
                <TrendingUp size={13} /> 94% fit
              </span>
            </div>

            <div className="hero-panel-body">
              <div className="hero-panel-score">
                <ScoreRing score={94} size={128} stroke={10} label="overall" />
              </div>
              <div className="hero-factor-list">
                {[
                  ['Complementary skills', 96],
                  ['Startup goals', 91],
                  ['Industry focus', 88],
                  ['Availability', 80],
                ].map(([label, value]) => (
                  <div key={label} className="hero-factor">
                    <div className="hero-factor-head">
                      <span>{label}</span>
                      <strong>{value}%</strong>
                    </div>
                    <span className="hero-factor-track">
                      <motion.span
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
                      />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <p className="hero-panel-reason">
              <BadgeCheck size={15} /> Technical depth pairs with commercial experience — you
              cover product and go-to-market together.
            </p>
          </motion.div>

          {floatingProfiles.map((profile) => (
            <FloatCard key={profile.name} profile={profile} />
          ))}
        </div>
      </div>
    </section>
  );
}
