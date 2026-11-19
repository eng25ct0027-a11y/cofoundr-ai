import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  KeyRound,
  Mail,
  MapPin,
  ShieldCheck,
  Trash2,
  UserRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { userService } from '../../services/userService';
import { authService } from '../../services/authService';
import { validatePassword } from '../../utils/validators';
import { formatDate } from '../../utils/formatters';

export default function Settings() {
  useDocumentTitle('Settings');
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [account, setAccount] = useState({
    name: user?.name || '',
    location: user?.location || '',
  });
  const [accountErrors, setAccountErrors] = useState({});
  const [savingAccount, setSavingAccount] = useState(false);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);

  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const saveAccount = async (event) => {
    event.preventDefault();
    const next = {
      name: !account.name.trim() || account.name.trim().length < 2 ? 'Full name is required' : '',
    };
    setAccountErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSavingAccount(true);
    try {
      const updated = await userService.updateSettings({
        name: account.name.trim(),
        location: account.location.trim(),
      });
      updateUser(updated);
      toast.success('Account details saved');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingAccount(false);
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    const next = {
      currentPassword: passwords.currentPassword ? '' : 'Enter your current password',
      newPassword:
        validatePassword(passwords.newPassword) ||
        (passwords.newPassword === passwords.currentPassword
          ? 'Choose a password different from your current one'
          : ''),
      confirmPassword:
        passwords.confirmPassword !== passwords.newPassword ? 'Passwords do not match' : '',
    };
    setPasswordErrors(next);
    if (Object.values(next).some(Boolean)) return;
    setSavingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Password updated');
    } catch (error) {
      setPasswordErrors(error.errors || {});
      toast.error(error.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const deactivate = async () => {
    setDeactivating(true);
    try {
      await userService.deactivate();
      toast.success('Your account has been deactivated');
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(error.message);
      setDeactivating(false);
    }
  };

  return (
    <div className="page settings-page">
      <PageHeader
        eyebrow="Settings"
        title="Account settings"
        description="Manage your account details, password, and account status."
      />

      <div className="settings-layout">
        <div className="settings-main">
          <section className="panel settings-section">
            <div className="panel-head">
              <div>
                <h2>
                  <UserRound size={18} /> Account details
                </h2>
                <p>Used on your profile and in notifications.</p>
              </div>
            </div>
            <form className="settings-form" onSubmit={saveAccount} noValidate>
              <div className="settings-avatar-row">
                <Avatar user={user} size={56} />
                <div>
                  <strong>{user?.name}</strong>
                  <span className="muted">
                    {user?.role === 'admin' ? 'Administrator' : 'Founder'}
                    {user?.createdAt ? ` · joined ${formatDate(user.createdAt)}` : ''}
                  </span>
                </div>
                <Badge tone={user?.onboardingCompleted ? 'green' : 'orange'}>
                  {user?.onboardingCompleted ? 'Profile complete' : 'Onboarding pending'}
                </Badge>
              </div>
              <Field
                label="Full name"
                value={account.name}
                onChange={(event) => {
                  setAccount((current) => ({ ...current, name: event.target.value }));
                  setAccountErrors({ name: '' });
                }}
                error={accountErrors.name}
                icon={UserRound}
                required
              />
              <Field
                label="Location"
                value={account.location}
                onChange={(event) =>
                  setAccount((current) => ({ ...current, location: event.target.value }))
                }
                icon={MapPin}
                placeholder="City, Country"
              />
              <Field
                label="Email"
                value={user?.email || ''}
                icon={Mail}
                disabled
                readOnly
                hint="Email changes are not available in the demo. Contact support to update it."
              />
              <div className="settings-form-actions">
                <Button type="submit" loading={savingAccount}>
                  Save account details
                </Button>
              </div>
            </form>
          </section>

          <section className="panel settings-section">
            <div className="panel-head">
              <div>
                <h2>
                  <KeyRound size={18} /> Password
                </h2>
                <p>Use at least 8 characters. You stay logged in after changing it.</p>
              </div>
            </div>
            <form className="settings-form" onSubmit={savePassword} noValidate>
              <Field
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={passwords.currentPassword}
                onChange={(event) => {
                  setPasswords((current) => ({ ...current, currentPassword: event.target.value }));
                  setPasswordErrors((current) => ({ ...current, currentPassword: '' }));
                }}
                error={passwordErrors.currentPassword}
                required
              />
              <div className="form-grid-2">
                <Field
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.newPassword}
                  onChange={(event) => {
                    setPasswords((current) => ({ ...current, newPassword: event.target.value }));
                    setPasswordErrors((current) => ({ ...current, newPassword: '' }));
                  }}
                  error={passwordErrors.newPassword}
                  required
                />
                <Field
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  value={passwords.confirmPassword}
                  onChange={(event) => {
                    setPasswords((current) => ({ ...current, confirmPassword: event.target.value }));
                    setPasswordErrors((current) => ({ ...current, confirmPassword: '' }));
                  }}
                  error={passwordErrors.confirmPassword}
                  required
                />
              </div>
              <div className="settings-form-actions">
                <Button type="submit" loading={savingPassword}>
                  Update password
                </Button>
              </div>
            </form>
          </section>
        </div>

        <aside className="settings-side">
          <section className="panel settings-side-card">
            <span className="settings-side-icon">
              <ShieldCheck size={20} />
            </span>
            <h3>Privacy & safety</h3>
            <p>
              Your email is private. Only your name, location, skills, and goals are visible to
              other founders. You can report any profile from the profile page.
            </p>
            <Badge tone="green">Email hidden from public profiles</Badge>
          </section>

          <section className="panel settings-side-card">
            <h3>Demo account</h3>
            <p>
              Signed in as <strong>{user?.email}</strong>. All demo data is stored locally in the
              project database and can be reseeded at any time.
            </p>
          </section>

          <section className="panel settings-danger">
            <span className="settings-side-icon danger">
              <AlertTriangle size={20} />
            </span>
            <h3>Danger zone</h3>
            <p>
              Deactivating hides your profile and signs you out. This demo does not delete your
              data, so an admin can reactivate you.
            </p>
            <Button variant="danger" icon={Trash2} onClick={() => setDeactivateOpen(true)}>
              Deactivate account
            </Button>
          </section>
        </aside>
      </div>

      <Modal
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate your account?"
        description="You will be signed out immediately and your profile hidden from discover."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeactivateOpen(false)}>
              Stay active
            </Button>
            <Button variant="danger" icon={Trash2} loading={deactivating} onClick={deactivate}>
              Deactivate
            </Button>
          </>
        }
      >
        <p className="muted">
          Your connections, messages, and startups remain in the database. Sign in again does not
          reactivate the account automatically.
        </p>
      </Modal>
    </div>
  );
}
