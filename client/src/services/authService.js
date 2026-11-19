import api from './api';

export const authService = {
  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data.data.user;
  },
  async login(payload) {
    const { data } = await api.post('/auth/login', payload);
    return data.data.user;
  },
  async logout() {
    await api.post('/auth/logout');
  },
  async me() {
    const { data } = await api.get('/auth/me');
    return data.data.user;
  },
  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },
  async resetPassword(token, password) {
    const { data } = await api.post(`/auth/reset-password/${token}`, { password });
    return data.data.user;
  },
  async changePassword(payload) {
    const { data } = await api.put('/auth/change-password', payload);
    return data;
  },
};
