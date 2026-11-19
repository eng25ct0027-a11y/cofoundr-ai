import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BriefcaseBusiness, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import ChipSelect from '../../components/ui/ChipSelect';
import Field from '../../components/ui/Field';
import Spinner from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFetch } from '../../hooks/useFetch';
import { startupService } from '../../services/startupService';
import {
  BUSINESS_SKILLS,
  INTERESTS,
  PROJECT_STAGES,
  STARTUP_ROLES,
  TECHNICAL_SKILLS,
} from '../../utils/constants';

const SKILL_OPTIONS = [...new Set([...TECHNICAL_SKILLS, ...BUSINESS_SKILLS])];

const EMPTY = {
  title: '',
  description: '',
  problem: '',
  solution: '',
  industry: '',
  projectStage: 'Idea',
  teamSize: 1,
  requiredSkills: [],
  requiredRoles: [],
  lookingForCollaborators: true,
};

export default function StartupForm({ mode = 'create' }) {
  const { id } = useParams();
  const isEdit = mode === 'edit';
  useDocumentTitle(isEdit ? 'Edit startup' : 'Post a startup');
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useFetch(
    () => (isEdit ? startupService.getById(id) : Promise.resolve(null)),
    [id, isEdit]
  );

  useEffect(() => {
    if (isEdit && data?.startup) {
      const startup = data.startup;
      setForm({
        title: startup.title || '',
        description: startup.description || '',
        problem: startup.problem || '',
        solution: startup.solution || '',
        industry: startup.industry || '',
        projectStage: startup.projectStage || 'Idea',
        teamSize: startup.teamSize || 1,
        requiredSkills: startup.requiredSkills || [],
        requiredRoles: startup.requiredRoles || [],
        lookingForCollaborators: startup.lookingForCollaborators !== false,
      });
    }
  }, [data, isEdit]);

  const set = (key) => (value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };
  const setInput = (key) => (event) => set(key)(event.target.value);

  const validate = () => {
    const next = {
      title: !form.title.trim() ? 'A title is required' : '',
      description:
        form.description.trim().length < 30
          ? 'Description must be at least 30 characters'
          : '',
      problem: form.problem.trim() ? '' : 'Describe the problem',
      solution: form.solution.trim() ? '' : 'Describe your solution',
      industry: form.industry ? '' : 'Choose an industry',
      teamSize: Number(form.teamSize) >= 1 ? '' : 'Team size must be at least 1',
    };
    setErrors(next);
    return !Object.values(next).some(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) {
      toast.error('Please review the highlighted fields');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        problem: form.problem.trim(),
        solution: form.solution.trim(),
        industry: form.industry,
        projectStage: form.projectStage,
        teamSize: Number(form.teamSize),
        requiredSkills: form.requiredSkills,
        requiredRoles: form.requiredRoles,
        lookingForCollaborators: form.lookingForCollaborators,
      };
      const startup = isEdit
        ? await startupService.update(id, payload)
        : await startupService.create(payload);
      toast.success(isEdit ? 'Startup updated' : 'Startup published');
      navigate(`/startups/${startup._id}`);
    } catch (err) {
      setErrors(err.errors || {});
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (isEdit && loading) {
    return (
      <div className="page">
        <Spinner label="Loading startup…" full />
      </div>
    );
  }

  if (isEdit && error) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={reload} title="Could not load this startup" />
      </div>
    );
  }

  return (
    <div className="page startup-form-page">
      <PageHeader
        eyebrow={isEdit ? 'Edit startup' : 'New startup'}
        title={isEdit ? 'Update your startup' : 'Publish a startup founders can join'}
        description="Clear problems, honest requirements, and a specific solution attract the right collaborators."
        actions={
          <Link to={isEdit ? `/startups/${id}` : '/startups'} className="btn btn-secondary btn-md">
            <ArrowLeft size={16} /> {isEdit ? 'Back to startup' : 'All startups'}
          </Link>
        }
      />

      <form className="startup-form" onSubmit={handleSubmit} noValidate>
        <section className="panel startup-form-section">
          <div className="panel-head">
            <div>
              <h2>
                <BriefcaseBusiness size={18} /> The basics
              </h2>
              <p>What are you building, and at what stage?</p>
            </div>
          </div>
          <Field
            label="Startup title"
            value={form.title}
            onChange={setInput('title')}
            error={errors.title}
            placeholder="e.g. Nexa — AI research copilot for founders"
            maxLength={120}
            required
          />
          <Field
            label="Description"
            as="textarea"
            rows={5}
            maxLength={2000}
            value={form.description}
            onChange={setInput('description')}
            error={errors.description}
            placeholder="What is it, who is it for, and what makes it different?"
            hint={`${form.description.length}/2000 characters · at least 30`}
            required
          />
          <div className="form-grid-2">
            <Field
              label="Industry"
              as="select"
              value={form.industry}
              onChange={setInput('industry')}
              error={errors.industry}
              options={[{ value: '', label: 'Choose an industry' }, ...INTERESTS.map((i) => ({ value: i, label: i }))]}
              required
            />
            <Field
              label="Project stage"
              as="select"
              value={form.projectStage}
              onChange={setInput('projectStage')}
              options={PROJECT_STAGES.map((s) => ({ value: s, label: s }))}
            />
          </div>
          <div className="form-grid-2">
            <Field
              label="Team size"
              type="number"
              min={1}
              max={100}
              value={form.teamSize}
              onChange={setInput('teamSize')}
              error={errors.teamSize}
            />
            <label className="checkbox checkbox-card">
              <input
                type="checkbox"
                checked={form.lookingForCollaborators}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    lookingForCollaborators: event.target.checked,
                  }))
                }
              />
              <span>
                <strong>Open to collaborators</strong>
                <small>Founders can apply to join this startup.</small>
              </span>
            </label>
          </div>
        </section>

        <section className="panel startup-form-section">
          <div className="panel-head">
            <div>
              <h2>The problem & solution</h2>
              <p>Specific beats impressive. Name the customer and the pain.</p>
            </div>
          </div>
          <Field
            label="Problem"
            as="textarea"
            rows={4}
            maxLength={1500}
            value={form.problem}
            onChange={setInput('problem')}
            error={errors.problem}
            placeholder="Who suffers today, how do they cope, and why is it expensive or painful?"
            required
          />
          <Field
            label="Solution"
            as="textarea"
            rows={4}
            maxLength={1500}
            value={form.solution}
            onChange={setInput('solution')}
            error={errors.solution}
            placeholder="How does your product solve it, and why now?"
            required
          />
        </section>

        <section className="panel startup-form-section">
          <div className="panel-head">
            <div>
              <h2>Who you need</h2>
              <p>Matched founders are ranked against these skills and roles.</p>
            </div>
          </div>
          <ChipSelect
            label="Required skills"
            options={SKILL_OPTIONS}
            value={form.requiredSkills}
            onChange={set('requiredSkills')}
            max={10}
            hint="Pick the skills you genuinely need, not everything that sounds good."
          />
          <ChipSelect
            label="Open roles"
            options={STARTUP_ROLES}
            value={form.requiredRoles}
            onChange={set('requiredRoles')}
            max={6}
          />
        </section>

        <div className="startup-form-actions">
          <span className="muted">You can edit these details any time.</span>
          <div>
            <Link to={isEdit ? `/startups/${id}` : '/startups'} className="btn btn-ghost btn-md">
              Cancel
            </Link>
            <Button type="submit" icon={Save} loading={saving}>
              {isEdit ? 'Save changes' : 'Publish startup'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
