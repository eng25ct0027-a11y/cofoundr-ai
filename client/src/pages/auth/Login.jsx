import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { firstError, validateEmail, validatePassword } from '../../utils/validators';

export default function Login() {
  useDocumentTitle('Log in');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const validate = () => {
    const next = {
      email: validateEmail(form.email),
      password: form.password ? '' : 'Password is required',
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const redirect = location.state?.from;
      if (user.onboardingCompleted) {
        navigate(redirect && redirect !== '/login' ? redirect : '/dashboard', { replace: true });
      } else {
        navigate('/onboarding', { replace: true });
      }
    } catch (error) {
      setErrors(error.errors || {});
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setForm({ email: 'demo@cofoundr.ai', password: 'Password123!' });
    setErrors({});
    toast.success('Demo credentials filled in');
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
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
        label="Password"
        type={showPassword ? 'text' : 'password'}
        name="password"
        autoComplete="current-password"
        placeholder="Your password"
        icon={KeyRound}
        value={form.password}
        onChange={update('password')}
        error={errors.password}
        required
      />

      <div className="auth-form-row">
        <label className="checkbox">
          <input type="checkbox" checked={showPassword} onChange={() => setShowPassword((v) => !v)} />
          <span>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />} Show password</span>
        </label>
        <Link to="/forgot-password" className="text-link">
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" fullWidth loading={submitting} iconRight={ArrowRight}>
        Log in
      </Button>

      <button type="button" className="demo-fill" onClick={fillDemo}>
        Use demo credentials · demo@cofoundr.ai
      </button>

      <p className="auth-switch">
        New to CoFoundr AI? <Link to="/register">Create an account</Link>
      </p>

      {firstError(errors) ? <p className="form-error-banner">{firstError(errors)}</p> : null}
    </form>
  );
}
