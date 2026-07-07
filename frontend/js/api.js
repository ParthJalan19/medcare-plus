export const BACKEND_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : 'https://medcare-plus-backend.onrender.com'; // Replace with actual Render service URL after deployment

const BASE_URL = `${BACKEND_URL}/api/v1`;

// In-memory access token storage
let accessToken = localStorage.getItem('accessToken') || null;

const setAccessToken = (token) => {
  accessToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

const getAccessToken = () => accessToken;

// Generic Fetch Wrapper
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  // Set headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const fetchOptions = {
    ...options,
    headers
  };

  try {
    let response = await fetch(url, fetchOptions);
    let data;

    // Read response content as JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // In case we got text/html (like an error or file export)
      if (response.ok) {
        return { success: true, data: response };
      }
      data = { success: false, error: 'Server returned a non-JSON response.' };
    }

    // Access token expired interceptor
    if (!response.ok && response.status === 401 && data.code === 'TOKEN_EXPIRED') {
      console.log('Access token expired. Attempting refresh token rotation...');
      const refreshSuccess = await rotateTokens();
      
      if (refreshSuccess) {
        // Retry the original request with new access token
        headers['Authorization'] = `Bearer ${accessToken}`;
        response = await fetch(url, fetchOptions);
        if (contentType && contentType.includes('application/json')) {
          data = await response.json();
        } else {
          return { success: true, data: response };
        }
      } else {
        // Refresh token expired or revoked - force logout
        handleAuthFailure();
        return { success: false, error: 'Session expired. Please log in again.' };
      }
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`
      };
    }

    return data;
  } catch (error) {
    console.error('API Request Failed:', error);
    return {
      success: false,
      error: 'Network connection failed. Please check your internet.'
    };
  }
};

// Refresh token rotation call
const rotateTokens = async () => {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data.token) {
        setAccessToken(data.data.token);
        console.log('Access token refreshed successfully.');
        return true;
      }
    }
    return false;
  } catch (err) {
    console.error('Token rotation failed:', err);
    return false;
  }
};

const handleAuthFailure = () => {
  setAccessToken(null);
  localStorage.removeItem('userRole');
  localStorage.removeItem('userInfo');
  window.location.hash = '#/login';
};

export {
  fetchAPI,
  setAccessToken,
  getAccessToken,
  handleAuthFailure
};
