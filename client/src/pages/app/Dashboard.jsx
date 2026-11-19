import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Eye,
  MessageCircle,
  Plus,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ProgressBar from '../../components/ui/ProgressBar';
import ScoreRing from '../../components/ui/ScoreRing';
import Spinner from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFetch } from '../../hooks/useFetch';
import { matchService } from '../../services/matchService';
import { formatDate, timeAgo } from '../../utils/formatters';

function StatCard({ icon: Icon, label, value, hint, to, tone }) {
  const content = (
    <>
      <span className={`stat-icon stat-${tone}`}>
        <Icon size={19} />
      </span>
      <div className="stat-copy">
        <span>{label}</span>
        <strong>{value}</strong>
        {hint ? <small>{hint}</small> : null}
      </div>
      {to ? <ArrowUpRight size={17} className="stat-arrow" /> : null}
    </>
  );
  return to ? (
    <Link to={to} className="stat-card">
      {content}
    </Link>
  ) : (
    <div className="stat-card">{content}</div>
  );
}

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(() => matchService.dashboard());

  if (loading) {
    return (
      <div className="page">
        <div className="dashboard-loading">
          <Spinner label="Assembling your dashboard…" full />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const stats = data?.stats || {};
  const profileCompletion = data?.profileCompletion ?? user?.profileCompletion ?? 0;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Your workspace"
        title={`Good to see you, ${user?.name?.split(' ')[0] || 'founder'}.`}
        description="Here is what is moving, who is new, and where your profile needs attention."
        actions={
          <>
            <Link to="/discover" className="btn btn-secondary btn-md">
              <Users size={16} /> Discover founders
            </Link>
            <Link to="/startups/new" className="btn btn-primary btn-md">
              <Plus size={16} /> Post a startup
            </Link>
          </>
        }
      />

      {profileCompletion < 100 ? (
        <section className="completion-banner">
          <div className="completion-ring">
            <ScoreRing score={profileCompletion} size={78} stroke={7} />
          </div>
          <div className="completion-copy">
            <strong>Your profile is {profileCompletion}% complete</strong>
            <p>Add the missing details so the matching engine has more signal to work with.</p>
            <ProgressBar value={profileCompletion} showValue={false} />
          </div>
          <Link to="/onboarding" className="btn btn-primary btn-sm">
            Complete profile <ArrowRight size={15} />
          </Link>
        </section>
      ) : null}

      <section className="stat-grid">
        <StatCard icon={Sparkles} label="AI matches" value={stats.aiMatches ?? 0} hint="compatible founders" to="/matches" tone="violet" />
        <StatCard icon={Users} label="Connections" value={stats.connections ?? 0} hint="mutual and accepted" to="/connections" tone="blue" />
        <StatCard icon={UserPlus} label="Pending requests" value={stats.pendingRequests ?? 0} hint={`${stats.pendingReceived ?? 0} received`} to="/connections" tone="orange" />
        <StatCard icon={Eye} label="Profile views" value={stats.profileViews ?? 0} hint="all time" tone="green" />
        <StatCard icon={BriefcaseBusiness} label="Active startups" value={stats.activeStartups ?? 0} hint="published by you" to="/startups" tone="pink" />
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Top AI matches</h2>
              <p>Ranked by weighted compatibility, strongest first.</p>
            </div>
            <Link to="/matches" className="text-link">
              See all <ArrowRight size={14} />
            </Link>
          </div>

          {data?.bestMatches?.length ? (
            <div className="dashboard-match-list">
              {data.bestMatches.map((match) => (
                <Link
                  key={match._id}
                  to={`/profile/${match.user._id}`}
                  className="dashboard-match"
                >
                  <Avatar user={match.user} size={46} />
                  <div className="dashboard-match-copy">
                    <strong>{match.user.name}</strong>
                    <span>
                      {match.user.category || 'Founder'}
                      {match.user.location ? ` · ${match.user.location}` : ''}
                    </span>
                    <div className="tag-row">
                      {[...(match.user.skills?.technical || []).slice(0, 2), ...(match.user.skills?.business || []).slice(0, 1)].map((skill) => (
                        <span key={skill} className="mini-tag">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ScoreRing score={match.compatibilityScore} size={54} stroke={6} />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="No matches yet"
              description="Finish onboarding and the engine will calculate your first set of compatible founders."
              action={
                <Link to="/onboarding" className="btn btn-primary btn-sm">
                  Complete profile
                </Link>
              }
            />
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Messages</h2>
              <p>Your latest conversations.</p>
            </div>
            <Link to="/chat" className="text-link">
              Open inbox <ArrowRight size={14} />
            </Link>
          </div>

          {data?.conversations?.length ? (
            <div className="dashboard-conversations">
              {data.conversations.map((conversation) => (
                <Link
                  key={conversation._id}
                  to={`/chat/${conversation._id}`}
                  className="dashboard-conversation"
                >
                  <Avatar user={conversation.user} size={40} />
                  <div>
                    <strong>{conversation.user?.name}</strong>
                    <span>{conversation.lastMessage || 'Start the conversation'}</span>
                  </div>
                  <small>{timeAgo(conversation.lastMessageAt)}</small>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={MessageCircle}
              title="No conversations yet"
              description="Accepted connections can message each other. Send a request to get started."
              action={
                <Link to="/discover" className="btn btn-secondary btn-sm">
                  Find founders
                </Link>
              }
            />
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Recent connections</h2>
              <p>People you can build with today.</p>
            </div>
            <Link to="/connections" className="text-link">
              Manage <ArrowRight size={14} />
            </Link>
          </div>
          {data?.recentConnections?.length ? (
            <div className="connection-mini-list">
              {data.recentConnections.map((connection) => (
                <Link
                  key={connection._id}
                  to={`/profile/${connection.user._id}`}
                  className="connection-mini"
                >
                  <Avatar user={connection.user} size={38} />
                  <div>
                    <strong>{connection.user.name}</strong>
                    <span>{connection.user.category || 'Founder'}</span>
                  </div>
                  <Badge tone="green" size="sm">
                    Connected
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No connections yet"
              description="Connect with founders whose skills complement yours."
              action={
                <Link to="/discover" className="btn btn-secondary btn-sm">
                  Discover
                </Link>
              }
            />
          )}
        </section>

        <section className="panel">
          <div className="panel-head">
            <div>
              <h2>Your startups</h2>
              <p>Ideas you have published to the community.</p>
            </div>
            <Link to="/startups/new" className="text-link">
              New <Plus size={14} />
            </Link>
          </div>
          {data?.startups?.length ? (
            <div className="startup-mini-list">
              {data.startups.map((startup) => (
                <Link key={startup._id} to={`/startups/${startup._id}`} className="startup-mini">
                  <div>
                    <strong>{startup.title}</strong>
                    <span>{startup.industry} · {startup.projectStage}</span>
                  </div>
                  <Badge tone="violet" size="sm">
                    {startup.teamSize} team
                  </Badge>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BriefcaseBusiness}
              title="No startups published"
              description="Post your idea so founders can apply to build it with you."
              action={
                <Link to="/startups/new" className="btn btn-secondary btn-sm">
                  Post a startup
                </Link>
              }
            />
          )}
        </section>
      </div>

      <section className="panel quick-actions">
        <div>
          <h2>Next best actions</h2>
          <p>Small moves that compound into a founding team.</p>
        </div>
        <div className="quick-action-grid">
          <Link to="/matches" className="quick-action">
            <span className="quick-action-icon violet"><Sparkles size={18} /></span>
            <div>
              <strong>Refresh AI matches</strong>
              <span>Re-run the engine after profile updates</span>
            </div>
            <ArrowRight size={16} />
          </Link>
          <Link to="/connections" className="quick-action">
            <span className="quick-action-icon orange"><Bell size={18} /></span>
            <div>
              <strong>{stats.pendingReceived ?? 0} requests waiting</strong>
              <span>Review founders who reached out</span>
            </div>
            <ArrowRight size={16} />
          </Link>
          <Link to="/startups" className="quick-action">
            <span className="quick-action-icon blue"><BriefcaseBusiness size={18} /></span>
            <div>
              <strong>Browse open startups</strong>
              <span>Find a team that needs your skills</span>
            </div>
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <p className="dashboard-footnote">
        Last profile update {formatDate(user?.updatedAt) || 'recently'}. Keep your availability and
        goals current for the best matches.
      </p>
    </div>
  );
}
