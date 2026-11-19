const presence = new Map();

function add(userId, socketId) {
  const id = userId.toString();
  if (!presence.has(id)) presence.set(id, new Set());
  presence.get(id).add(socketId);
}

function remove(userId, socketId) {
  const id = userId.toString();
  const sockets = presence.get(id);
  if (!sockets) return;
  sockets.delete(socketId);
  if (!sockets.size) presence.delete(id);
}

function isOnline(userId) {
  return presence.has(userId.toString());
}

function onlineIds() {
  return [...presence.keys()];
}

module.exports = { add, remove, isOnline, onlineIds };
