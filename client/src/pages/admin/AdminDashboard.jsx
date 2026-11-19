import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  Flag,
  Handshake,
  MessageCircle,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from 'lucide-react';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { ErrorState } from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFetch } from '../../hooks/useFetch';
import { adminService } from '../../services/adminService';
import { formatDate, timeAgo } from '../../utils/formatters';

const STAT_META = [
  {
    key: 'totalUsers',
    label: 'Total founders',
    icon: Users,
    tone: 'violet',
    hint: (totals) => `${totals.activeUsers} active this week`,
    to: '/admin/users',
  },
  {
    key: 'activeUsers',
    label: 'Active this week',
    icon: Activity,
    tone: 'green',
    hint: () => 'Seen in the last 7 days',
  },
  {
    key: 'totalConnections',
    label: 'Connections',
    icon: Handshake,
    tone: 'blue',
    hint: (totals) => `${totals.acceptedConnections} accepted`,
    to: '/admin/users',
  },
  {
    key: 'totalMatches',
    label: 'Matches scored',
    icon: Sparkles,
    tone: 'pink',
    hint: () => 'Computed by the engine',
  },
  {
    key: 'totalStartups',
    label: 'Live startups',
    icon: BriefcaseBusiness,
    tone: 'orange',
    hint: () => 'Published and active',
  },
  {
    key: 'openReports',
    label: 'Open reports',
    icon: Flag,
    tone: 'red',
    hint: () => 'Waiting for review',
    to: '/admin/reports',
  },
];

function dayKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildSignupSeries(signups = []) {
  const counts = new Map();
  signups.forEach((entry) => counts.set(entry._id, entry.count));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }).map((_item, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - index));
    return {
      label: date.toLocaleDateString(undefined, { weekday: 'short' }),
      fullLabel: formatDate(date, { month: 'short', day: 'numeric' }),
      count: counts.get(dayKey(date)) || 0,
    };
  });
}

function AdminStat({ meta, totals }) {
  const Icon = meta.icon;
  const value = totals[meta.key] ?? 0;
  const content = (
    <>
      <span className={`admin-stat-icon tone-${meta.tone}`}>
        <Icon size={20} />
      </span>
      <div className="admin-stat-copy">
        <span>{meta.label}</span>
        <strong>{value}</strong>
        <small>{meta.hint(totals)}</small>
      </div>
      {meta.to ? <ArrowRight size={16} className="admin-stat-arrow" /> : null}
    </>
  );
  return meta.to ? (
    <Link to={meta.to} className="admin-stat-card">
      {content}
    </Link>
  ) : (
    <div className="admin-stat-card">{content}</div>
  );
}

export default function AdminDashboard() {
  useDocumentTitle('Admin overview');
  const { data, loading, error, reload } = useFetch(() => adminService.stats());

  const series = useMemo(() => buildSignupSeries(data?.signups || []), [data?.signups]);
  const maxSignups = Math.max(1, ...series.map((entry) => entry.count));
  const totals = data?.totals || {};
  const topSkills = data?.topSkills || [];
  const maxSkill = Math.max(1, ...topSkills.map((skill) => skill.count));
  const industries = data?.industries || [];
  const maxIndustry = Math.max(1, ...industries.map((industry) => industry.count));

  if (loading && !data) {
    return (
      <div className="admin-page">
        <Spinner label="Loading platform metrics…" full />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="admin-page">
        <ErrorState message={error} onRetry={reload} title="Could not load admin stats" />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div className="admin-page-head-copy">
          <span className="admin-eyebrow">
            <TrendingUp size={14} /> Platform overview
          </span>
          <h1>How the community is moving</h1>
          <p>Live totals across founders, connections, matches, startups, and moderation.</p>
        </div>
        <div className="admin-page-actions">
          <Link to="/admin/users" className="btn btn-secondary btn-sm">
            <Users size={15} /> Manage users
          </Link>
          <Link to="/admin/reports" className="btn btn-primary btn-sm">
            <Flag size={15} /> Review reports
          </Link>
        </div>
      </header>

      <section className="admin-stat-grid">
        {STAT_META.map((meta) => (
          <AdminStat key={meta.key} meta={meta} totals={totals} />
        ))}
      </section>

      <div className="admin-panels">
        <section className="admin-panel admin-panel-wide">
          <div className="admin-panel-head">
            <div>
              <h2>
                <CalendarDays size={17} /> New founders this week
              </h2>
              <p>Signups per day across the last seven days.</p>
            </div>
            <Badge tone="violet">
              {series.reduce((sum, entry) => sum + entry.count, 0)} new
            </Badge>
          </div>
          <div className="admin-chart" role="img" aria-label="Signups per day for the last seven days">
            {series.map((entry) => (
              <div key={entry.fullLabel} className="admin-chart-col">
                <span className="admin-chart-value">{entry.count}</span>
                <span className="admin-chart-track">
                  <span
                    className="admin-chart-fill"
                    style={{ height: `${Math.max(4, (entry.count / maxSignups) * 100)}%` }}
                  />
                </span>
                <span className="admin-chart-label">{entry.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>
                <Sparkles size={17} /> Top skills
              </h2>
              <p>Most common skills across all founder profiles.</p>
            </div>
          </div>
          {topSkills.length ? (
            <div className="admin-bar-list">
              {topSkills.map((skill) => (
                <div key={skill._id} className="admin-bar-row">
                  <span>{skill._id}</span>
                  <span className="admin-bar-track">
                    <span style={{ width: `${(skill.count / maxSkill) * 100}%` }} />
                  </span>
                  <strong>{skill.count}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No skills recorded yet.</p>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>
                <BriefcaseBusiness size={17} /> Startup industries
              </h2>
              <p>Where the published ideas are concentrated.</p>
            </div>
          </div>
          {industries.length ? (
            <div className="admin-bar-list">
              {industries.map((industry) => (
                <div key={industry._id || 'unspecified'} className="admin-bar-row">
                  <span>{industry._id || 'Unspecified'}</span>
                  <span className="admin-bar-track">
                    <span style={{ width: `${(industry.count / maxIndustry) * 100}%` }} />
                  </span>
                  <strong>{industry.count}</strong>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No startups published yet.</p>
          )}
        </section>

        <section className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <h2>
                <MessageCircle size={17} /> Platform pulse
              </h2>
              <p>Messages sent and connections formed.</p>
            </div>
          </div>
          <div className="admin-pulse">
            <div>
              <strong>{totals.totalMessages ?? 0}</strong>
              <span>messages sent</span>
            </div>
            <div>
              <strong>{totals.totalConnections ?? 0}</strong>
              <span>connection requests</span>
            </div>
            <div>
              <strong>{totals.acceptedConnections ?? 0}</strong>
              <span>accepted connections</span>
            </div>
            <div>
              <strong>{totals.totalMatches ?? 0}</strong>
              <span>matches scored</span>
            </div>
          </div>
        </section>
      </div>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <h2>
              <UserRound size={17} /> Newest founders
            </h2>
            <p>The six most recent accounts.</p>
          </div>
          <Link to="/admin/users" className="text-link">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Founder</th>
                <th>Category</th>
                <th>Status</th>
                <th>Joined</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {(data?.recentUsers || []).map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="admin-user-cell">
                      <Avatar user={user} size={36} />
                      <div>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{user.category || '—'}</td>
                  <td>
                    <Badge tone={user.isActive ? 'green' : 'red'} size="sm">
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td title={formatDate(user.createdAt)}>{timeAgo(user.createdAt)}</td>
                  <td>
                    <Link to={`/profile/${user._id}`} className="btn btn-ghost btn-sm">
                      Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
