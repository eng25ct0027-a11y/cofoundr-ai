import { BrainCircuit, Compass, Handshake, MessageSquareText, UserRoundCheck } from 'lucide-react';
import Reveal from '../ui/Reveal';

const steps = [
  {
    icon: UserRoundCheck,
    title: 'Build your founder profile',
    body: 'Add your skills, interests, availability, working style, and what you want to build. The more honest the detail, the sharper the results.',
    detail: '2 minutes',
  },
  {
    icon: BrainCircuit,
    title: 'Let the engine score compatibility',
    body: 'Seven weighted factors are computed against every active founder — with complementary expertise carrying the most weight.',
    detail: 'Instant',
  },
  {
    icon: Compass,
    title: 'Discover and filter',
    body: 'Browse recommended founders, filter by skill, industry, location, or availability, and save the profiles worth a second look.',
    detail: 'Search + filters',
  },
  {
    icon: Handshake,
    title: 'Connect intentionally',
    body: 'Send a request, accept the ones that feel right, and keep a clean list of mutual connections. No unsolicited inbox noise.',
    detail: 'Mutual opt-in',
  },
  {
    icon: MessageSquareText,
    title: 'Start the conversation',
    body: 'Chat in real time once you are connected, or apply to a startup that is looking for exactly what you bring.',
    detail: 'Realtime chat',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section landing-section how-section">
      <div className="container">
        <Reveal className="section-head">
          <span className="section-eyebrow">The process</span>
          <h2>From profile to partnership in five deliberate steps</h2>
          <p>
            Designed to reduce noise and get you into a real conversation with someone
            who complements you.
          </p>
        </Reveal>

        <ol className="steps">
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 0.06} as="li">
              <div className="step">
                <div className="step-marker">
                  <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                  <span className="step-icon">
                    <step.icon size={20} />
                  </span>
                </div>
                <div className="step-body">
                  <div className="step-head">
                    <h3>{step.title}</h3>
                    <span className="step-detail">{step.detail}</span>
                  </div>
                  <p>{step.body}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
