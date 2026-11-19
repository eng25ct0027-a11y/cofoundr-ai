const { Server } = require('socket.io');
const config = require('../config/env');
const User = require('../models/User');
const { verifyToken } = require('../utils/token');
const presence = require('./presence');
const messageService = require('../services/messageService');

function parseCookies(header = '') {
  return header.split(';').reduce((cookies, part) => {
    const index = part.indexOf('=');
    if (index === -1) return cookies;
    const key = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: [config.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      if (!token) {
        const cookies = parseCookies(socket.handshake.headers.cookie || '');
        token = cookies[config.cookieName];
      }
      if (!token) return next(new Error('Authentication required'));
      const decoded = verifyToken(token);
      const user = await User.findById(decoded.sub).select('name profileImage isActive');
      if (!user || !user.isActive) return next(new Error('Account unavailable'));
      socket.userId = user._id.toString();
      socket.userName = user.name;
      next();
    } catch {
      next(new Error('Invalid session'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);
    presence.add(userId, socket.id);

    io.emit('presence:update', { userId, online: true });
    socket.emit('presence:list', presence.onlineIds());

    socket.on('chat:typing', ({ receiverId, isTyping }) => {
      if (!receiverId) return;
      io.to(`user:${receiverId}`).emit('chat:typing', {
        userId,
        isTyping: Boolean(isTyping),
      });
    });

    socket.on('chat:send', async (payload, callback) => {
      try {
        const result = await messageService.sendMessage(
          io,
          userId,
          payload?.receiverId,
          payload?.content
        );
        if (typeof callback === 'function') {
          callback({
            ok: true,
            data: {
              message: result.message,
              conversationId: result.conversation._id,
            },
          });
        }
      } catch (error) {
        if (typeof callback === 'function') {
          callback({ ok: false, message: error.message });
        }
      }
    });

    socket.on('chat:read', async ({ conversationId }, callback) => {
      try {
        await messageService.markConversationRead(io, userId, conversationId);
        if (typeof callback === 'function') callback({ ok: true });
      } catch (error) {
        if (typeof callback === 'function') callback({ ok: false, message: error.message });
      }
    });

    socket.on('disconnect', () => {
      presence.remove(userId, socket.id);
      if (!presence.isOnline(userId)) {
        io.emit('presence:update', { userId, online: false });
      }
    });
  });

  return io;
}

module.exports = { initSocket };
