import api from './api';
import { buildQuery } from '../utils/formatters';

export const chatService = {
  async conversations() {
    const { data } = await api.get('/conversations');
    return data.data;
  },
  async startConversation(userId) {
    const { data } = await api.post('/conversations', { userId });
    return data.data.conversation;
  },
  async messages(conversationId, params = {}) {
    const { data } = await api.get(
      `/messages/${conversationId}${buildQuery(params)}`
    );
    return data.data;
  },
  async send({ receiverId, content, conversationId }) {
    const { data } = await api.post('/messages', { receiverId, content, conversationId });
    return data.data;
  },
  async markRead(conversationId) {
    const { data } = await api.put(`/messages/${conversationId}/read`);
    return data.data;
  },
};
