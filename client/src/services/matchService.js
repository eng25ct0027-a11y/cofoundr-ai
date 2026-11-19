import api from './api';
import { buildQuery } from '../utils/formatters';

export const matchService = {
  async list(params = {}) {
    const { data } = await api.get(`/matches${buildQuery(params)}`);
    return data.data;
  },
  async recalculate() {
    const { data } = await api.post('/matches/recalculate');
    return data.data;
  },
  async explain(userId) {
    const { data } = await api.get(`/matches/${userId}/explain`);
    return data.data.compatibility;
  },
  async dashboard() {
    const { data } = await api.get('/dashboard');
    return data.data;
  },
};
