import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { connectSocket, disconnectSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(() => new Set());
  const listeners = useRef(new Map());

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setSocket(null);
      setOnlineUsers(new Set());
      return undefined;
    }

    const instance = connectSocket();
    setSocket(instance);

    const onPresenceList = (ids) => setOnlineUsers(new Set(ids));
    const onPresenceUpdate = ({ userId, online }) => {
      setOnlineUsers((current) => {
        const next = new Set(current);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    };

    instance.on('presence:list', onPresenceList);
    instance.on('presence:update', onPresenceUpdate);

    listeners.current.forEach((_handlers, event) => {
      // re-attach handled by consumers via subscribe()
    });

    return () => {
      instance.off('presence:list', onPresenceList);
      instance.off('presence:update', onPresenceUpdate);
    };
  }, [isAuthenticated]);

  const subscribe = (event, handler) => {
    const instance = socket || connectSocket();
    if (!listeners.current.has(event)) listeners.current.set(event, new Set());
    listeners.current.get(event).add(handler);
    instance.on(event, handler);
    return () => {
      instance.off(event, handler);
      listeners.current.get(event)?.delete(handler);
    };
  };

  const emit = (event, payload, callback) => {
    const instance = socket || connectSocket();
    instance.emit(event, payload, callback);
  };

  const value = useMemo(
    () => ({
      socket,
      onlineUsers,
      isOnline: (id) => onlineUsers.has(String(id)),
      subscribe,
      emit,
    }),
    [socket, onlineUsers]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
}
