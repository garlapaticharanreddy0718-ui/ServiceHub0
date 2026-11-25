const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let accessTokenMemory = null;
let refreshPromise = null;

export const setAccessToken = (token) => {
  accessTokenMemory = token;
};

export const getAccessToken = () => accessTokenMemory;

/**
 * Single-flight access token refresh using the HttpOnly refreshToken cookie.
 * Prevents concurrent 401 retries or React StrictMode double-mounts from
 * racing against single-use refresh token rotation.
 */
export async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshResponse = await fetch(`${API_BASE.replace(/\/$/, '')}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        const token = refreshData?.data?.accessToken || null;
        setAccessToken(token);
        return token;
      }

      setAccessToken(null);
      return null;
    } catch (err) {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Custom fetch wrapper supporting credentials, Bearer token injection, and automatic token refresh retry
 */
export async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers,
  };

  if (accessTokenMemory) {
    headers['Authorization'] = `Bearer ${accessTokenMemory}`;
  }

  const fetchOptions = {
    ...options,
    headers,
    credentials: 'include', // Send & receive HttpOnly cookies
  };

  let response = await fetch(url, fetchOptions);

  // If 401 Unauthorized and not already calling refresh or login/register, attempt single-flight token refresh once
  if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, { ...fetchOptions, headers });
    }
  }

  return response;
}
