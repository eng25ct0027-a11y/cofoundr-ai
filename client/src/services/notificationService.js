import api from './api';
import { buildQuery } from '../utils/formatters';

export const notificationService = {
  async list(params = {}) {
    const { data } = await api.get(`/notifications${buildQuery(params)}`);
    return data.data;
  },
  async markRead(id) {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data.data;
  },
  async markAllRead() {
    const { data } = await api.put('/notifications/read-all');
    return data.data;
  },
  async remove(id) {
    const { data } = await api.delete(`/notifications/${id}`);
    return data.data;
  },
};

export const reportService = {
  async create(payload) {
    const { data } = await api.post('/reports', payload);
    return data.data.report;
  },
};
