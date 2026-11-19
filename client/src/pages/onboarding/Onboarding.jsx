import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Sparkles,
  UserRound,
  Wrench,
  Target,
  Rocket,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';
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

const STEPS = [
  { key: 'basics', label: 'Basics', icon: UserRound },
  { key: 'skills', label: 'Skills', icon: Wrench },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'preferences', label: 'Preferences', icon: Rocket },
];

function initialForm(user) {
  return {
    name: user?.name || '',
    location: user?.location || '',
    category: user?.category || '',
    bio: user?.bio || '',
    technical: user?.skills?.technical || [],
    business: user?.skills?.business || [],
    experienceLevel: user?.experienceLevel || 'Intermediate',
    availability: user?.availability || 'Flexible',
    interests: user?.interests || [],
    preferences: user?.preferences || [],
    startupType: user?.startupGoals?.startupType || '',
    problems: user?.startupGoals?.problems || '',
    cofounderQualities: user?.startupGoals?.cofounderQualities || '',
    longTermVision: user?.startupGoals?.longTermVision || '',
    workStyle: user?.workingPreferences?.workStyle || 'Remote',
    riskTolerance: user?.workingPreferences?.riskTolerance || 'Balanced',
    linkedin: user?.socialLinks?.linkedin || '',
    github: user?.socialLinks?.github || '',
    portfolio: user?.socialLinks?.portfolio || '',
  };
}

