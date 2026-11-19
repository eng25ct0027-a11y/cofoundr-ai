import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Globe,
  Save,
  Sparkles,
  Target,
  UserRound,
  Wrench,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ChipSelect from '../../components/ui/ChipSelect';
import Field from '../../components/ui/Field';
import ProgressBar from '../../components/ui/ProgressBar';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { userService } from '../../services/userService';
import {
  AVAILABILITY,
  BUSINESS_SKILLS,
  CATEGORIES,
  EXPERIENCE_LEVELS,
  FOUNDER_PREFERENCES,
  INTERESTS,
  RISK_TOLERANCE,
  TECHNICAL_SKILLS,
  WORK_STYLES,
} from '../../utils/constants';
import { validateUrl } from '../../utils/validators';

function fromUser(user) {
  return {
    name: user?.name || '',
    location: user?.location || '',
    category: user?.category || '',
    bio: user?.bio || '',
    technical: user?.skills?.technical || [],
    business: user?.skills?.business || [],
    experienceLevel: user?.experienceLevel || 'Intermediate',
    availability: user?.availability || '',
    interests: user?.interests || [],
    preferences: user?.preferences || [],
    startupType: user?.startupGoals?.startupType || '',
    problems: user?.startupGoals?.problems || '',
    cofounderQualities: user?.startupGoals?.cofounderQualities || '',
    longTermVision: user?.startupGoals?.longTermVision || '',
    workStyle: user?.workingPreferences?.workStyle || '',
    riskTolerance: user?.workingPreferences?.riskTolerance || '',
    linkedin: user?.socialLinks?.linkedin || '',
    github: user?.socialLinks?.github || '',
    portfolio: user?.socialLinks?.portfolio || '',
  };
}

