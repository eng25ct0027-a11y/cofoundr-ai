import { forwardRef } from 'react';

const Spinner = ({ size = 16 }) => (
  <span
    className="spinner"
    style={{ width: size, height: size }}
    aria-hidden="true"
  />
);

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    icon: Icon,
    iconRight: IconRight,
    fullWidth = false,
    className = '',
    type = 'button',
    disabled,
    ...rest
  },
  ref
) {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth ? 'btn-full' : '',
    loading ? 'is-loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Spinner size={size === 'sm' ? 14 : 16} /> : Icon ? <Icon size={size === 'sm' ? 15 : 17} /> : null}
      <span>{children}</span>
      {IconRight && !loading ? <IconRight size={size === 'sm' ? 15 : 17} /> : null}
    </button>
  );
});

export default Button;
