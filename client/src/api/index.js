import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (phone, password) => api.post('/auth/login', { phone, password }).then(r => r.data),
  register: (house_no, name, phone, email, password) => api.post('/auth/register', { house_no, name, phone, email, password }).then(r => r.data),
  getMe: () => api.get('/auth/me').then(r => r.data),
};

export const residentsAPI = {
  getAll: (params) => api.get(`/residents${params ? `?${params}` : ''}`).then(r => r.data),
  updateMe: (data) => api.put('/residents/me', data).then(r => r.data),
  create: (data) => api.post('/residents', data).then(r => r.data),
  update: (id, data) => api.put(`/residents/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/residents/${id}`).then(r => r.data),
};

export const eventsAPI = {
  getAll: () => api.get('/events').then(r => r.data),
  create: (data) => api.post('/events', data).then(r => r.data),
  update: (id, data) => api.put(`/events/${id}`, data).then(r => r.data),
  close: (id) => api.put(`/events/${id}/close`).then(r => r.data),
  open: (id) => api.put(`/events/${id}/open`).then(r => r.data),
  participate: (id, status, family) => api.put(`/events/${id}/participate`, { status, ...family }).then(r => r.data),
  removeParticipation: (id) => api.delete(`/events/${id}/participate`).then(r => r.data),
  getContributions: (eventId) => api.get(`/events/${eventId}/contributions`).then(r => r.data),
  addContribution: (eventId, data) => api.post(`/events/${eventId}/contributions`, data).then(r => r.data),
  approveContribution: (id) => api.put(`/event-contributions/${id}/approve`).then(r => r.data),
  rejectContribution: (id) => api.put(`/event-contributions/${id}/reject`).then(r => r.data),
  getTotalContributions: (eventId) => api.get(`/events/${eventId}/total-contributions`).then(r => r.data),
};

export const contributionsAPI = {
  getAll: () => api.get('/contributions').then(r => r.data),
  update: (id, data) => api.put(`/contributions/${id}`, data).then(r => r.data),
  addForMonth: (month, amount, payment_date) => api.post('/contributions/add', { month, amount, payment_date }).then(r => r.data),
  seed: () => api.post('/contributions/seed').then(r => r.data),
  approve: (id, data) => api.put(`/contributions/${id}/approve`, data).then(r => r.data),
  reject: (id, data) => api.put(`/contributions/${id}/reject`, data).then(r => r.data),
};

export const amenitiesAPI = {
  getAll: () => api.get('/amenities').then(r => r.data),
  getAvailability: (id) => api.get(`/amenities/${id}/availability`).then(r => r.data),
  create: (data) => api.post('/amenities', data).then(r => r.data),
  request: (data) => api.post('/amenity-requests', data).then(r => r.data),
  getRequests: () => api.get('/amenity-requests').then(r => r.data),
  approve: (id, data) => api.put(`/amenity-requests/${id}/approve`, data).then(r => r.data),
  reject: (id, data) => api.put(`/amenity-requests/${id}/reject`, data).then(r => r.data),
  returnItem: (id) => api.put(`/amenity-requests/${id}/return`).then(r => r.data),
  approveReturn: (id, data) => api.put(`/amenity-requests/${id}/approve-return`, data).then(r => r.data),
  rejectReturn: (id, data) => api.put(`/amenity-requests/${id}/reject-return`, data).then(r => r.data),
};

export const adminAPI = {
  getStats: () => api.get('/admin/stats').then(r => r.data),
};

export default api;
