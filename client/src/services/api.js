const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

let accessTokenMemory = null;

export const setAccessToken = (token) => {
  accessTokenMemory = token;
};

export const getAccessToken = () => accessTokenMemory;

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

  // If 401 Unauthorized and not already calling refresh or login/register, attempt token refresh once
  if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    try {
      const refreshResponse = await fetch(`${API_BASE.replace(/\/$/, '')}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        setAccessToken(refreshData.data.accessToken);

        // Retry original request with new access token
        headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
        response = await fetch(url, { ...fetchOptions, headers });
      } else {
        setAccessToken(null);
      }
    } catch (err) {
      setAccessToken(null);
    }
  }

  return response;
}
