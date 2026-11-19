export default function ScoreRing({ score = 0, size = 88, stroke = 8, label }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const tone = score >= 85 ? 'excellent' : score >= 70 ? 'great' : score >= 50 ? 'good' : 'low';

  return (
    <span
      className={`score-ring tone-${tone}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${score}% compatible`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          className="score-ring-track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          className="score-ring-progress"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <span className="score-ring-value">
        <strong>{Math.round(score)}%</strong>
        {label ? <small>{label}</small> : null}
      </span>
    </span>
  );
}
