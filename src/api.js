// api.js — central place for the API base URL + auth header.
// Use this instead of plain fetch() everywhere so the token is never forgotten.

export const API_BASE_URL = 'https://homemanageapp.runasp.net/api';
//export const API_BASE_URL = 'https://localhost:7215/api';

export const authHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Example: apiFetch(`${API_BASE_URL}/Transaction`)
export const apiFetch = (url, options = {}) =>
  fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) }
  });
