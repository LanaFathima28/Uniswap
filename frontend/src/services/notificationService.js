import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getAuthHeaders = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Fetch notifications list and unread count for logged in user
 */
export const getNotifications = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/notifications`, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: { notifications: [], unreadCount: 0 },
      message: error.message || 'Failed to fetch notifications'
    };
  }
};

/**
 * Mark a single notification as read
 */
export const markNotificationRead = async (notificationId, token) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/notifications/${notificationId}/read`,
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
      message: error.message || 'Failed to mark notification read'
    };
  }
};

/**
 * Mark all notifications for logged in user as read
 */
export const markAllNotificationsRead = async (token) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/notifications/read-all`,
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
      message: error.message || 'Failed to mark all notifications read'
    };
  }
};
