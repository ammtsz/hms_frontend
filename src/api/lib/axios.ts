import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { transformKeys } from '@/utils/caseConverters';

// Use proxy API routes for secure cross-domain authentication
const baseURL = '/api';

const api: AxiosInstance = axios.create({
  baseURL,
  timeout: 1000 * 60, // 60 seconds (M7); override per-request for long-running ops
  headers: { 'Content-Type': 'application/json' },
  // No need for withCredentials since we're using same-domain proxy routes
});

// Request interceptor: Transform request data (secure - no token exposure)
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Transform request body data (for POST, PUT, PATCH)
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      config.data = transformKeys.toSnakeCase(config.data);
    }
    
    // Transform query parameters from camelCase to snake_case
    if (config.params && typeof config.params === 'object') {
      config.params = transformKeys.toSnakeCase(config.params);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Transform response data (proxy handles auth)
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Transform response data
    if (response.data && typeof response.data === 'object') {
      response.data = transformKeys.toCamelCase(response.data);
    }
    return response;
  },
  (error) => {
    // Transform error response data if present
    if (error.response?.data && typeof error.response.data === 'object') {
      error.response.data = transformKeys.toCamelCase(error.response.data);
    }
    
    // If proxy returns 401, redirect to login (token refresh handled server-side)
    // EXCEPT when on password change pages (user needs to see password errors)
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.includes('/force-password-change') &&
          !window.location.pathname.includes('/settings/profile')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
export { api as apiClient };
