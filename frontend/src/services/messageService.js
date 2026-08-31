import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Helper to get authorization header
 */
const getAuthHeaders = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Send a chat message for an accepted or completed transaction
 */
export const sendMessage = async ({ transactionId, receiverId, text }, token) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/messages`,
      { transactionId, receiverId, text },
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
      message: error.message || 'Failed to send message'
    };
  }
};

/**
 * Fetch all active chat conversations for the logged-in user
 */
export const getConversations = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/messages/conversations`, {
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
      message: error.message || 'Failed to fetch conversations'
    };
  }
};

/**
 * Fetch chat message history for a specific transaction
 */
export const getMessagesForTransaction = async (transactionId, token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/messages/transaction/${transactionId}`, {
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
      message: error.message || 'Failed to fetch transaction messages'
    };
  }
};

/**
 * Mark all unread messages in a transaction as read
 */
export const markMessagesAsRead = async (transactionId, token) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/messages/transaction/${transactionId}/read`,
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
      message: error.message || 'Failed to mark messages as read'
    };
  }
};
