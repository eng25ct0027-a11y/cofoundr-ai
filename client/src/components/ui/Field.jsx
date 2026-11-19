import { forwardRef, useId } from 'react';

const Field = forwardRef(function Field(
  {
    label,
    error,
    hint,
    icon: Icon,
    as = 'input',
    options = [],
    rows = 4,
    className = '',
    containerClassName = '',
    ...rest
  },
  ref
) {
  const id = useId();
  const inputId = rest.id || id;
  const Tag = as === 'textarea' ? 'textarea' : as === 'select' ? 'select' : 'input';

  return (
    <div className={`field ${error ? 'has-error' : ''} ${containerClassName}`}>
      {label ? (
        <label className="field-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <div className={`field-control ${Icon ? 'has-icon' : ''}`}>
        {Icon ? <Icon className="field-icon" size={17} /> : null}
        <Tag
          ref={ref}
          id={inputId}
          className={`field-input ${as === 'textarea' ? 'field-textarea' : ''} ${className}`}
          rows={as === 'textarea' ? rows : undefined}
          {...rest}
        >
          {as === 'select'
            ? options.map((option) =>
                typeof option === 'string' ? (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ) : (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                )
              )
            : null}
        </Tag>
      </div>
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
});

export default Field;
