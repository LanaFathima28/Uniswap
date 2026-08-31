import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Helper to extract Cloudinary Cloud Name from env
 */
const getCloudinaryCloudName = () => {
  if (import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
    return import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  }
  const url = import.meta.env.VITE_CLOUDINARY_URL || import.meta.env.CLOUDINARY_URL;
  if (url && url.includes('@')) {
    return url.split('@').pop().replace(/\/$/, '');
  }
  return null;
};

/**
 * Search user directory by keywords (Name, Branch, Year, Company, Designation, Role)
 */
export const searchUsers = async (filters = {}, token) => {
  try {
    const params = new URLSearchParams();
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.role && filters.role !== 'All') params.append('role', filters.role);
    if (filters.branch) params.append('branch', filters.branch);
    if (filters.year) params.append('year', filters.year);
    if (filters.company) params.append('company', filters.company);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/users/search${queryString ? `?${queryString}` : ''}`;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: [],
      message: error.message || 'Failed to search user directory'
    };
  }
};

/**
 * Fetch public user profile by MongoDB _id
 */
export const getUserById = async (userId, token) => {
  try {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await axios.get(`${API_BASE_URL}/users/${userId}`, { headers });
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

/**
 * Update user profile (Name, Branch/Year or Company/Designation, Profile Photo)
 */
export const updateUserProfile = async (userId, updateData, token) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/users/${userId}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to update user profile'
    };
  }
};

/**
 * Fetch private user activity log (Listed, Bought/Rented, Sold/Rented Out)
 */
export const getUserActivity = async (userId, token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/activity`, {
      headers: {
        Authorization: `Bearer ${token}`
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
      message: error.message || 'Failed to fetch user activity'
    };
  }
};

/**
 * Compress raw image file using HTML Canvas (max 1000px, 0.75 quality)
 */
const compressImageFile = (file, maxWidth = 1000, maxHeight = 1000, quality = 0.75) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(event.target.result);
      };
    };
    reader.onerror = () => resolve('');
  });
};

/**
 * Upload image file directly to Cloudinary via unsigned upload preset
 */
export const uploadToCloudinary = async (file) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'docs_upload_example_us_preset';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

  try {
    const response = await axios.post(cloudinaryUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (response.data && response.data.secure_url) {
      return response.data.secure_url;
    }
    throw new Error('Cloudinary upload response missing secure_url');
  } catch (error) {
    console.warn('Cloudinary API upload encountered error, compressing and using data URL fallback:', error?.message || error);
    const compressedDataUrl = await compressImageFile(file);
    if (compressedDataUrl) {
      return compressedDataUrl;
    }
    throw new Error('Failed to process or compress selected image file');
  }
};
