import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const COLLEGE_EMAIL_DOMAIN = (import.meta.env.VITE_COLLEGE_EMAIL_DOMAIN || 'collegename').replace(/^@/, '');

/**
 * Validate that email contains the required college domain substring
 * e.g., rahul.collegename@gmail.com or student@collegename.edu
 */
export const validateCollegeEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  return email.toLowerCase().includes(COLLEGE_EMAIL_DOMAIN.toLowerCase());
};

/**
 * Register user document in MongoDB after Firebase signup
 */
export const registerUser = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: null,
      message: 'Network Error: Backend server is not reachable at http://localhost:5000. Please check if the backend server is running.'
    };
  }
};

/**
 * Sync login with MongoDB backend after Firebase signin
 */
export const syncLogin = async (firebaseUID) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login-sync`, { firebaseUID });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: null,
      message: 'Network Error: Backend server is not reachable at http://localhost:5000. Please check if the backend server is running.'
    };
  }
};

/**
 * Fetch protected user profile from GET /api/auth/me using Firebase ID Token
 */
export const getCurrentUserProfile = async (idToken) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to fetch user profile'
    };
  }
};
