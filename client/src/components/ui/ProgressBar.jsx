export default function ProgressBar({ value = 0, label, tone = 'primary', showValue = true }) {
  return (
    <div className={`progress ${tone ? `progress-${tone}` : ''}`}>
      {label || showValue ? (
        <div className="progress-head">
          {label ? <span>{label}</span> : <span />}
          {showValue ? <strong>{Math.round(value)}%</strong> : null}
        </div>
      ) : null}
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="progress-fill" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
    </div>
  );
}
