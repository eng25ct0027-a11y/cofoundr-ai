import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, KeyRound, Mail, MapPin, UserRound } from 'lucide-react';
import toast from 'react-hot-toast';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { CATEGORIES } from '../../utils/constants';
import { validateEmail, validateName, validatePassword } from '../../utils/validators';

export default function Register() {
  useDocumentTitle('Create account');
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: '',
    category: '',
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validate = () => {
    const next = {
      name: validateName(form.name),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
      confirmPassword:
        form.confirmPassword !== form.password ? 'Passwords do not match' : '',
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        location: form.location.trim(),
        category: form.category || undefined,
      });
      toast.success('Account created — let’s build your founder profile');
      navigate('/onboarding', { replace: true });
    } catch (error) {
      setErrors(error.errors || {});
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid-2">
        <Field
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Alex Morgan"
          icon={UserRound}
          value={form.name}
          onChange={update('name')}
          error={errors.name}
          required
        />
        <Field
          label="Location"
          name="location"
          autoComplete="address-level2"
          placeholder="City, Country"
          icon={MapPin}
          value={form.location}
          onChange={update('location')}
          error={errors.location}
        />
      </div>

      <Field
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        icon={Mail}
        value={form.email}
        onChange={update('email')}
        error={errors.email}
        required
      />

      <Field
        label="I am a…"
        as="select"
        name="category"
        value={form.category}
        onChange={update('category')}
        options={[{ value: '', label: 'Select a category (optional)' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
        error={errors.category}
      />

      <div className="form-grid-2">
        <Field
          label="Password"
          type={showPassword ? 'text' : 'password'}
          name="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          icon={KeyRound}
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          required
          hint="Use 8+ characters with a mix of letters and numbers."
        />
        <Field
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Repeat password"
          icon={KeyRound}
          value={form.confirmPassword}
          onChange={update('confirmPassword')}
          error={errors.confirmPassword}
          required
        />
      </div>

      <label className="checkbox">
        <input type="checkbox" checked={showPassword} onChange={() => setShowPassword((v) => !v)} />
        <span>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />} Show passwords</span>
      </label>

      <Button type="submit" size="lg" fullWidth loading={submitting} iconRight={ArrowRight}>
        Create account
      </Button>

      <p className="auth-switch">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </form>
  );
}
