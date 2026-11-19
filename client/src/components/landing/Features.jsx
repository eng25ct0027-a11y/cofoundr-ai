import {
  BrainCircuit,
  BriefcaseBusiness,
  CalendarClock,
  Compass,
  Gauge,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import Reveal from '../ui/Reveal';

const features = [
  {
    icon: BrainCircuit,
    title: 'Complementary by design',
    body: 'The engine rewards founders whose strengths fill your gaps — not people who look exactly like you.',
    tone: 'violet',
  },
  {
    icon: Target,
    title: 'Goals, not just keywords',
    body: 'Startup type, the problems you care about, and your long-term vision are compared semantically.',
    tone: 'blue',
  },
  {
    icon: Compass,
    title: 'Industry alignment',
    body: 'Shared markets and adjacent interests surface founders who already understand your customer.',
    tone: 'green',
  },
  {
    icon: CalendarClock,
    title: 'Availability that matches',
    body: 'Full-time, part-time, weekends, or flexible — you see people whose commitment fits yours.',
    tone: 'orange',
  },
  {
    icon: Gauge,
    title: 'Working style fit',
    body: 'Remote, hybrid, on-site, risk appetite, and experience balance all shape the final score.',
    tone: 'pink',
  },
  {
    icon: MessageCircle,
    title: 'Conversations that count',
    body: 'Match, request, accept, and chat in real time. Messaging unlocks only after a connection is accepted.',
    tone: 'cyan',
  },
];

const stats = [
  { icon: Users, value: '7', label: 'compatibility signals' },
  { icon: Sparkles, value: '25%', label: 'weight on complementary skills' },
  { icon: ShieldCheck, value: '100%', label: 'explainable match scores' },
  { icon: BriefcaseBusiness, value: '1', label: 'workspace for profile + startups' },
];

export default function Features() {
  return (
    <section id="features" className="section landing-section">
      <div className="container">
        <Reveal className="section-head">
          <span className="section-eyebrow">
            <Sparkles size={14} /> Why CoFoundr AI
          </span>
          <h2>Matching that understands how startups actually get built</h2>
          <p>
            No random swiping. No vanity metrics. Every score is computed from your profile
            and explained in plain language.
          </p>
        </Reveal>

        <div className="feature-grid">
          {features.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.05}>
              <article className={`feature-card feature-${feature.tone}`}>
                <span className="feature-icon">
                  <feature.icon size={22} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.body}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <Reveal className="landing-stats" delay={0.1}>
          {stats.map((stat) => (
            <div key={stat.label} className="landing-stat">
              <stat.icon size={18} />
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
