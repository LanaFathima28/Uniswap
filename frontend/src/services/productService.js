import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Helper to get authorization headers
 */
const getAuthHeaders = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Create a new product listing
 */
export const createProduct = async (productData, token) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/products`, productData, {
      headers: getAuthHeaders(token)
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      if (typeof error.response.data === 'object' && error.response.data.message) {
        return error.response.data;
      }
      if (typeof error.response.data === 'string') {
        return { success: false, data: null, message: error.response.data };
      }
    }
    return {
      success: false,
      data: null,
      message: error.message || 'Failed to create product listing'
    };
  }
};

/**
 * Get products with search & filter parameters
 * filters: { keyword, category, minCost, maxCost, listingType }
 */
export const getProducts = async (filters = {}, token) => {
  try {
    const params = new URLSearchParams();
    if (filters.keyword) params.append('keyword', filters.keyword);
    if (filters.category && filters.category !== 'All') params.append('category', filters.category);
    if (filters.listingType && filters.listingType !== 'All') params.append('listingType', filters.listingType);
    if (filters.minCost !== undefined && filters.minCost !== '') params.append('minCost', filters.minCost);
    if (filters.maxCost !== undefined && filters.maxCost !== '') params.append('maxCost', filters.maxCost);

    const queryString = params.toString();
    const url = `${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`;

    const response = await axios.get(url, {
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
      message: error.message || 'Failed to fetch products'
    };
  }
};

/**
 * Fetch a single product full detail by ID
 */
export const getProductById = async (id, token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/${id}`, {
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
      message: error.message || 'Failed to fetch product details'
    };
  }
};

/**
 * Edit/Update own product listing
 */
export const updateProduct = async (id, updateData, token) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}/products/${id}`, updateData, {
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
      message: error.message || 'Failed to update product listing'
    };
  }
};

/**
 * Update product status explicitly (Available, Sold, Rented)
 */
export const updateProductStatus = async (id, status, token) => {
  try {
    const response = await axios.patch(
      `${API_BASE_URL}/products/${id}/status`,
      { status },
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
      message: error.message || 'Failed to update product status'
    };
  }
};

/**
 * Delete own product listing
 */
export const deleteProduct = async (id, token) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/products/${id}`, {
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
      message: error.message || 'Failed to delete product listing'
    };
  }
};

/**
 * Fetch all listings owned by the logged-in user
 */
export const getMyProducts = async (token) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/mine`, {
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
      message: error.message || 'Failed to fetch your product listings'
    };
  }
};
