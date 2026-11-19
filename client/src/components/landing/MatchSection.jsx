import { CheckCircle2, Sparkles } from 'lucide-react';
import Reveal from '../ui/Reveal';
import { MATCH_FACTORS } from '../../utils/constants';

const sampleBreakdown = {
  complementarySkills: 96,
  sharedInterests: 72,
  startupGoals: 88,
  industry: 81,
  availability: 100,
  workingStyle: 85,
  experience: 80,
};

function weightedScore() {
  return Math.round(
    MATCH_FACTORS.reduce(
      (sum, factor) => sum + (sampleBreakdown[factor.key] / 100) * factor.weight,
      0
    ) / 100 * 100
  );
}

export default function MatchSection() {
  const total = weightedScore();

  return (
    <section id="matching" className="section landing-section match-section">
      <div className="container match-grid">
        <Reveal className="match-copy">
          <span className="section-eyebrow">
            <Sparkles size={14} /> The matching engine
          </span>
          <h2>Every score is calculated. Nothing is hand-waved.</h2>
          <p>
            CoFoundr AI uses a deterministic weighted model. Complementary skills carry the
            most weight because the strongest founding teams cover different ground — then
            goals, industry, and working style shape the rest.
          </p>

          <ul className="match-checklist">
            <li>
              <CheckCircle2 size={17} /> Breakdowns shown factor by factor
            </li>
            <li>
              <CheckCircle2 size={17} /> Plain-language reasons for every match
            </li>
            <li>
              <CheckCircle2 size={17} /> Optional LLM explanations — rules stay the source of truth
            </li>
          </ul>

          <div className="match-formula">
            <span className="match-formula-label">Weighted model</span>
            <code>
              score = Σ (factor × weight)
            </code>
          </div>
        </Reveal>

        <Reveal className="match-card" delay={0.1}>
          <div className="match-card-head">
            <div>
              <span className="match-card-label">Example breakdown</span>
              <h3>Technical founder × commercial founder</h3>
            </div>
            <span className="match-total">
              <strong>{total}%</strong>
              overall
            </span>
          </div>

          <div className="match-factor-table">
            {MATCH_FACTORS.map((factor) => {
              const value = sampleBreakdown[factor.key];
              const contribution = Math.round((value / 100) * factor.weight * 10) / 10;
              return (
                <div key={factor.key} className="match-factor-row">
                  <div className="match-factor-info">
                    <span>{factor.label}</span>
                    <small>{factor.weight}% weight</small>
                  </div>
                  <div className="match-factor-bar">
                    <span style={{ width: `${value}%` }} />
                  </div>
                  <div className="match-factor-values">
                    <strong>{value}</strong>
                    <small>+{contribution}</small>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="match-card-foot">
            Scores in the product are computed live from real profiles, not hardcoded. This
            table is an illustrative example.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
