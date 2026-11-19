import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Flag,
  RefreshCw,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import Tabs from '../../components/ui/Tabs';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFetch } from '../../hooks/useFetch';
import { adminService } from '../../services/adminService';
import { formatDate, timeAgo } from '../../utils/formatters';

const REASONS = {
  fake_profile: 'Fake profile or impersonation',
  spam: 'Spam or promotional content',
  harassment: 'Harassment or abusive behavior',
  inappropriate_content: 'Inappropriate content',
  scam: 'Scam or fraudulent offer',
  other: 'Something else',
};

const STATUS_META = {
  open: { tone: 'orange', label: 'Open', icon: AlertTriangle },
  reviewing: { tone: 'blue', label: 'Reviewing', icon: Clock },
  resolved: { tone: 'green', label: 'Resolved', icon: CheckCircle2 },
  dismissed: { tone: 'neutral', label: 'Dismissed', icon: XCircle },
};

const TABS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
];

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.open;
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} size="sm">
      <Icon size={12} /> {meta.label}
    </Badge>
  );
}

export default function AdminReports() {
  useDocumentTitle('Admin reports');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);

  const { data, loading, error, reload } = useFetch(
    () => adminService.reports({ page, limit: 10, status: status || undefined }),
    [status, page]
  );

  const reports = data?.reports || [];

  const changeStatus = async (report, nextStatus) => {
    if (nextStatus === report.status) return;
    setBusy(report._id);
    try {
      await adminService.updateReport(report._id, nextStatus);
      toast.success(`Report marked ${nextStatus}`);
      await reload({ quiet: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const openCount = reports.filter((report) => report.status === 'open').length;

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div className="admin-page-head-copy">
          <span className="admin-eyebrow">
            <Flag size={14} /> Moderation
          </span>
          <h1>Community reports</h1>
          <p>
            Review what founders have flagged. Resolve genuine issues and dismiss anything that
            does not break the guidelines.
          </p>
        </div>
        <div className="admin-page-actions">
          <Button variant="secondary" icon={RefreshCw} onClick={() => reload()} loading={loading}>
            Refresh
          </Button>
        </div>
      </header>

      <div className="admin-reports-toolbar">
        <Tabs
          tabs={TABS.map((tab) => ({
            ...tab,
            active: status === tab.value,
            icon: tab.value ? STATUS_META[tab.value].icon : Flag,
            onClick: () => {
              setStatus(tab.value);
              setPage(1);
            },
          }))}
        />
        <span className="admin-reports-note">
          {openCount && status === '' ? `${openCount} open on this page` : `${data?.meta?.total ?? 0} reports`}
        </span>
      </div>

      {loading && !data ? (
        <Spinner label="Loading reports…" full />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} title="Could not load reports" />
      ) : !reports.length ? (
        <EmptyState
          icon={ShieldCheck}
          title={status ? `No ${status} reports` : 'No reports filed'}
          description={
            status
              ? 'Nothing matches this status right now. Check another tab.'
              : 'When a founder reports a profile or startup, it will appear here for review.'
          }
          action={
            status ? (
              <Button variant="secondary" onClick={() => setStatus('')}>
                View all reports
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          <div className="admin-report-list">
            {reports.map((report) => {
              const reporter = report.reporterId;
              const reported = report.reportedUserId;
              return (
                <article key={report._id} className={`admin-report-card status-${report.status}`}>
                  <div className="admin-report-head">
                    <div className="admin-report-people">
                      <div className="admin-report-person">
                        <Avatar user={reporter} size={38} />
                        <div>
                          <span>Reported by</span>
                          <strong>{reporter?.name || 'Deleted account'}</strong>
                        </div>
                      </div>
                      <span className="admin-report-arrow">→</span>
                      <div className="admin-report-person">
                        <Avatar user={reported} size={38} />
                        <div>
                          <span>Reported user</span>
                          <strong>
                            {reported ? (
                              <Link to={`/profile/${reported._id}`}>{reported.name}</Link>
                            ) : (
                              'Deleted account'
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>
                    <div className="admin-report-status">
                      <StatusBadge status={report.status} />
                      <small>{timeAgo(report.createdAt)}</small>
                    </div>
                  </div>

                  <div className="admin-report-body">
                    <div className="admin-report-reason">
                      <Badge tone="violet" size="sm">
                        {REASONS[report.reason] || report.reason}
                      </Badge>
                      {report.startupId ? (
                        <Badge tone="soft" size="sm">
                          Startup: {report.startupId.title}
                        </Badge>
                      ) : null}
                    </div>
                    <p>{report.details || 'No additional details were provided.'}</p>
                    <span className="admin-report-date">Filed {formatDate(report.createdAt)}</span>
                  </div>

                  <div className="admin-report-foot">
                    <div className="admin-report-links">
                      {reported ? (
                        <Link to={`/profile/${reported._id}`} className="text-link">
                          <UserRound size={14} /> View reported profile
                        </Link>
                      ) : null}
                      {report.startupId ? (
                        <Link to={`/startups/${report.startupId._id}`} className="text-link">
                          <Eye size={14} /> View startup
                        </Link>
                      ) : null}
                    </div>
                    <div className="admin-report-actions">
                      <label className="admin-report-select">
                        <span>Status</span>
                        <select
                          value={report.status}
                          disabled={busy === report._id}
                          onChange={(event) => changeStatus(report, event.target.value)}
                        >
                          <option value="open">Open</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="resolved">Resolved</option>
                          <option value="dismissed">Dismissed</option>
                        </select>
                      </label>
                      {report.status !== 'resolved' ? (
                        <Button
                          size="sm"
                          icon={CheckCircle2}
                          loading={busy === report._id}
                          onClick={() => changeStatus(report, 'resolved')}
                        >
                          Resolve
                        </Button>
                      ) : null}
                      {report.status !== 'dismissed' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={XCircle}
                          loading={busy === report._id}
                          onClick={() => changeStatus(report, 'dismissed')}
                        >
                          Dismiss
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
          <Pagination meta={data.meta} onChange={setPage} />
        </>
      )}
    </div>
  );
}
