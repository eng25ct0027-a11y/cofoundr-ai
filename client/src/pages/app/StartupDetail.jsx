import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  CircleDot,
  Pencil,
  Send,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import ScoreRing from '../../components/ui/ScoreRing';
import Spinner from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFetch } from '../../hooks/useFetch';
import { startupService } from '../../services/startupService';
import { connectionService } from '../../services/connectionService';
import { formatDate, timeAgo } from '../../utils/formatters';

const STATUS_TONE = {
  pending: 'orange',
  accepted: 'green',
  rejected: 'red',
};

export default function StartupDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applyOpen, setApplyOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [applying, setApplying] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reviewing, setReviewing] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [recommended, setRecommended] = useState([]);

  const { data, setData, loading, error, reload } = useFetch(
    () => startupService.getById(id),
    [id]
  );

  const startup = data?.startup;
  useDocumentTitle(startup ? startup.title : 'Startup');

  useEffect(() => {
    if (!data?.isOwner) {
      setRecommended([]);
      return undefined;
    }
    let active = true;
    startupService
      .recommended(id)
      .then((entries) => {
        if (active) setRecommended(entries);
      })
      .catch(() => {
        if (active) setRecommended([]);
      });
    return () => {
      active = false;
    };
  }, [data?.isOwner, id]);

  if (loading) {
    return (
      <div className="page">
        <Spinner label="Loading startup…" full />
      </div>
    );
  }

  if (error || !startup) {
    return (
      <div className="page">
        <ErrorState
          message={error || 'Startup not found'}
          onRetry={reload}
          title="Could not load this startup"
        />
      </div>
    );
  }

  const founder = startup.founderId;
  const isOwner = data.isOwner;
  const application = data.application;
  const canApply = !isOwner && startup.lookingForCollaborators;

  const submitApplication = async (event) => {
    event.preventDefault();
    setApplying(true);
    try {
      const created = await startupService.apply(startup._id, message.trim());
      setData((current) => ({ ...current, application: created }));
      setApplyOpen(false);
      setMessage('');
      toast.success('Application submitted — the founder has been notified');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setApplying(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await startupService.remove(startup._id);
      toast.success('Startup deleted');
      navigate('/startups', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setDeleting(false);
    }
  };

  const review = async (applicationId, action) => {
    setReviewing(applicationId);
    try {
      const updated = await startupService.reviewApplication(applicationId, action);
      setData((current) => ({
        ...current,
        applications: current.applications.map((item) =>
          item._id === applicationId ? { ...item, status: updated.status } : item
        ),
      }));
      toast.success(action === 'accept' ? 'Applicant accepted' : 'Application rejected');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReviewing(null);
    }
  };

  const connectFounder = async () => {
    setConnecting(true);
    try {
      const result = await connectionService.request(founder._id);
      toast.success(result.message);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="page startup-detail-page">
      <Link to="/startups" className="back-link">
        <ArrowLeft size={15} /> All startups
      </Link>

      <section className="startup-hero">
        <div className="startup-hero-main">
          <span className="startup-mark large">
            <BriefcaseBusiness size={26} />
          </span>
          <div>
            <div className="startup-title-row">
              <h1>{startup.title}</h1>
              <Badge tone="violet">{startup.projectStage}</Badge>
              {startup.lookingForCollaborators ? (
                <Badge tone="green">Open to collaborators</Badge>
              ) : (
                <Badge tone="neutral">Not hiring</Badge>
              )}
            </div>
            <div className="startup-meta-row">
              <span>
                <CircleDot size={15} /> {startup.industry}
              </span>
              <span>
                <Users size={15} /> {startup.teamSize} {startup.teamSize === 1 ? 'member' : 'members'}
              </span>
              <span>
                <Calendar size={15} /> Posted {formatDate(startup.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="startup-hero-actions">
          {isOwner ? (
            <>
              <Link to={`/startups/${startup._id}/edit`} className="btn btn-secondary btn-md">
                <Pencil size={16} /> Edit
              </Link>
              <button
                type="button"
                className="btn btn-danger btn-md"
                onClick={() => setDeleteOpen(true)}
              >
                <Trash2 size={16} /> Delete
              </button>
            </>
          ) : (
            <>
              {application ? (
                <Badge tone={STATUS_TONE[application.status]} size="lg">
                  Application {application.status}
                </Badge>
              ) : null}
              <Button
                icon={Send}
                onClick={() => setApplyOpen(true)}
                disabled={!canApply || application?.status === 'pending' || application?.status === 'accepted'}
              >
                {application?.status === 'pending'
                  ? 'Application pending'
                  : application?.status === 'accepted'
                  ? 'You are on the team'
                  : 'Apply to join'}
              </Button>
              <Button variant="secondary" icon={UserPlus} onClick={connectFounder} loading={connecting}>
                Connect with founder
              </Button>
            </>
          )}
        </div>
      </section>

      <div className="startup-layout">
        <div className="startup-main">
          <section className="panel">
            <h2>About this startup</h2>
            <p className="startup-richtext">{startup.description}</p>
          </section>

          <section className="panel startup-problem-grid">
            <div>
              <h2>The problem</h2>
              <p className="startup-richtext">{startup.problem}</p>
            </div>
            <div>
              <h2>The solution</h2>
              <p className="startup-richtext">{startup.solution}</p>
            </div>
          </section>

          <section className="panel">
            <h2>Who they need</h2>
            <div className="startup-needs">
              <div>
                <span className="sidebar-label">Required skills</span>
                <div className="tag-row">
                  {startup.requiredSkills?.length ? (
                    startup.requiredSkills.map((skill) => (
                      <Badge key={skill} tone="blue" size="sm">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <span className="muted">No specific skills listed.</span>
                  )}
                </div>
              </div>
              <div>
                <span className="sidebar-label">Roles</span>
                <div className="tag-row">
                  {startup.requiredRoles?.length ? (
                    startup.requiredRoles.map((role) => (
                      <Badge key={role} tone="soft" size="sm">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <span className="muted">Open to any strong collaborator.</span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {isOwner ? (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Applications ({data.applications?.length || 0})</h2>
                  <p>Founders who want to build this with you.</p>
                </div>
              </div>
              {data.applications?.length ? (
                <div className="application-list">
                  {data.applications.map((item) => (
                    <article key={item._id} className="application-item">
                      <Avatar user={item.applicantId} size={44} />
                      <div className="application-copy">
                        <strong>
                          <Link to={`/profile/${item.applicantId?._id}`}>
                            {item.applicantId?.name || 'Founder'}
                          </Link>
                        </strong>
                        <span>
                          {item.applicantId?.category || 'Founder'}
                          {item.applicantId?.location ? ` · ${item.applicantId.location}` : ''}
                        </span>
                        {item.message ? <p>{item.message}</p> : null}
                        <small>Applied {timeAgo(item.createdAt)}</small>
                      </div>
                      <div className="application-actions">
                        {item.status === 'pending' ? (
                          <>
                            <Button
                              size="sm"
                              icon={CheckCircle2}
                              loading={reviewing === item._id}
                              onClick={() => review(item._id, 'accept')}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              icon={XCircle}
                              loading={reviewing === item._id}
                              onClick={() => review(item._id, 'reject')}
                            >
                              Reject
                            </Button>
                          </>
                        ) : (
                          <Badge tone={STATUS_TONE[item.status]}>{item.status}</Badge>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  No applications yet. Recommended founders appear on the right.
                </p>
              )}
            </section>
          ) : null}

          {isOwner ? (
            <section className="panel">
              <div className="panel-head">
                <div>
                  <h2>Recommended founders</h2>
                  <p>Ranked by how well their skills match your open roles.</p>
                </div>
              </div>
              {recommended.length ? (
                <div className="recommended-list">
                  {recommended.map((entry) => (
                    <div key={entry.user._id} className="recommended-item">
                      <Avatar user={entry.user} size={42} />
                      <div className="recommended-copy">
                        <strong>
                          <Link to={`/profile/${entry.user._id}`}>{entry.user.name}</Link>
                        </strong>
                        <span>
                          {entry.matchedSkills?.length
                            ? `Matches ${entry.matchedSkills.join(', ')}`
                            : entry.user.category || 'Founder'}
                        </span>
                      </div>
                      <ScoreRing score={entry.matchScore} size={46} stroke={5} />
                      <Link to={`/profile/${entry.user._id}`} className="btn btn-secondary btn-sm">
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">
                  Recommended founders are calculated live once your startup has required skills.
                </p>
              )}
            </section>
          ) : null}
        </div>

        <aside className="startup-side">
          <section className="panel startup-founder-card">
            <span className="sidebar-label">Founder</span>
            <div className="startup-founder-head">
              <Avatar user={founder} size={56} />
              <div>
                <strong>
                  <Link to={`/profile/${founder?._id}`}>{founder?.name}</Link>
                </strong>
                <span>
                  {founder?.category || 'Founder'}
                  {founder?.location ? ` · ${founder.location}` : ''}
                </span>
              </div>
            </div>
            {founder?.bio ? <p>{founder.bio}</p> : null}
            <div className="tag-row">
              {[...(founder?.skills?.technical || []).slice(0, 3), ...(founder?.skills?.business || []).slice(0, 2)].map((skill) => (
                <span key={skill} className="mini-tag">
                  {skill}
                </span>
              ))}
            </div>
            <Link to={`/profile/${founder?._id}`} className="btn btn-secondary btn-sm">
              View founder profile <ArrowRight size={14} />
            </Link>
          </section>

          <section className="panel startup-side-stats">
            <div>
              <span>Stage</span>
              <strong>{startup.projectStage}</strong>
            </div>
            <div>
              <span>Industry</span>
              <strong>{startup.industry}</strong>
            </div>
            <div>
              <span>Team size</span>
              <strong>{startup.teamSize}</strong>
            </div>
            <div>
              <span>Updated</span>
              <strong>{timeAgo(startup.updatedAt)}</strong>
            </div>
          </section>

          {!isOwner ? (
            <section className="panel startup-cta">
              <Sparkles size={18} />
              <h3>Think you are the missing piece?</h3>
              <p>Send a short note explaining what you would own and why it fits.</p>
              <Button
                icon={Send}
                onClick={() => setApplyOpen(true)}
                disabled={!canApply || application?.status === 'pending' || application?.status === 'accepted'}
              >
                Apply to join
              </Button>
            </section>
          ) : null}
        </aside>
      </div>

      <Modal
        open={applyOpen}
        onClose={() => setApplyOpen(false)}
        title={`Apply to ${startup.title}`}
        description="The founder will see your profile and this note."
        footer={
          <>
            <Button variant="ghost" onClick={() => setApplyOpen(false)}>
              Cancel
            </Button>
            <Button icon={Send} onClick={submitApplication} loading={applying}>
              Submit application
            </Button>
          </>
        }
      >
        <form className="application-form" onSubmit={submitApplication}>
          <Field
            label="Why you?"
            as="textarea"
            rows={5}
            maxLength={800}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="What would you own, what have you built before, and why does this idea matter to you?"
            hint={`${message.length}/800 characters`}
          />
        </form>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this startup?"
        description="This removes the startup and all applications. This cannot be undone."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Keep startup
            </Button>
            <Button variant="danger" icon={Trash2} loading={deleting} onClick={handleDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <p className="muted">
          Founders who applied will lose their application. Your profile and connections stay intact.
        </p>
      </Modal>
    </div>
  );
}
