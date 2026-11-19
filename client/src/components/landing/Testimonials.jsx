import { Quote, Star } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Reveal from '../ui/Reveal';

const stories = [
  {
    quote:
      'I stopped filtering for people exactly like me. CoFoundr surfaced a commercial partner who covered everything I was bad at, and the reasons were specific enough to trust.',
    name: 'Alex Morgan',
    role: 'Technical founder · Nexa',
    tags: ['AI', 'SaaS'],
  },
  {
    quote:
      'The availability and working-style factors mattered more than I expected. We both wanted remote, part-time, and a balanced risk appetite — that saved months of mismatched expectations.',
    name: 'Sofia Martinez',
    role: 'Growth lead · independent',
    tags: ['FinTech', 'E-commerce'],
  },
  {
    quote:
      'Applying to a startup as a designer felt structured for once. I could see the team, the problem, and the required skills before sending a note.',
    name: 'Daniel Kim',
    role: 'Product designer · MediSync',
    tags: ['HealthTech', 'Design'],
  },
];

export default function Testimonials() {
  return (
    <section id="stories" className="section landing-section stories-section">
      <div className="container">
        <Reveal className="section-head">
          <span className="section-eyebrow">Founder stories</span>
          <h2>Fewer cold intros. More real conversations.</h2>
          <p>
            Built for founders who care about substance over surface-level networking.
          </p>
        </Reveal>

        <div className="story-grid">
          {stories.map((story, index) => (
            <Reveal key={story.name} delay={index * 0.07}>
              <article className="story-card">
                <Quote className="story-quote-icon" size={26} />
                <span className="story-stars">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star key={star} size={14} fill="currentColor" />
                  ))}
                </span>
                <blockquote>{story.quote}</blockquote>
                <footer className="story-author">
                  <Avatar user={{ name: story.name }} size={40} />
                  <div>
                    <strong>{story.name}</strong>
                    <span>{story.role}</span>
                  </div>
                </footer>
                <div className="tag-row">
                  {story.tags.map((tag) => (
                    <span key={tag} className="mini-tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
