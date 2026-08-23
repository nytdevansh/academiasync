import axios from 'axios';
import { API_BASE } from '../utils/constants';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token from localStorage to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — clear invalid tokens and dispatch auth event
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:expired'));

      // Only redirect if currently inside protected portal path
      const publicPaths = ['/', '/academics', '/faculty', '/students', '/departments', '/notices', '/contact', '/login'];
      const currentPath = window.location.pathname;
      const isPublic = publicPaths.includes(currentPath);

      if (!isPublic) {
        window.location.href = `/login?from=${encodeURIComponent(currentPath)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;