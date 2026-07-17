import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add interceptor to include JWT token in every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────
export const signup = async (userData) => {
  const response = await api.post('/auth/signup', userData);
  return response.data;
};

export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const googleLogin = async (credential) => {
  const response = await api.post('/auth/google', { credential });
  return response.data;
};

// ─── Users ───────────────────────────────────────────────────────────────────
export const getCurrentUser = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

export const updateCurrentUser = async (userData) => {
  const response = await api.put('/users/me', userData);
  return response.data;
};

// ─── Tasks ───────────────────────────────────────────────────────────────────
export const getTasks = async () => {
  const response = await api.get('/tasks/');
  return response.data;
};

export const createTask = async (taskData) => {
  const response = await api.post('/tasks/', taskData);
  return response.data;
};

export const updateTask = async (taskId, taskData) => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

// ─── Moods ───────────────────────────────────────────────────────────────────
export const logMood = async (moodData) => {
  const response = await api.post('/moods/', moodData);
  return response.data;
};

export const getMoodHistory = async (limit = 30) => {
  const response = await api.get(`/moods/?limit=${limit}`);
  return response.data;
};

// ─── AI / Gemini ─────────────────────────────────────────────────────────────
export const chatWithAI = async (message, history = []) => {
  const response = await api.post('/ai/chat', { message, history });
  return response.data;
};

export const getAIInsights = async () => {
  const response = await api.get('/ai/insights');
  return response.data;
};

export const decomposeTask = async (taskTitle) => {
  const response = await api.post(`/ai/decompose-task?task_title=${encodeURIComponent(taskTitle)}`);
  return response.data;
};

export const predictBurnout = async () => {
  const response = await api.get('/ai/predict-burnout');
  return response.data;
};

export const healSchedule = async () => {
  const response = await api.post('/ai/heal-schedule');
  return response.data;
};

export const trainModel = async () => {
  const response = await api.post('/ai/train');
  return response.data;
};

// ─── UserData (Daily ERD parameters) ─────────────────────────────────────────
export const logUserData = async (data) => {
  const response = await api.post('/userdata/', data);
  return response.data;
};

export const getUserDataHistory = async () => {
  const response = await api.get('/userdata/');
  return response.data;
};

// ─── Admin Management ────────────────────────────────────────────────────────
export const getAdminUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const updateAdminUser = async (userId, userData) => {
  const response = await api.put(`/admin/users/${userId}`, userData);
  return response.data;
};

export const deleteAdminUser = async (userId) => {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data;
};

export const getAdminLogs = async () => {
  const response = await api.get('/admin/logs');
  return response.data;
};

export const getAdminAuthLogs = async () => {
  const response = await api.get('/admin/authentications');
  return response.data;
};

export const getAdminAIModels = async () => {
  const response = await api.get('/admin/ai-models');
  return response.data;
};

export const adminTrainModel = async (userId) => {
  const response = await api.post(`/admin/train/${userId}`);
  return response.data;
};

export const logoutApi = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export default api;

