export default function ChipSelect({
  label,
  options,
  value = [],
  onChange,
  max = 12,
  hint,
  error,
}) {
  const toggle = (option) => {
    if (value.includes(option)) {
      onChange(value.filter((item) => item !== option));
    } else if (value.length < max) {
      onChange([...value, option]);
    }
  };

  return (
    <div className={`chip-field ${error ? 'has-error' : ''}`}>
      {label ? (
        <div className="chip-field-head">
          <span className="field-label">{label}</span>
          <span className="chip-count">
            {value.length}/{max} selected
          </span>
        </div>
      ) : null}
      <div className="chip-list" role="group" aria-label={label}>
        {options.map((option) => {
          const active = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              className={`chip ${active ? 'is-active' : ''}`}
              onClick={() => toggle(option)}
              aria-pressed={active}
              disabled={!active && value.length >= max}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
