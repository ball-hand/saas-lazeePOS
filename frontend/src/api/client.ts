import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const { protocol, hostname, port } = window.location;
  // If local development, always adapt to the current subdomain/host dynamically
  if (hostname.includes('localhost') || hostname.includes('lazeepos.local') || hostname.includes('127.0.0.1')) {
    const apiPort = port === '5173' ? '5000' : (port || '5000');
    return `${protocol}//${hostname}${apiPort ? `:${apiPort}` : ''}/api/v1`;
  }
  return envUrl || `${protocol}//${hostname}${port ? `:${port}` : ''}/api/v1`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Enable sending cookies with all requests
});

api.interceptors.request.use((config) => {
  // First, try to get token from Authorization header (for backward compatibility)
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Note: HttpOnly cookies are automatically sent by axios with withCredentials: true
  return config;
}, (error) => Promise.reject(error));

api.interceptors.response.use(
  (response) => {
    // Automatically unwrap standard SaaS response envelope { status: 'success', data: ... }
    if (response.data && response.data.status === 'success' && 'data' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear local storage fallback
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect depends on which side of the fence we are
      if (window.location.pathname.startsWith('/central')) {
        window.location.href = '/central-login';
      } else {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getMediaUrl = (path: string | null | undefined) => {
  if (!path) return '';
  if (path.startsWith('blob:') || path.startsWith('http')) return path;
  
  const envUrl = import.meta.env.VITE_API_URL;
  const { protocol, hostname, port } = window.location;
  if (hostname.includes('localhost') || hostname.includes('lazeepos.local') || hostname.includes('127.0.0.1')) {
    const apiPort = port === '5173' ? '5000' : (port || '5000');
    return `${protocol}//${hostname}${apiPort ? `:${apiPort}` : ''}${path}`;
  }
  const baseUrl = envUrl ? envUrl.replace('/api/v1', '') : `${protocol}//${hostname}${port ? `:${port}` : ''}`;
  return `${baseUrl}${path}`;
};

export default api;
