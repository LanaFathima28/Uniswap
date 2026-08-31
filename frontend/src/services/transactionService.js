import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getAuthHeaders = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Express interest in a product
 */
export const expressInterest = async (productId, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/transactions/interest`,
      { productId },
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to express interest'
    };
  }
};

/**
 * Check if logged in user has already expressed interest in a product
 */
export const checkUserInterestForProduct = async (productId, token) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/transactions/check-interest/${productId}`,
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: { hasExpressedInterest: false, status: null, transaction: null },
      message: error.message || 'Failed to check interest status'
    };
  }
};

/**
 * Seller accepts or rejects an interest request (action: "Accept" | "Reject")
 */
export const respondToTransaction = async (transactionId, action, token) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/transactions/${transactionId}/respond`,
      { action },
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to respond to request'
    };
  }
};

/**
 * Fetch incoming and outgoing transactions for the logged-in user
 */
export const getIncomingTransactions = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/transactions/incoming`, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: { incoming: [], outgoing: [] },
      message: error.message || 'Failed to fetch transaction requests'
    };
  }
};

/**
 * Mark transaction status as Completed (buyer or seller)
 */
export const completeTransaction = async (transactionId, token) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/transactions/${transactionId}/complete`,
      {},
      { headers: getAuthHeaders(token) }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to mark transaction as completed'
    };
  }
};
