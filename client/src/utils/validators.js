export function validateEmail(value) {
  if (!value) return 'Email is required';
  if (!/^\S+@\S+\.\S+$/.test(value)) return 'Enter a valid email address';
  return '';
}

export function validatePassword(value) {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  return '';
}

export function validateName(value) {
  if (!value || !value.trim()) return 'Full name is required';
  if (value.trim().length < 2) return 'Name must be at least 2 characters';
  return '';
}

export function validateRequired(value, label = 'This field') {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${label} is required`;
  }
  return '';
}

export function validateUrl(value) {
  if (!value) return '';
  try {
    new URL(value.startsWith('http') ? value : `https://${value}`);
    return '';
  } catch {
    return 'Enter a valid URL';
  }
}

export function firstError(errors) {
  const values = Object.values(errors || {});
  return values.length ? values[0] : '';
}