export default function Onboarding() {
  useDocumentTitle('Complete your profile');
  const { user, updateUser, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => initialForm(user));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (value) =>
    setForm((current) => ({ ...current, [key]: value }));

  const setInput = (key) => (event) => set(key)(event.target.value);

  const completion = useMemo(() => {
    const checks = [
      form.name,
      form.location,
      form.category,
      form.bio.length >= 40,
      form.technical.length + form.business.length >= 2,
      form.interests.length >= 1,
      form.preferences.length >= 1,
      form.availability,
      form.startupType,
      form.problems,
      form.cofounderQualities,
      form.longTermVision,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const validateStep = (index) => {
    const next = {};
    if (index === 0) {
      if (!form.name.trim() || form.name.trim().length < 2) next.name = 'Full name is required';
      if (!form.location.trim()) next.location = 'A location helps founders understand your timezone';
      if (!form.category) next.category = 'Choose the category that fits you best';
      if (form.bio.trim().length < 40) next.bio = 'Write at least 40 characters so founders can get a feel for you';
    }
    if (index === 1) {
      if (form.technical.length + form.business.length < 2) {
        next.skills = 'Select at least two skills in total';
      }
      if (!form.availability) next.availability = 'Choose your availability';
    }
    if (index === 2) {
      if (!form.startupType.trim()) next.startupType = 'Describe the kind of startup you want to build';
      if (form.problems.trim().length < 20) next.problems = 'Describe the problem in at least 20 characters';
      if (!form.cofounderQualities.trim()) next.cofounderQualities = 'Describe the co-founder qualities you value';
      if (form.longTermVision.trim().length < 20) next.longTermVision = 'Describe your long-term vision in at least 20 characters';
    }
    if (index === 3) {
      if (!form.interests.length) next.interests = 'Pick at least one industry or interest';
      if (!form.preferences.length) next.preferences = 'Tell us what kind of teammate you are looking for';
    }
    setErrors(next);
    return !Object.keys(next).length;
  };

  const next = () => {
    if (!validateStep(step)) return;
    setStep((current) => Math.min(STEPS.length - 1, current + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setStep((current) => Math.max(0, current - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    for (let index = 0; index < STEPS.length; index += 1) {
      if (!validateStep(index)) {
        setStep(index);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        location: form.location.trim(),
        category: form.category,
        bio: form.bio.trim(),
        skills: { technical: form.technical, business: form.business },
        experienceLevel: form.experienceLevel,
        availability: form.availability,
        interests: form.interests,
        preferences: form.preferences,
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
        onboardingCompleted: true,
      };
      const updated = await userService.updateProfile(payload);
      updateUser(updated);
      await refreshUser();
      toast.success('Profile complete — calculating your matches');
      navigate('/matches', { replace: true });
    } catch (error) {
      setErrors(error.errors || {});
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const isLast = step === STEPS.length - 1;
  const stepDef = STEPS[step];

  return (
    <div className="onboarding-shell">
      <header className="onboarding-head">
        <div className="onboarding-brand">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
          </span>
          <span className="brand-text">
            CoFoundr <em>AI</em>
          </span>
        </div>
        <div className="onboarding-progress">
          <span>
            Step {step + 1} of {STEPS.length}
          </span>
          <ProgressBar value={((step + 1) / STEPS.length) * 100} showValue={false} />
        </div>
        <div className="onboarding-user">
          <Avatar user={user} size={34} />
          <div>
            <strong>{user?.name}</strong>
            <span>{completion}% complete</span>
          </div>
        </div>
      </header>

      <main className="onboarding-main">
        <aside className="onboarding-side">
          <h2>Let’s find your people.</h2>
          <p>
            This profile is what the matching engine reads. Honest detail now means sharper
            matches later.
          </p>
          <ol className="onboarding-step-list">
            {STEPS.map((item, index) => (
              <li
                key={item.key}
                className={index === step ? 'is-current' : index < step ? 'is-done' : ''}
              >
                <span className="onboarding-step-icon">
                  {index < step ? <Check size={15} /> : <item.icon size={15} />}
                </span>
                <div>
                  <strong>{item.label}</strong>
                  <small>
                    {index === 0
                      ? 'Identity and story'
                      : index === 1
                      ? 'What you bring'
                      : index === 2
                      ? 'What you want to build'
                      : 'How you work together'}
                  </small>
                </div>
              </li>
            ))}
          </ol>
          <div className="onboarding-tip">
            <Sparkles size={16} />
            <p>
              Complementary skills carry 25% of your match score. Don’t just list everything —
              list the work you actually want to do.
            </p>
          </div>
        </aside>

        <section className="onboarding-card">
          <div className="onboarding-card-head">
            <span className="onboarding-step-icon large">
              <stepDef.icon size={20} />
            </span>
            <div>
              <h2>{stepDef.label}</h2>
              <p>
                {step === 0
                  ? 'Introduce yourself like a founder, not a résumé.'
                  : step === 1
                  ? 'Pick your strongest skills and when you can build.'
                  : step === 2
                  ? 'Describe the startup and the partner you are looking for.'
                  : 'Set your interests, working style, and how to reach you.'}
              </p>
            </div>
          </div>

          {step === 0 ? (
            <div className="onboarding-fields">
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
                  error={errors.location}
                  placeholder="City, Country"
                  required
                />
              </div>
              <Field
                label="Category"
                as="select"
                value={form.category}
                onChange={setInput('category')}
                error={errors.category}
                options={[{ value: '', label: 'Select your category' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
                required
              />
              <Field
                label="Short bio"
                as="textarea"
                value={form.bio}
                onChange={setInput('bio')}
                error={errors.bio}
                rows={5}
                maxLength={800}
                placeholder="What do you build? What are you good at? What are you looking for?"
                hint={`${form.bio.length}/800 characters · at least 40 recommended`}
                required
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="onboarding-fields">
              <ChipSelect
                label="Technical skills"
                options={TECHNICAL_SKILLS}
                value={form.technical}
                onChange={set('technical')}
                max={10}
                error={errors.skills}
                hint="Engineering, product, data, and design skills."
              />
              <ChipSelect
                label="Business skills"
                options={BUSINESS_SKILLS}
                value={form.business}
                onChange={set('business')}
                max={10}
                hint="Go-to-market, operations, sales, and strategy."
              />
              <div className="form-grid-2">
                <Field
                  label="Experience level"
                  as="select"
                  value={form.experienceLevel}
                  onChange={setInput('experienceLevel')}
                  options={EXPERIENCE_LEVELS}
                />
                <Field
                  label="Availability"
                  as="select"
                  value={form.availability}
                  onChange={setInput('availability')}
                  error={errors.availability}
                  options={AVAILABILITY}
                  required
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="onboarding-fields">
              <Field
                label="What kind of startup do you want to build?"
                value={form.startupType}
                onChange={setInput('startupType')}
                error={errors.startupType}
                placeholder="e.g. AI-powered SaaS tools for early-stage founders"
                required
              />
              <Field
                label="What problem are you trying to solve?"
                as="textarea"
                value={form.problems}
                onChange={setInput('problems')}
                error={errors.problems}
                rows={4}
                maxLength={1200}
                placeholder="Describe the customer, the pain, and why it matters now."
                required
              />
              <Field
                label="What qualities do you want in a co-founder?"
                as="textarea"
                value={form.cofounderQualities}
                onChange={setInput('cofounderQualities')}
                error={errors.cofounderQualities}
                rows={4}
                maxLength={1200}
                placeholder="Skills, temperament, commitment level, values."
                required
              />
              <Field
                label="What is your long-term vision?"
                as="textarea"
                value={form.longTermVision}
                onChange={setInput('longTermVision')}
                error={errors.longTermVision}
                rows={3}
                maxLength={1200}
                placeholder="If this works, what does the world look like in ten years?"
                required
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="onboarding-fields">
              <ChipSelect
                label="Industries & interests"
                options={INTERESTS}
                value={form.interests}
                onChange={set('interests')}
                max={6}
                error={errors.interests}
                hint="Industry alignment is worth 15% of the match score."
              />
              <ChipSelect
                label="What are you looking for?"
                options={FOUNDER_PREFERENCES}
                value={form.preferences}
                onChange={set('preferences')}
                max={3}
                error={errors.preferences}
              />
              <div className="form-grid-2">
                <Field
                  label="Working style"
                  as="select"
                  value={form.workStyle}
                  onChange={setInput('workStyle')}
                  options={WORK_STYLES}
                />
                <Field
                  label="Risk tolerance"
                  as="select"
                  value={form.riskTolerance}
                  onChange={setInput('riskTolerance')}
                  options={RISK_TOLERANCE}
                />
              </div>
              <div className="form-grid-3">
                <Field label="LinkedIn" value={form.linkedin} onChange={setInput('linkedin')} placeholder="https://linkedin.com/in/…" />
                <Field label="GitHub" value={form.github} onChange={setInput('github')} placeholder="https://github.com/…" />
                <Field label="Portfolio" value={form.portfolio} onChange={setInput('portfolio')} placeholder="https://your-site.com" />
              </div>
              <div className="onboarding-review">
                <CheckCircle2 size={18} />
                <p>
                  Your profile is <strong>{completion}% complete</strong>. Submitting will mark
                  onboarding done and calculate your first AI matches.
                </p>
              </div>
            </div>
          ) : null}

          <div className="onboarding-actions">
            <Button variant="ghost" icon={ArrowLeft} onClick={back} disabled={step === 0 || saving}>
              Back
            </Button>
            <div className="onboarding-actions-right">
              <span className="onboarding-saved">Autosaved locally</span>
              {isLast ? (
                <Button icon={Sparkles} onClick={submit} loading={saving}>
                  Finish and see matches
                </Button>
              ) : (
                <Button iconRight={ArrowRight} onClick={next}>
                  Continue
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