export default function ProfileEdit() {
  useDocumentTitle('Edit profile');
  const { user, updateUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [form, setForm] = useState(() => fromUser(user));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };
  const setInput = (key) => (event) => set(key)(event.target.value);

  const completion = useMemo(() => {
    const checks = [
      form.name,
      form.location,
      form.category,
      form.bio.length >= 40,
      form.technical.length + form.business.length >= 2,
      form.interests.length,
      form.preferences.length,
      form.availability,
      form.startupType,
      form.problems,
      form.cofounderQualities,
      form.longTermVision,
      form.workStyle,
      form.riskTolerance,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const validate = () => {
    const next = {
      name: !form.name.trim() || form.name.trim().length < 2 ? 'Full name is required' : '',
      bio: form.bio.trim().length < 20 ? 'Write at least 20 characters about yourself' : '',
      technical:
        form.technical.length + form.business.length < 2
          ? 'Choose at least two skills in total'
          : '',
      interests: form.interests.length ? '' : 'Select at least one interest',
      linkedin: validateUrl(form.linkedin),
      github: validateUrl(form.github),
      portfolio: validateUrl(form.portfolio),
      startupType: form.startupType.trim() ? '' : 'Describe the kind of startup you want to build',
      problems: form.problems.trim() ? '' : 'Describe the problem you want to solve',
      cofounderQualities: form.cofounderQualities.trim()
        ? ''
        : 'Describe the qualities you want in a co-founder',
      longTermVision: form.longTermVision.trim() ? '' : 'Describe your long-term vision',
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleAvatar = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Choose an image smaller than 5MB');
      return;
    }
    setUploading(true);
    try {
      const updated = await userService.uploadAvatar(file);
      updateUser(updated);
      toast.success('Profile picture updated');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      toast.error('Please review the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        name: form.name.trim(),
        location: form.location.trim(),
        category: form.category || undefined,
        bio: form.bio.trim(),
        skills: { technical: form.technical, business: form.business },
        interests: form.interests,
        preferences: form.preferences,
        availability: form.availability || undefined,
        experienceLevel: form.experienceLevel,
        startupGoals: {
          startupType: form.startupType.trim(),
          problems: form.problems.trim(),
          cofounderQualities: form.cofounderQualities.trim(),
          longTermVision: form.longTermVision.trim(),
        },
        workingPreferences: {
          workStyle: form.workStyle,
          riskTolerance: form.riskTolerance,
        },
        socialLinks: {
          linkedin: form.linkedin.trim(),
          github: form.github.trim(),
          portfolio: form.portfolio.trim(),
        },
      });
      updateUser(updated);
      await refreshUser();
      toast.success('Profile saved — matches will refresh in the background');
      navigate(`/profile/${updated._id}`);
    } catch (error) {
      setErrors(error.errors || {});
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page profile-edit-page">
      <PageHeader
        eyebrow="Edit profile"
        title="Keep your founder story current"
        description="Every detail feeds the matching engine. Better signal in, better founders out."
        actions={
          <>
            <Link to={`/profile/${user?._id || ''}`} className="btn btn-secondary btn-md">
              <ArrowLeft size={16} /> Back to profile
            </Link>
            <Button icon={Save} loading={saving} onClick={handleSubmit}>
              Save changes
            </Button>
          </>
        }
      />

      <section className="profile-edit-completion">
        <div>
          <strong>Profile completion: {completion}%</strong>
          <p>Complete profiles receive more accurate compatibility scores and explanations.</p>
        </div>
        <ProgressBar value={completion} showValue={false} />
        <Badge tone={completion >= 80 ? 'green' : 'violet'}>{completion}%</Badge>
      </section>

      <form className="profile-edit-form" onSubmit={handleSubmit} noValidate>
        <section className="panel profile-edit-section">
          <div className="panel-head">
            <div>
              <h2>
                <UserRound size={18} /> Identity
              </h2>
              <p>How you appear to other founders.</p>
            </div>
          </div>
          <div className="avatar-editor">
            <Avatar user={user} size={88} />
            <div>
              <strong>Profile picture</strong>
              <p>PNG, JPG or WEBP up to 5MB. Square images look best.</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                hidden
                onChange={handleAvatar}
              />
              <Button
                variant="secondary"
                size="sm"
                icon={Camera}
                loading={uploading}
                onClick={() => fileRef.current?.click()}
              >
                Upload photo
              </Button>
            </div>
          </div>
          <div className="form-grid-2">
            <Field
              label="Full name"
              value={form.name}
              onChange={setInput('name')}
              error={errors.name}
              placeholder="Alex Morgan"
              required
            />
            <Field
              label="Location"
              value={form.location}
              onChange={setInput('location')}
              placeholder="City, Country"
              hint="Timezone context helps founders align."
            />
          </div>
          <div className="form-grid-2">
            <Field
              label="Category"
              as="select"
              value={form.category}
              onChange={setInput('category')}
              options={[{ value: '', label: 'Select a category' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
            />
            <Field
              label="Experience level"
              as="select"
              value={form.experienceLevel}
              onChange={setInput('experienceLevel')}
              options={EXPERIENCE_LEVELS}
            />
          </div>
          <Field
            label="Bio"
            as="textarea"
            rows={5}
            maxLength={800}
            value={form.bio}
            onChange={setInput('bio')}
            error={errors.bio}
            placeholder="What do you build, what are you great at, and what are you looking for?"
            hint={`${form.bio.length}/800 characters`}
          />
        </section>

        <section className="panel profile-edit-section">
          <div className="panel-head">
            <div>
              <h2>
                <Wrench size={18} /> Skills & availability
              </h2>
              <p>Complementary skills carry 25% of every match score.</p>
            </div>
          </div>
          <ChipSelect
            label="Technical skills"
            options={TECHNICAL_SKILLS}
            value={form.technical}
            onChange={set('technical')}
            max={10}
            error={errors.technical}
          />
          <ChipSelect
            label="Business skills"
            options={BUSINESS_SKILLS}
            value={form.business}
            onChange={set('business')}
            max={10}
          />
          <div className="form-grid-2">
            <Field
              label="Availability"
              as="select"
              value={form.availability}
              onChange={setInput('availability')}
              options={[{ value: '', label: 'Select availability' }, ...AVAILABILITY.map((a) => ({ value: a, label: a }))]}
            />
            <Field
              label="Working style"
              as="select"
              value={form.workStyle}
              onChange={setInput('workStyle')}
              options={[{ value: '', label: 'Select working style' }, ...WORK_STYLES.map((w) => ({ value: w, label: w }))]}
            />
          </div>
          <Field
            label="Risk tolerance"
            as="select"
            value={form.riskTolerance}
            onChange={setInput('riskTolerance')}
            options={[{ value: '', label: 'Select risk tolerance' }, ...RISK_TOLERANCE.map((r) => ({ value: r, label: r }))]}
          />
        </section>

        <section className="panel profile-edit-section">
          <div className="panel-head">
            <div>
              <h2>
                <Target size={18} /> Startup goals
              </h2>
              <p>Concrete goals give the engine something real to compare.</p>
            </div>
          </div>
          <Field
            label="What kind of startup do you want to build?"
            value={form.startupType}
            onChange={setInput('startupType')}
            error={errors.startupType}
            placeholder="e.g. AI-powered SaaS for early-stage founders"
          />
          <Field
            label="Problem you want to solve"
            as="textarea"
            rows={4}
            maxLength={1200}
            value={form.problems}
            onChange={setInput('problems')}
            error={errors.problems}
            placeholder="Describe the customer, the pain, and why now."
          />
          <Field
            label="Co-founder qualities you value"
            as="textarea"
            rows={4}
            maxLength={1200}
            value={form.cofounderQualities}
            onChange={setInput('cofounderQualities')}
            error={errors.cofounderQualities}
            placeholder="Skills, temperament, commitment level, values."
          />
          <Field
            label="Long-term vision"
            as="textarea"
            rows={3}
            maxLength={1200}
            value={form.longTermVision}
            onChange={setInput('longTermVision')}
            error={errors.longTermVision}
            placeholder="If this works, what does the world look like in ten years?"
          />
        </section>

        <section className="panel profile-edit-section">
          <div className="panel-head">
            <div>
              <h2>
                <Sparkles size={18} /> Interests & preferences
              </h2>
              <p>Industry alignment is worth 15% of the score.</p>
            </div>
          </div>
          <ChipSelect
            label="Industries & interests"
            options={INTERESTS}
            value={form.interests}
            onChange={set('interests')}
            max={6}
            error={errors.interests}
          />
          <ChipSelect
            label="What are you looking for?"
            options={FOUNDER_PREFERENCES}
            value={form.preferences}
            onChange={set('preferences')}
            max={3}
          />
        </section>

        <section className="panel profile-edit-section">
          <div className="panel-head">
            <div>
              <h2>
                <Globe size={18} /> Links
              </h2>
              <p>Optional, but useful when a founder wants to verify your work.</p>
            </div>
          </div>
          <div className="form-grid-3">
            <Field
              label="LinkedIn"
              value={form.linkedin}
              onChange={setInput('linkedin')}
              error={errors.linkedin}
              placeholder="https://linkedin.com/in/…"
            />
            <Field
              label="GitHub"
              value={form.github}
              onChange={setInput('github')}
              error={errors.github}
              placeholder="https://github.com/…"
            />
            <Field
              label="Portfolio"
              value={form.portfolio}
              onChange={setInput('portfolio')}
              error={errors.portfolio}
              placeholder="https://your-site.com"
            />
          </div>
        </section>

        <div className="profile-edit-actions">
          <span className="muted">
            <CheckCircle2 size={15} /> Changes recalculate your matches automatically.
          </span>
          <div>
            <Link to={`/profile/${user?._id || ''}`} className="btn btn-ghost btn-md">
              Cancel
            </Link>
            <Button type="submit" icon={Save} loading={saving}>
              Save changes
            </Button>
          </div>
        </div>
      </form>

      <section className="panel profile-edit-tip">
        <BriefcaseBusiness size={18} />
        <p>
          Want to show what you are building? <Link to="/startups/new">Publish your startup</Link> so
          founders can apply to join you.
        </p>
      </section>
    </div>
  );
}
