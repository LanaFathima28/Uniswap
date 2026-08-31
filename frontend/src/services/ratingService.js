import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getAuthHeaders = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Submit rating and feedback for a seller (stars: 1-5, comment)
 */
export const submitRating = async (ratingData, token) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/ratings`, ratingData, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to submit seller rating'
    };
  }
};

/**
 * Fetch ratings and average rating score for a specific seller
 */
export const getUserRatings = async (userId, token) => {
  try {
    const headers = token ? getAuthHeaders(token) : {};
    const response = await axios.get(`${API_BASE_URL}/ratings/user/${userId}`, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: { ratings: [], averageRating: 0, totalRatings: 0 },
      message: error.message || 'Failed to fetch seller ratings'
    };
  }
};
