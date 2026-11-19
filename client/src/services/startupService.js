import api from './api';
import { buildQuery } from '../utils/formatters';

export const startupService = {
  async list(params = {}) {
    const { data } = await api.get(`/startups${buildQuery(params)}`);
    return data.data;
  },
  async getById(id) {
    const { data } = await api.get(`/startups/${id}`);
    return data.data;
  },
  async create(payload) {
    const { data } = await api.post('/startups', payload);
    return data.data.startup;
  },
  async update(id, payload) {
    const { data } = await api.put(`/startups/${id}`, payload);
    return data.data.startup;
  },
  async remove(id) {
    const { data } = await api.delete(`/startups/${id}`);
    return data;
  },
  async apply(id, message) {
    const { data } = await api.post(`/startups/${id}/apply`, { message });
    return data.data.application;
  },
  async applications(id) {
    const { data } = await api.get(`/startups/${id}/applications`);
    return data.data.applications;
  },
  async reviewApplication(applicationId, action) {
    const { data } = await api.put(`/startups/applications/${applicationId}`, { action });
    return data.data.application;
  },
  async recommended(id) {
    const { data } = await api.get(`/startups/${id}/recommended`);
    return data.data.recommended;
  },
};
