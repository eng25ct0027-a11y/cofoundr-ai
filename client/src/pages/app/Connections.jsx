import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Check,
  Clock,
  MessageCircle,
  Search,
  UserCheck,
  UserPlus,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { GridSkeleton } from '../../components/ui/Skeleton';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useFetch } from '../../hooks/useFetch';
import { connectionService } from '../../services/connectionService';
import { chatService } from '../../services/chatService';
import { formatDate, timeAgo } from '../../utils/formatters';

const VIEWS = [
  { value: 'accepted', label: 'Connected', icon: UserCheck, status: 'accepted' },
  { value: 'received', label: 'Requests', icon: UserPlus, status: 'pending' },
  { value: 'sent', label: 'Sent', icon: Clock, status: 'pending' },
  { value: 'all', label: 'All', icon: Users, status: 'all' },
];

function ConnectionCard({ connection, onAction, busy }) {
  const person = connection.user;
  const canAccept = connection.status === 'pending' && connection.direction === 'incoming';
  const canCancel = connection.status === 'pending' && connection.direction === 'outgoing';
  const isConnected = connection.status === 'accepted';

  return (
    <article className="card connection-card">
      <div className="connection-card-head">
        <Avatar user={person} size={54} />
        <div className="connection-card-identity">
          <h3>
            <Link to={`/profile/${person._id}`}>{person.name}</Link>
          </h3>
          <p>
            {person.category || 'Founder'}
            {person.location ? ` · ${person.location}` : ''}
          </p>
          <div className="tag-row">
            {[...(person.skills?.technical || []).slice(0, 2), ...(person.skills?.business || []).slice(0, 1)].map((skill) => (
              <Badge key={skill} tone="soft" size="sm">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
        {isConnected ? (
          <Badge tone="green">Connected</Badge>
        ) : connection.status === 'pending' ? (
          <Badge tone="orange">{connection.direction === 'incoming' ? 'Wants to connect' : 'Pending'}</Badge>
        ) : (
          <Badge tone="red">{connection.status}</Badge>
        )}
      </div>

      {person.bio ? <p className="connection-card-bio">{person.bio}</p> : null}

      <div className="connection-card-foot">
        <span className="muted">
          {connection.direction === 'incoming' ? 'Requested' : isConnected ? 'Connected' : 'Sent'}{' '}
          {timeAgo(connection.updatedAt || connection.createdAt)}
        </span>
        <div className="connection-card-actions">
          {canAccept ? (
            <>
              <Button size="sm" icon={Check} loading={busy === `accept-${connection._id}`} onClick={() => onAction('accept', connection)}>
                Accept
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={X}
                loading={busy === `reject-${connection._id}`}
                onClick={() => onAction('reject', connection)}
              >
                Decline
              </Button>
            </>
          ) : null}
          {canCancel ? (
            <Button
              size="sm"
              variant="ghost"
              icon={X}
              loading={busy === `cancel-${connection._id}`}
              onClick={() => onAction('remove', connection)}
            >
              Cancel request
            </Button>
          ) : null}
          {isConnected ? (
            <>
              <Button
                size="sm"
                icon={MessageCircle}
                loading={busy === `message-${connection._id}`}
                onClick={() => onAction('message', connection)}
              >
                Message
              </Button>
              <Button
                size="sm"
                variant="ghost"
                loading={busy === `remove-${connection._id}`}
                onClick={() => onAction('remove', connection)}
              >
                Remove
              </Button>
            </>
          ) : null}
          {connection.status === 'rejected' ? (
            <Button size="sm" variant="ghost" onClick={() => onAction('remove', connection)}>
              Clear
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function Connections() {
  useDocumentTitle('Connections');
  const navigate = useNavigate();
  const [view, setView] = useState('accepted');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(null);

  const activeView = VIEWS.find((item) => item.value === view) || VIEWS[0];

  const { data, loading, error, reload } = useFetch(
    () => connectionService.list({ status: activeView.status, limit: 50 }),
    [activeView.status]
  );

  const connections = (data?.connections || []).filter((connection) => {
    if (view === 'received' && connection.direction !== 'incoming') return false;
    if (view === 'sent' && connection.direction !== 'outgoing') return false;
    if (search) {
      const haystack = `${connection.user?.name} ${connection.user?.category} ${connection.user?.location}`.toLowerCase();
      if (!haystack.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const counts = data?.counts || {};

  const handleAction = async (action, connection) => {
    const key = `${action}-${connection._id}`;
    setBusy(key);
    try {
      if (action === 'accept') {
        const result = await connectionService.accept(connection._id);
        toast.success(result.message);
        reload({ quiet: true });
      } else if (action === 'reject') {
        const result = await connectionService.reject(connection._id);
        toast.success(result.message);
        reload({ quiet: true });
      } else if (action === 'remove') {
        await connectionService.remove(connection._id);
        toast.success(
          connection.status === 'accepted' ? 'Connection removed' : 'Request cleared'
        );
        reload({ quiet: true });
      } else if (action === 'message') {
        const conversation = await chatService.startConversation(connection.user._id);
        navigate(`/chat/${conversation._id}`);
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Connections"
        title="Your founding network"
        description="Accept the requests that feel right, keep your circle intentional, and start real conversations."
        actions={
          <Link to="/discover" className="btn btn-primary btn-md">
            <UserPlus size={16} /> Find founders
          </Link>
        }
      />

      <div className="connection-summary">
        <div>
          <span>Connected</span>
          <strong>{counts.accepted ?? 0}</strong>
        </div>
        <div>
          <span>Requests received</span>
          <strong>{counts.received ?? 0}</strong>
        </div>
        <div>
          <span>Requests sent</span>
          <strong>{counts.sent ?? 0}</strong>
        </div>
        <div>
          <span>Total network</span>
          <strong>{counts.total ?? 0}</strong>
        </div>
      </div>

      <div className="connections-toolbar">
        <Tabs
          tabs={VIEWS.map((item) => ({
            label: item.label,
            value: item.value,
            icon: item.icon,
            active: view === item.value,
            count:
              item.value === 'accepted'
                ? counts.accepted
                : item.value === 'received'
                ? counts.received
                : item.value === 'sent'
                ? counts.sent
                : undefined,
            onClick: () => setView(item.value),
          }))}
        />
        <label className="connections-search">
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your connections…"
            aria-label="Search connections"
          />
        </label>
      </div>

      {loading ? (
        <GridSkeleton count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !connections.length ? (
        <EmptyState
          icon={view === 'received' ? UserPlus : Users}
          title={
            view === 'received'
              ? 'No pending requests'
              : view === 'sent'
              ? 'No sent requests'
              : view === 'accepted'
              ? 'No connections yet'
              : 'Nothing here yet'
          }
          description={
            view === 'accepted'
              ? 'Discover founders whose skills complement yours and send a connection request.'
              : 'New requests and responses will appear here.'
          }
          action={
            <Link to="/discover" className="btn btn-primary btn-sm">
              Discover founders
            </Link>
          }
        />
      ) : (
        <>
          <div className="results-meta">
            <span>{connections.length} shown</span>
            <span className="results-sort">
              <UserRound size={14} /> Sorted by most recent activity
            </span>
          </div>
          <div className="grid grid-2 connection-grid">
            {connections.map((connection) => (
              <ConnectionCard
                key={connection._id}
                connection={connection}
                onAction={handleAction}
                busy={busy}
              />
            ))}
          </div>
        </>
      )}

      <p className="dashboard-footnote">
        Member since {formatDate(new Date(), { month: 'long', year: 'numeric' })} · Connections are
        mutual. Messaging unlocks only after a request is accepted.
      </p>
    </div>
  );
}
