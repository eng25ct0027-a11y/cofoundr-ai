function emitToUser(io, userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId.toString()}`).emit(event, payload);
}

module.exports = { emitToUser };
