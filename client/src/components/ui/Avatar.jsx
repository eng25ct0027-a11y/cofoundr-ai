import { initials } from '../../utils/formatters';

const COLORS = [
  'linear-gradient(135deg, #7657FF, #3978FF)',
  'linear-gradient(135deg, #0EA5E9, #22D3EE)',
  'linear-gradient(135deg, #F97316, #F43F5E)',
  'linear-gradient(135deg, #10B981, #34D399)',
  'linear-gradient(135deg, #8B5CF6, #EC4899)',
  'linear-gradient(135deg, #6366F1, #0EA5E9)',
];

function colorFor(name = '') {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ user, size = 44, className = '', showStatus = false, online = false }) {
  const name = user?.name || 'CoFoundr';
  const src = user?.profileImage;

  return (
    <span
      className={`avatar ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
    >
      {src ? (
        <img src={src} alt={name} loading="lazy" />
      ) : (
        <span className="avatar-fallback" style={{ background: colorFor(name) }}>
          {initials(name)}
        </span>
      )}
      {showStatus ? (
        <span className={`avatar-status ${online ? 'is-online' : ''}`} aria-hidden="true" />
      ) : null}
    </span>
  );
}
