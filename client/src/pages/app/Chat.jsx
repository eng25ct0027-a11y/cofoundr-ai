import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MessageCircle,
  MoreHorizontal,
  Search,
  Send,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { chatService } from '../../services/chatService';
import { formatTime, timeAgo } from '../../utils/formatters';

function dayLabel(value) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function Chat() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { socket, subscribe, emit, isOnline } = useSocket();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadError, setThreadError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [search, setSearch] = useState('');

  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const activeIdRef = useRef(conversationId);
  activeIdRef.current = conversationId;

  useDocumentTitle('Messages');

  const activeConversation = useMemo(
    () => conversations.find((item) => item._id === conversationId) || conversation,
    [conversations, conversationId, conversation]
  );

  const other = activeConversation?.user;

  const loadConversations = useCallback(
    async ({ quiet = false } = {}) => {
      if (!quiet) setLoadingList(true);
      setListError(null);
      try {
        const data = await chatService.conversations();
        setConversations(data.conversations);
        return data.conversations;
      } catch (error) {
        setListError(error.message);
        return [];
      } finally {
        setLoadingList(false);
      }
    },
    []
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (conversationId || loadingList) return;
    if (conversations.length) navigate(`/chat/${conversations[0]._id}`, { replace: true });
  }, [conversationId, conversations, loadingList, navigate]);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setConversation(null);
      return undefined;
    }
    let active = true;
    setLoadingThread(true);
    setThreadError(null);
    chatService
      .messages(conversationId, { limit: 60 })
      .then((data) => {
        if (!active) return;
        setMessages(data.messages);
        setHasMore(data.hasMore);
        setConversation(data.conversation);
        setConversations((current) =>
          current.map((item) =>
            item._id === conversationId ? { ...item, unreadCount: 0 } : item
          )
        );
      })
      .catch((error) => {
        if (active) setThreadError(error.message);
      })
      .finally(() => {
        if (active) setLoadingThread(false);
      });
    return () => {
      active = false;
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return undefined;
    const unsubscribeNew = subscribe('chat:new', (message) => {
      const belongsToActive = message.conversationId === activeIdRef.current;
      const senderId = String(message.senderId?._id || message.senderId);
      setConversations((current) => {
        const next = current.map((item) =>
          item._id === message.conversationId
            ? {
                ...item,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
                lastSenderId: message.senderId,
                unreadCount:
                  belongsToActive || senderId === String(user?._id)
                    ? 0
                    : (item.unreadCount || 0) + 1,
              }
            : item
        );
        return [...next].sort(
          (a, b) =>
            new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
        );
      });

      if (belongsToActive) {
        setMessages((current) =>
          current.some((item) => item._id === message._id) ? current : [...current, message]
        );
        if (senderId !== String(user?._id)) {
          chatService.markRead(message.conversationId).catch(() => {});
        }
      }
    });

    const unsubscribeTyping = subscribe('chat:typing', (payload) => {
      if (!other || payload.userId !== String(other._id)) return;
      setTyping(Boolean(payload.isTyping));
    });

    return () => {
      unsubscribeNew();
      unsubscribeTyping();
    };
  }, [subscribe, conversationId, user?._id, other]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, typing]);

  useEffect(
    () => () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    },
    []
  );

  const emitTyping = (isTyping) => {
    if (!other || !socket) return;
    emit('chat:typing', { receiverId: other._id, isTyping });
  };

  const handleDraft = (event) => {
    setDraft(event.target.value);
    if (!typingTimer.current) emitTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      typingTimer.current = null;
      emitTyping(false);
    }, 1400);
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const content = draft.trim();
    if (!content || !conversationId || sending) return;
    setSending(true);
    try {
      const result = await chatService.send({ conversationId, content });
      setDraft('');
      setMessages((current) =>
        current.some((item) => item._id === result.message._id)
          ? current
          : [...current, result.message]
      );
      setConversations((current) =>
        [
          ...current.map((item) =>
            item._id === conversationId
              ? {
                  ...item,
                  lastMessage: result.message.content,
                  lastMessageAt: result.message.createdAt,
                  lastSenderId: result.message.senderId,
                }
              : item
          ),
        ].sort(
          (a, b) =>
            new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime()
        )
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSending(false);
      emitTyping(false);
    }
  };

  const filteredConversations = conversations.filter((item) => {
    if (!search) return true;
    return `${item.user?.name} ${item.lastMessage}`.toLowerCase().includes(search.toLowerCase());
  });

  const grouped = useMemo(() => {
    const groups = [];
    let lastLabel = null;
    messages.forEach((message) => {
      const label = dayLabel(message.createdAt);
      if (label !== lastLabel) {
        groups.push({ type: 'day', label, key: `day-${label}-${message._id}` });
        lastLabel = label;
      }
      groups.push({ type: 'message', message, key: message._id });
    });
    return groups;
  }, [messages]);

  if (loadingList && !conversations.length) {
    return (
      <div className="page chat-loading">
        <Spinner label="Opening your inbox…" full />
      </div>
    );
  }

  if (listError) {
    return (
      <div className="page">
        <ErrorState message={listError} onRetry={() => loadConversations()} title="Could not load messages" />
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="page">
        <EmptyState
          icon={MessageCircle}
          title="No conversations yet"
          description="Messaging unlocks when a connection request is accepted. Head to your connections to get started."
          action={
            <Link to="/connections" className="btn btn-primary btn-sm">
              Go to connections
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className={`chat-shell ${conversationId ? 'has-thread' : ''}`}>
      <aside className="chat-list">
        <div className="chat-list-head">
          <div>
            <h1>Messages</h1>
            <p>{conversations.length} conversations</p>
          </div>
          <Link to="/discover" className="icon-btn" aria-label="Find more founders">
            <Users size={18} />
          </Link>
        </div>
        <label className="chat-search">
          <Search size={16} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
          />
        </label>

        <div className="chat-conversation-list">
          {filteredConversations.map((item) => (
            <Link
              key={item._id}
              to={`/chat/${item._id}`}
              className={`chat-conversation ${item._id === conversationId ? 'is-active' : ''}`}
            >
              <Avatar
                user={item.user}
                size={44}
                showStatus
                online={isOnline(item.user?._id)}
              />
              <div className="chat-conversation-copy">
                <div>
                  <strong>{item.user?.name}</strong>
                  <small>{timeAgo(item.lastMessageAt)}</small>
                </div>
                <p>{item.lastMessage || 'Start the conversation'}</p>
              </div>
              {item.unreadCount ? <span className="chat-unread">{item.unreadCount}</span> : null}
            </Link>
          ))}
          {!filteredConversations.length ? (
            <p className="chat-list-empty">No conversations match “{search}”.</p>
          ) : null}
        </div>
      </aside>

      <section className="chat-thread">
        {!conversationId ? (
          <div className="chat-placeholder">
            <span className="chat-placeholder-icon">
              <MessageCircle size={26} />
            </span>
            <h2>Pick a conversation</h2>
            <p>Select a founder on the left to read and reply to your messages.</p>
          </div>
        ) : loadingThread ? (
          <div className="chat-thread-loading">
            <Spinner label="Loading conversation…" full />
          </div>
        ) : threadError ? (
          <div className="chat-thread-loading">
            <ErrorState message={threadError} onRetry={() => navigate(0)} />
          </div>
        ) : other ? (
          <>
            <header className="chat-thread-head">
              <Link to="/chat" className="icon-btn chat-back" aria-label="Back to inbox">
                <ArrowLeft size={18} />
              </Link>
              <Avatar user={other} size={40} showStatus online={isOnline(other._id)} />
              <div className="chat-thread-identity">
                <strong>{other.name}</strong>
                <span>
                  {typing ? (
                    <em>typing…</em>
                  ) : isOnline(other._id) ? (
                    'Online now'
                  ) : (
                    `${other.category || 'Founder'}${other.location ? ` · ${other.location}` : ''}`
                  )}
                </span>
              </div>
              <Link to={`/profile/${other._id}`} className="btn btn-secondary btn-sm">
                View profile
              </Link>
              <button type="button" className="icon-btn" aria-label="More options" disabled title="More options coming soon">
                <MoreHorizontal size={18} />
              </button>
            </header>

            <div className="chat-messages">
              {hasMore ? (
                <div className="chat-more">
                  <Badge tone="neutral" size="sm">
                    Older messages are available in the API
                  </Badge>
                </div>
              ) : null}
              {grouped.map((entry) =>
                entry.type === 'day' ? (
                  <div key={entry.key} className="chat-day">
                    <span>{entry.label}</span>
                  </div>
                ) : (
                  <div
                    key={entry.key}
                    className={`chat-bubble-row ${
                      String(entry.message.senderId?._id || entry.message.senderId) ===
                      String(user?._id)
                        ? 'is-mine'
                        : ''
                    }`}
                  >
                    <div className="chat-bubble">
                      <p>{entry.message.content}</p>
                      <span>{formatTime(entry.message.createdAt)}</span>
                    </div>
                  </div>
                )
              )}
              {typing ? (
                <div className="chat-bubble-row">
                  <div className="chat-bubble chat-typing">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              ) : null}
              <div ref={bottomRef} />
            </div>

            <form className="chat-composer" onSubmit={handleSend}>
              <textarea
                rows={1}
                value={draft}
                onChange={handleDraft}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend(event);
                  }
                }}
                placeholder={`Message ${other.name.split(' ')[0]}…`}
                maxLength={2000}
                aria-label="Message"
              />
              <div className="chat-composer-foot">
                <span>{draft.length}/2000 · Enter to send, Shift+Enter for a new line</span>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!draft.trim() || sending}
                >
                  <Send size={15} /> {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="chat-placeholder">
            <h2>Conversation unavailable</h2>
            <p>This conversation may have been removed with a connection.</p>
            <Link to="/chat" className="btn btn-secondary btn-sm">
              Back to inbox
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
