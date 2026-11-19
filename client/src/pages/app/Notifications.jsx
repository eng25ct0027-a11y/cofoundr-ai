import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  CheckCheck,
  CheckCircle2,
  MessageCircle,
  Sparkles,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import { EmptyState } from '../../components/ui/EmptyState';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useNotifications } from '../../context/NotificationContext';
import { timeAgo } from '../../utils/formatters';

const TYPE_META = {
  connection_request: { icon: UserPlus, tone: 'violet', label: 'Connection request' },
  connection_accepted: { icon: CheckCircle2, tone: 'green', label: 'Connection accepted' },
  connection_rejected: { icon: XCircle, tone: 'red', label: 'Connection declined' },
  startup_application: { icon: Sparkles, tone: 'blue', label: 'New application' },
  application_accepted: { icon: CheckCircle2, tone: 'green', label: 'Application accepted' },
  application_rejected: { icon: XCircle, tone: 'red', label: 'Application update' },
  message: { icon: MessageCircle, tone: 'blue', label: 'Message' },
  system: { icon: Bell, tone: 'neutral', label: 'System' },
};

export default function Notifications() {
  useDocumentTitle('Notifications');
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markRead, markAllRead, remove } = useNotifications();
  const [filter, setFilter] = useState('all');
  const [busy, setBusy] = useState(null);

  const unread = useMemo(
    () => notifications.filter((item) => !item.isRead),
    [notifications]
  );

  const shown = filter === 'unread' ? unread : notifications;

  const handleOpen = async (notification) => {
    if (!notification.isRead) {
      setBusy(`read-${notification._id}`);
      await markRead(notification._id);
      setBusy(null);
    }
    const target = notification.link || '/notifications';
    if (target.startsWith('/')) navigate(target);
    else window.location.href = target;
  };

  return (
    <div className="page">
      <PageHeader
        eyebrow="Notifications"
        title="What needs your attention"
        description="Connection requests, application updates, and new messages all land here."
        actions={
          <Button
            variant="secondary"
            icon={CheckCheck}
            onClick={markAllRead}
            disabled={!unreadCount}
          >
            Mark all read
          </Button>
        }
      />

      <div className="notifications-toolbar">
        <Tabs
          tabs={[
            { label: 'All', value: 'all', icon: Bell, active: filter === 'all', count: notifications.length, onClick: () => setFilter('all') },
            { label: 'Unread', value: 'unread', icon: BellOff, active: filter === 'unread', count: unreadCount, onClick: () => setFilter('unread') },
          ]}
        />
        <span className="notifications-count">
          {unreadCount ? `${unreadCount} unread` : 'You are all caught up'}
        </span>
      </div>

      {loading ? (
        <div className="notification-skeleton">
          {Array.from({ length: 4 }).map((_item, index) => (
            <div key={index} className="card skeleton-card">
              <span className="skeleton skeleton-avatar" />
              <div className="skeleton-lines">
                <span className="skeleton" style={{ width: '60%' }} />
                <span className="skeleton" style={{ width: '35%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : !shown.length ? (
        <EmptyState
          icon={filter === 'unread' ? BellOff : Bell}
          title={filter === 'unread' ? 'No unread notifications' : 'Nothing new yet'}
          description={
            filter === 'unread'
              ? 'Everything is read. New activity will show up here.'
              : 'When founders connect, applications move, or messages arrive, you will see it here.'
          }
          action={
            <Link to="/discover" className="btn btn-secondary btn-sm">
              Discover founders
            </Link>
          }
        />
      ) : (
        <div className="notification-list">
          {shown.map((notification) => {
            const meta = TYPE_META[notification.type] || TYPE_META.system;
            const Icon = meta.icon;
            return (
              <article
                key={notification._id}
                className={`card notification-item ${notification.isRead ? 'is-read' : 'is-unread'}`}
              >
                <span className={`notification-icon tone-${meta.tone}`}>
                  <Icon size={19} />
                </span>
                <button
                  type="button"
                  className="notification-body"
                  onClick={() => handleOpen(notification)}
                  disabled={busy === `read-${notification._id}`}
                >
                  <div className="notification-head">
                    <span className="notification-type">{meta.label}</span>
                    {!notification.isRead ? <Badge tone="violet" size="sm">New</Badge> : null}
                  </div>
                  <p>{notification.message}</p>
                  <small>{timeAgo(notification.createdAt)}</small>
                </button>
                <div className="notification-actions">
                  {!notification.isRead ? (
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label="Mark as read"
                      onClick={() => markRead(notification._id)}
                    >
                      <CheckCheck size={16} />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label="Delete notification"
                    onClick={() => remove(notification._id)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
