import api from '../axios';

describe('Axios Configuration', () => {
  it('should have correct base URL', () => {
    expect(api.defaults.baseURL).toBe('/api');
  });

  it('should have correct default headers', () => {
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should have correct timeout', () => {
    expect(api.defaults.timeout).toBe(60000); // 60 seconds (M7)
  });

  it('should not set withCredentials (same-domain proxy)', () => {
    expect(api.defaults.withCredentials).toBeUndefined();
  });

  it('should be an instance of axios', () => {
    expect(api.interceptors).toBeDefined();
    expect(api.get).toBeDefined();
    expect(api.post).toBeDefined();
    expect(api.patch).toBeDefined();
    expect(api.delete).toBeDefined();
  });

  it('should have request interceptors registered', () => {
    expect(api.interceptors.request).toBeDefined();
    expect(typeof api.interceptors.request.use).toBe('function');
  });

  it('should have response interceptors registered', () => {
    expect(api.interceptors.response).toBeDefined();
    expect(typeof api.interceptors.response.use).toBe('function');
  });
});
