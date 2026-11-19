import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  Bookmark,
  BriefcaseBusiness,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Flag,
  Code2,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import ProgressBar from '../../components/ui/ProgressBar';
import ScoreRing from '../../components/ui/ScoreRing';
import Spinner from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFetch } from '../../hooks/useFetch';
import { userService } from '../../services/userService';
import { connectionService } from '../../services/connectionService';
import { chatService } from '../../services/chatService';
import { reportService } from '../../services/notificationService';
import { CATEGORY_ICONS, MATCH_FACTORS } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';

const REPORT_REASONS = [
  { value: 'fake_profile', label: 'Fake profile or impersonation' },
  { value: 'spam', label: 'Spam or promotional content' },
  { value: 'harassment', label: 'Harassment or abusive behavior' },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'scam', label: 'Scam or fraudulent offer' },
  { value: 'other', label: 'Something else' },
];

function DetailSection({ title, icon: Icon, children }) {
  return (
    <section className="profile-section">
      <h2>
        <Icon size={18} /> {title}
      </h2>
      {children}
    </section>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState({ reason: '', details: '' });
  const [reporting, setReporting] = useState(false);

  const targetId = id || currentUser?._id;

  const { data, setData, loading, error, reload } = useFetch(
    () => userService.getById(targetId),
    [targetId]
  );

  useEffect(() => {
    if (!id && currentUser?._id) {
      navigate(`/profile/${currentUser._id}`, { replace: true });
    }
  }, [id, currentUser, navigate]);

  const profile = data?.user;
  useDocumentTitle(profile ? profile.name : 'Profile');

  if (loading) {
    return (
      <div className="page profile-loading">
        <Spinner label="Loading profile…" full />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={reload} title="Could not load this profile" />
      </div>
    );
  }

  if (!profile) return null;

  const isSelf = profile.isSelf || profile._id === currentUser?._id;
  const connection = profile.connection;
  const compatibility = profile.compatibility;

  const handleConnect = async () => {
    setPending(true);
    try {
      const result = await connectionService.request(profile._id);
      toast.success(result.message);
      setData((current) => ({
        ...current,
        user: {
          ...current.user,
          connection: {
            status: result.data.connection.status,
            connectionId: result.data.connection._id,
            direction: 'outgoing',
          },
        },
      }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPending(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await userService.toggleSave(profile._id);
      setData((current) => ({ ...current, user: { ...current.user, isSaved: saved } }));
      toast.success(saved ? 'Profile saved' : 'Removed from saved profiles');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMessage = async () => {
    try {
      const conversation = await chatService.startConversation(profile._id);
      navigate(`/chat/${conversation._id}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const submitReport = async (event) => {
    event.preventDefault();
    if (!report.reason) {
      toast.error('Choose a reason for the report');
      return;
    }
    setReporting(true);
    try {
      await reportService.create({
        reportedUserId: profile._id,
        reason: report.reason,
        details: report.details,
      });
      toast.success('Report submitted — thank you for helping keep the community safe');
      setReportOpen(false);
      setReport({ reason: '', details: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReporting(false);
    }
  };

  const skills = [
    ...(profile.skills?.technical || []).map((skill) => ({ skill, type: 'technical' })),
    ...(profile.skills?.business || []).map((skill) => ({ skill, type: 'business' })),
  ];

  return (
    <div className="page profile-page">
      <section className="profile-hero">
        <div className="profile-hero-main">
          <Avatar user={profile} size={104} />
          <div className="profile-hero-copy">
            <div className="profile-name-row">
              <h1>{profile.name}</h1>
              {profile.role === 'admin' ? <Badge tone="violet">Admin</Badge> : null}
              {isSelf ? <Badge tone="green">You</Badge> : null}
            </div>
            <p className="profile-title">
              {profile.category ? `${CATEGORY_ICONS[profile.category] || ''} ${profile.category}` : 'Founder'}
              {profile.experienceLevel ? ` · ${profile.experienceLevel}` : ''}
            </p>
            <div className="profile-meta-row">
              {profile.location ? (
                <span>
                  <MapPin size={15} /> {profile.location}
                </span>
              ) : null}
              {profile.availability ? (
                <span>
                  <Calendar size={15} /> {profile.availability}
                </span>
              ) : null}
              {profile.createdAt ? (
                <span>
                  <CheckCircle2 size={15} /> Joined {formatDate(profile.createdAt, { month: 'short', year: 'numeric' })}
                </span>
              ) : null}
              {isSelf ? (
                <span>
                  <Sparkles size={15} /> {profile.profileViews || 0} profile views
                </span>
              ) : null}
            </div>
            <div className="tag-row">
              {(profile.interests || []).map((interest) => (
                <Badge key={interest} tone="soft" size="sm">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-hero-actions">
          {isSelf ? (
            <>
              <Link to="/profile/edit" className="btn btn-primary btn-md">
                <Pencil size={16} /> Edit profile
              </Link>
              <Link to="/settings" className="btn btn-secondary btn-md">
                Settings
              </Link>
            </>
          ) : (
            <>
              <Button
                variant={connection?.status === 'accepted' ? 'secondary' : 'primary'}
                icon={connection?.status === 'accepted' ? MessageCircle : UserPlus}
                onClick={connection?.status === 'accepted' ? handleMessage : handleConnect}
                loading={pending}
                disabled={connection?.status === 'pending'}
              >
                {connection?.status === 'accepted'
                  ? 'Message'
                  : connection?.status === 'pending'
                  ? 'Request pending'
                  : 'Connect'}
              </Button>
              <Button variant="secondary" icon={Bookmark} onClick={handleSave} loading={saving}>
                {profile.isSaved ? 'Saved' : 'Save'}
              </Button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setReportOpen(true)}
                aria-label="Report this profile"
              >
                <Flag size={17} />
              </button>
            </>
          )}
        </div>
      </section>

      <div className="profile-layout">
        <div className="profile-main">
          {isSelf && profile.profileCompletion < 100 ? (
            <section className="profile-completion">
              <div>
                <strong>Profile completion</strong>
                <span>{profile.profileCompletion}% — finish the remaining details to improve match quality.</span>
              </div>
              <ProgressBar value={profile.profileCompletion} showValue={false} />
              <Link to="/onboarding" className="btn btn-secondary btn-sm">
                Review profile
              </Link>
            </section>
          ) : null}

          <DetailSection title="About" icon={Sparkles}>
            <p className="profile-bio">{profile.bio || 'This founder has not written a bio yet.'}</p>
          </DetailSection>

          <DetailSection title="Skills" icon={CheckCircle2}>
            {skills.length ? (
              <div className="profile-skill-groups">
                {profile.skills?.technical?.length ? (
                  <div>
                    <span className="profile-skill-label">Technical</span>
                    <div className="tag-row">
                      {profile.skills.technical.map((skill) => (
                        <Badge key={skill} tone="blue" size="sm">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
                {profile.skills?.business?.length ? (
                  <div>
                    <span className="profile-skill-label">Business</span>
                    <div className="tag-row">
                      {profile.skills.business.map((skill) => (
                        <Badge key={skill} tone="soft" size="sm">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="muted">No skills listed yet.</p>
            )}
          </DetailSection>

          <DetailSection title="What they want to build" icon={BriefcaseBusiness}>
            <div className="profile-goals">
              <div>
                <h3>Startup focus</h3>
                <p>{profile.startupGoals?.startupType || 'Not specified yet.'}</p>
              </div>
              <div>
                <h3>Problem they care about</h3>
                <p>{profile.startupGoals?.problems || 'Not specified yet.'}</p>
              </div>
              <div>
                <h3>Co-founder qualities</h3>
                <p>{profile.startupGoals?.cofounderQualities || 'Not specified yet.'}</p>
              </div>
              <div>
                <h3>Long-term vision</h3>
                <p>{profile.startupGoals?.longTermVision || 'Not specified yet.'}</p>
              </div>
            </div>
          </DetailSection>

          <DetailSection title="Working preferences" icon={Calendar}>
            <div className="profile-preference-grid">
              <div>
                <span>Availability</span>
                <strong>{profile.availability || 'Not specified'}</strong>
              </div>
              <div>
                <span>Working style</span>
                <strong>{profile.workingPreferences?.workStyle || 'Not specified'}</strong>
              </div>
              <div>
                <span>Risk tolerance</span>
                <strong>{profile.workingPreferences?.riskTolerance || 'Not specified'}</strong>
              </div>
              <div>
                <span>Experience</span>
                <strong>{profile.experienceLevel || 'Not specified'}</strong>
              </div>
            </div>
          </DetailSection>

          {profile.socialLinks?.linkedin || profile.socialLinks?.github || profile.socialLinks?.portfolio ? (
            <DetailSection title="Links" icon={Globe}>
              <div className="profile-links">
                {profile.socialLinks?.linkedin ? (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer noopener">
                    <BriefcaseBusiness size={16} /> LinkedIn <ExternalLink size={13} />
                  </a>
                ) : null}
                {profile.socialLinks?.github ? (
                  <a href={profile.socialLinks.github} target="_blank" rel="noreferrer noopener">
                    <Code2 size={16} /> GitHub <ExternalLink size={13} />
                  </a>
                ) : null}
                {profile.socialLinks?.portfolio ? (
                  <a href={profile.socialLinks.portfolio} target="_blank" rel="noreferrer noopener">
                    <Globe size={16} /> Portfolio <ExternalLink size={13} />
                  </a>
                ) : null}
              </div>
            </DetailSection>
          ) : null}

          <DetailSection title="Startups" icon={BriefcaseBusiness}>
            {data.startups?.length ? (
              <div className="profile-startups">
                {data.startups.map((startup) => (
                  <Link key={startup._id} to={`/startups/${startup._id}`} className="profile-startup">
                    <div>
                      <strong>{startup.title}</strong>
                      <span>{startup.industry} · {startup.projectStage}</span>
                    </div>
                    <ArrowRight size={16} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="muted">No startups published yet.</p>
            )}
          </DetailSection>
        </div>

        <aside className="profile-side">
          {!isSelf && compatibility ? (
            <section className="profile-compat">
              <div className="profile-compat-head">
                <div>
                  <span className="page-eyebrow">Compatibility</span>
                  <h2>You + {profile.name.split(' ')[0]}</h2>
                </div>
                <ScoreRing score={compatibility.compatibilityScore} size={82} stroke={8} />
              </div>
              <div className="profile-compat-factors">
                {MATCH_FACTORS.map((factor) => (
                  <div key={factor.key}>
                    <div className="profile-compat-factor-head">
                      <span>{factor.label}</span>
                      <strong>{compatibility.breakdown?.[factor.key] ?? 0}</strong>
                    </div>
                    <span className="profile-compat-track">
                      <span style={{ width: `${compatibility.breakdown?.[factor.key] ?? 0}%` }} />
                    </span>
                  </div>
                ))}
              </div>
              <div className="profile-compat-reasons">
                {(compatibility.matchingReasons || []).map((reason) => (
                  <p key={reason}>
                    <Sparkles size={14} /> {reason}
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          {isSelf ? (
            <section className="profile-side-card">
              <h3>Profile strength</h3>
              <ScoreRing score={profile.profileCompletion} size={96} stroke={8} label="complete" />
              <p>
                Profiles above 80% get significantly better match explanations. Add goals,
                working preferences, and at least three skills.
              </p>
              <Link to="/profile/edit" className="btn btn-secondary btn-sm">
                Improve profile
              </Link>
            </section>
          ) : null}

          <section className="profile-side-card">
            <h3>Looking for</h3>
            <div className="tag-row">
              {(profile.preferences || []).length
                ? profile.preferences.map((preference) => (
                    <Badge key={preference} tone="violet" size="sm">{preference}</Badge>
                  ))
                : <span className="muted">Not specified yet.</span>}
            </div>
          </section>
        </aside>
      </div>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title={`Report ${profile.name}`}
        description="Reports are reviewed by the CoFoundr AI moderation team."
        footer={
          <>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={submitReport} loading={reporting}>
              Submit report
            </Button>
          </>
        }
      >
        <form className="report-form" onSubmit={submitReport}>
          <Field
            label="Reason"
            as="select"
            value={report.reason}
            onChange={(event) => setReport((current) => ({ ...current, reason: event.target.value }))}
            options={[{ value: '', label: 'Choose a reason' }, ...REPORT_REASONS]}
            required
          />
          <Field
            label="Details (optional)"
            as="textarea"
            rows={4}
            maxLength={1000}
            value={report.details}
            onChange={(event) => setReport((current) => ({ ...current, details: event.target.value }))}
            placeholder="What should the moderation team know?"
          />
        </form>
      </Modal>
    </div>
  );
}
