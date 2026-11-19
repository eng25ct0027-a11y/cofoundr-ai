import api from './api';
import { buildQuery } from '../utils/formatters';

export const connectionService = {
  async list(params = {}) {
    const { data } = await api.get(`/connections${buildQuery(params)}`);
    return data.data;
  },
  async request(receiverId) {
    const { data } = await api.post('/connections/request', { receiverId });
    return data;
  },
  async accept(id) {
    const { data } = await api.put(`/connections/${id}/accept`);
    return data;
  },
  async reject(id) {
    const { data } = await api.put(`/connections/${id}/reject`);
    return data;
  },
  async remove(id) {
    const { data } = await api.delete(`/connections/${id}`);
    return data;
  },
};
