import api from './api';
import { buildQuery } from '../utils/formatters';

export const userService = {
  async discover(params = {}) {
    const { data } = await api.get(`/users${buildQuery(params)}`);
    return data.data;
  },
  async featured() {
    const { data } = await api.get('/users/featured');
    return data.data.users;
  },
  async getById(id) {
    const { data } = await api.get(`/users/${id}`);
    return data.data;
  },
  async updateProfile(payload) {
    const { data } = await api.put('/users/profile', payload);
    return data.data.user;
  },
  async uploadAvatar(file) {
    const form = new FormData();
    form.append('avatar', file);
    const { data } = await api.post('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.user;
  },
  async toggleSave(id) {
    const { data } = await api.put(`/users/${id}/save`);
    return data.data.saved;
  },
  async updateSettings(payload) {
    const { data } = await api.put('/users/settings', payload);
    return data.data.user;
  },
  async deactivate() {
    const { data } = await api.post('/users/deactivate');
    return data;
  },
};
