import { Link } from 'react-router-dom';
import { Bookmark } from 'lucide-react';
import Avatar from './Avatar';
import Badge from './Badge';
import ScoreRing from './ScoreRing';
import { CATEGORY_ICONS } from '../../utils/constants';
import { formatDate, timeAgo, truncate } from '../../utils/formatters';

export default function FounderCard({
  founder,
  match,
  onConnect,
  onSave,
  saving = false,
  compact = false,
}) {
  const profile = founder || match?.user;
  if (!profile) return null;

  const score = match?.compatibilityScore ?? founder?.compatibility?.compatibilityScore;
  const reasons = match?.matchingReasons || founder?.compatibility?.matchingReasons || [];
  const skills = [
    ...(profile.skills?.technical || []).slice(0, 3),
    ...(profile.skills?.business || []).slice(0, 2),
  ];

  return (
    <article className={`card founder-card ${compact ? 'founder-card-compact' : ''}`}>
      <div className="founder-card-top">
        <Avatar user={profile} size={compact ? 46 : 54} />
        <div className="founder-card-identity">
          <h3>
            <Link to={`/profile/${profile._id}`}>{profile.name}</Link>
          </h3>
          <p className="founder-card-meta">
            {profile.category ? `${CATEGORY_ICONS[profile.category] || ''} ${profile.category}` : 'Founder'}
            {profile.location ? ` · ${profile.location}` : ''}
          </p>
        </div>
        {score !== undefined ? <ScoreRing score={score} size={compact ? 52 : 60} stroke={6} /> : null}
      </div>

      {profile.bio ? <p className="founder-card-bio">{truncate(profile.bio, compact ? 110 : 150)}</p> : null}

      <div className="tag-row">
        {skills.map((skill) => (
          <Badge key={skill} tone="soft" size="sm">
            {skill}
          </Badge>
        ))}
        {profile.availability ? (
          <Badge tone="violet" size="sm">
            {profile.availability}
          </Badge>
        ) : null}
        {profile.experienceLevel ? (
          <Badge tone="neutral" size="sm">
            {profile.experienceLevel}
          </Badge>
        ) : null}
      </div>

      {reasons.length ? (
        <ul className="reason-list">
          {reasons.slice(0, compact ? 1 : 2).map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}

      <div className="founder-card-footer">
        <span className="founder-card-updated">
          {profile.createdAt ? `Joined ${formatDate(profile.createdAt, { month: 'short', year: 'numeric' })}` : timeAgo(profile.updatedAt)}
        </span>
        <div className="founder-card-actions">
          {onSave ? (
            <button
              type="button"
              className={`icon-btn save-btn ${profile.isSaved ? 'is-saved' : ''}`}
              onClick={() => onSave(profile)}
              disabled={saving}
              aria-label={profile.isSaved ? 'Remove from saved' : 'Save profile'}
              aria-pressed={profile.isSaved}
            >
              <Bookmark size={16} fill={profile.isSaved ? 'currentColor' : 'none'} />
            </button>
          ) : null}
          {onConnect ? (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => onConnect(profile)}
            >
              {profile.connection?.status === 'pending'
                ? 'Pending'
                : profile.connection?.status === 'accepted'
                ? 'Connected'
                : 'Connect'}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
