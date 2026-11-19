import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Ban,
  CheckCircle2,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Field from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import Spinner from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { adminService } from '../../services/adminService';
import { formatDate, timeAgo } from '../../utils/formatters';

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'user', label: 'Founders' },
  { value: 'admin', label: 'Admins' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export default function AdminUsers() {
  useDocumentTitle('Admin users');
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const [filters, setFilters] = useState({ role: '', status: '' });
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data, setData, loading, error, reload } = useFetch(
    () =>
      adminService.users({
        page,
        limit: 12,
        search: debouncedSearch || undefined,
        role: filters.role || undefined,
        status: filters.status || undefined,
      }),
    [debouncedSearch, filters.role, filters.status, page]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filters.role, filters.status]);

  const users = data?.users || [];
  const activeFilters = [filters.role, filters.status].filter(Boolean).length;

  const clearFilters = () => {
    setSearch('');
    setFilters({ role: '', status: '' });
  };

  const patchUser = (id, updates) => {
    setData((current) =>
      current
        ? {
            ...current,
            users: current.users.map((entry) =>
              entry._id === id ? { ...entry, ...updates } : entry
            ),
          }
        : current
    );
  };

  const toggleActive = async (entry) => {
    setBusy(`status-${entry._id}`);
    try {
      const updated = await adminService.updateUser(entry._id, { isActive: !entry.isActive });
      patchUser(entry._id, { isActive: updated.isActive });
      toast.success(updated.isActive ? `${entry.name} reactivated` : `${entry.name} deactivated`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const toggleRole = async (entry) => {
    const nextRole = entry.role === 'admin' ? 'user' : 'admin';
    setBusy(`role-${entry._id}`);
    try {
      const updated = await adminService.updateUser(entry._id, { role: nextRole });
      patchUser(entry._id, { role: updated.role });
      toast.success(
        nextRole === 'admin' ? `${entry.name} is now an admin` : `${entry.name} is now a founder`
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminService.deleteUser(deleteTarget._id);
      toast.success(`${deleteTarget.name} and related data deleted`);
      setDeleteTarget(null);
      reload({ quiet: true });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div className="admin-page-head-copy">
          <span className="admin-eyebrow">
            <Users size={14} /> User management
          </span>
          <h1>Founders and administrators</h1>
          <p>Search accounts, change roles, deactivate profiles, or remove a user entirely.</p>
        </div>
        <div className="admin-page-actions">
          <Button variant="secondary" icon={RefreshCw} onClick={() => reload()} loading={loading}>
            Refresh
          </Button>
        </div>
      </header>

      <div className="admin-toolbar">
        <Field
          icon={Search}
          placeholder="Search by name, email, or location…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          containerClassName="admin-search"
          aria-label="Search users"
        />
        <button
          type="button"
          className={`btn btn-secondary btn-md ${filtersOpen ? 'is-active' : ''}`}
          onClick={() => setFiltersOpen((open) => !open)}
        >
          <Filter size={16} /> Filters {activeFilters ? `(${activeFilters})` : ''}
        </button>
      </div>

      {filtersOpen ? (
        <div className="admin-filter-panel">
          <Field
            label="Role"
            as="select"
            value={filters.role}
            onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}
            options={ROLE_OPTIONS}
          />
          <Field
            label="Status"
            as="select"
            value={filters.status}
            onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
            options={STATUS_OPTIONS}
          />
          <button type="button" className="text-link" onClick={clearFilters}>
            <X size={14} /> Clear filters
          </button>
          <span className="admin-filter-count">{data?.meta?.total ?? 0} accounts</span>
        </div>
      ) : null}

      <section className="admin-panel">
        {loading && !data ? (
          <Spinner label="Loading accounts…" full />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} title="Could not load users" />
        ) : !users.length ? (
          <EmptyState
            icon={UserRound}
            title="No accounts match these filters"
            description="Try a different search term or clear the role and status filters."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="admin-table-wrap">
              <table className="admin-table admin-users-table">
                <thead>
                  <tr>
                    <th>Founder</th>
                    <th>Category</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th className="align-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((entry) => {
                    const isSelf = entry._id === currentUser?._id;
                    return (
                      <tr key={entry._id} className={!entry.isActive ? 'is-muted' : ''}>
                        <td>
                          <div className="admin-user-cell">
                            <Avatar user={entry} size={38} />
                            <div>
                              <strong>
                                {entry.name}
                                {isSelf ? <Badge tone="violet" size="sm">You</Badge> : null}
                              </strong>
                              <span>{entry.email}</span>
                              {entry.location ? <small>{entry.location}</small> : null}
                            </div>
                          </div>
                        </td>
                        <td>{entry.category || '—'}</td>
                        <td>
                          <Badge tone={entry.role === 'admin' ? 'violet' : 'neutral'} size="sm">
                            {entry.role === 'admin' ? 'Admin' : 'Founder'}
                          </Badge>
                        </td>
                        <td>
                          <Badge tone={entry.isActive ? 'green' : 'red'} size="sm">
                            {entry.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </td>
                        <td title={formatDate(entry.createdAt)}>
                          <span className="admin-table-date">{formatDate(entry.createdAt)}</span>
                          <small className="admin-table-sub">{timeAgo(entry.createdAt)}</small>
                        </td>
                        <td>
                          <div className="admin-row-actions">
                            <Link
                              to={`/profile/${entry._id}`}
                              className="icon-btn"
                              title="View profile"
                              aria-label={`View ${entry.name}'s profile`}
                            >
                              <UserRound size={16} />
                            </Link>
                            <button
                              type="button"
                              className="icon-btn"
                              title={entry.role === 'admin' ? 'Demote to founder' : 'Promote to admin'}
                              aria-label={entry.role === 'admin' ? 'Demote to founder' : 'Promote to admin'}
                              disabled={isSelf || busy === `role-${entry._id}`}
                              onClick={() => toggleRole(entry)}
                            >
                              {entry.role === 'admin' ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                            </button>
                            <button
                              type="button"
                              className="icon-btn"
                              title={entry.isActive ? 'Deactivate account' : 'Reactivate account'}
                              aria-label={entry.isActive ? 'Deactivate account' : 'Reactivate account'}
                              disabled={isSelf || busy === `status-${entry._id}`}
                              onClick={() => toggleActive(entry)}
                            >
                              {entry.isActive ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                            </button>
                            <button
                              type="button"
                              className="icon-btn danger"
                              title="Delete account"
                              aria-label={`Delete ${entry.name}`}
                              disabled={isSelf}
                              onClick={() => setDeleteTarget(entry)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination meta={data.meta} onChange={setPage} />
          </>
        )}
      </section>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name || 'this account'}?`}
        description="This permanently removes the account and its related data."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" icon={Trash2} loading={deleting} onClick={confirmDelete}>
              Delete permanently
            </Button>
          </>
        }
      >
        <div className="admin-delete-warning">
          <strong>This cannot be undone.</strong>
          <p>
            Deleting this founder also removes their startups, applications, connections,
            conversations, messages, matches, notifications, reports, and profile views.
          </p>
        </div>
      </Modal>
    </div>
  );
}
