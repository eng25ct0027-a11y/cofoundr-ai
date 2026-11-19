import api from './api';
import { buildQuery } from '../utils/formatters';

export const adminService = {
  async stats() {
    const { data } = await api.get('/admin/stats');
    return data.data;
  },
  async users(params = {}) {
    const { data } = await api.get(`/admin/users${buildQuery(params)}`);
    return data.data;
  },
  async updateUser(id, payload) {
    const { data } = await api.put(`/admin/users/${id}`, payload);
    return data.data.user;
  },
  async deleteUser(id) {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  },
  async reports(params = {}) {
    const { data } = await api.get(`/admin/reports${buildQuery(params)}`);
    return data.data;
  },
  async updateReport(id, status) {
    const { data } = await api.put(`/admin/reports/${id}`, { status });
    return data.data.report;
  },
};
