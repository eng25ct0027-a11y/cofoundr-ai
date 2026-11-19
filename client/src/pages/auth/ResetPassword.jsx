import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { validatePassword } from '../../utils/validators';

export default function ResetPassword() {
  useDocumentTitle('Reset password');
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const next = {
      password: validatePassword(form.password),
      confirmPassword:
        form.confirmPassword !== form.password ? 'Passwords do not match' : '',
    };
    setErrors(next);
    if (Object.values(next).some(Boolean)) return;

    setSubmitting(true);
    try {
      const user = await authService.resetPassword(token, form.password);
      setUser(user);
      toast.success('Password reset — you are now logged in');
      navigate(user.onboardingCompleted ? '/dashboard' : '/onboarding', { replace: true });
    } catch (error) {
      setErrors(error.errors || {});
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate>
      <p className="auth-hint">Choose a new password for your account.</p>
      <Field
        label="New password"
        type="password"
        name="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        icon={KeyRound}
        value={form.password}
        onChange={(event) => {
          setForm((current) => ({ ...current, password: event.target.value }));
          setErrors((current) => ({ ...current, password: '' }));
        }}
        error={errors.password}
        required
      />
      <Field
        label="Confirm new password"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
        placeholder="Repeat password"
        icon={KeyRound}
        value={form.confirmPassword}
        onChange={(event) => {
          setForm((current) => ({ ...current, confirmPassword: event.target.value }));
          setErrors((current) => ({ ...current, confirmPassword: '' }));
        }}
        error={errors.confirmPassword}
        required
      />
      <Button type="submit" size="lg" fullWidth loading={submitting} iconRight={ArrowRight}>
        Reset password
      </Button>
      <p className="auth-switch">
        <Link to="/login">Back to login</Link>
      </p>
    </form>
  );
}
