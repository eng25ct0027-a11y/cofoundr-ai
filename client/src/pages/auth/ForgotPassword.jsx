import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import Field from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { validateEmail } from '../../utils/validators';

export default function ForgotPassword() {
  useDocumentTitle('Forgot password');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const message = validateEmail(email);
    if (message) {
      setError(message);
      return;
    }
    setSubmitting(true);
    try {
      const data = await authService.forgotPassword(email.trim());
      setSent(data);
      toast.success('If that account exists, a reset link is on its way');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-form">
      {sent ? (
        <div className="auth-success">
          <p>{sent.message}</p>
          {sent.devResetUrl ? (
            <p className="auth-dev-note">
              Development mode — email delivery is not configured, so use this link:{' '}
              <a href={sent.devResetUrl}>Reset my password</a>
            </p>
          ) : null}
          <Link to="/login" className="btn btn-secondary btn-md">
            Back to login
          </Link>
        </div>
      ) : (
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <p className="auth-hint">
            Enter the email you signed up with and we will send a link to reset your password.
            The link is valid for 30 minutes.
          </p>
          <Field
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            icon={Mail}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setError('');
            }}
            error={error}
            required
          />
          <Button type="submit" size="lg" fullWidth loading={submitting} iconRight={ArrowRight}>
            Send reset link
          </Button>
          <p className="auth-switch">
            Remembered it? <Link to="/login">Log in</Link>
          </p>
        </form>
      )}
    </div>
  );
}
