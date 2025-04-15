// src/lib/api.js
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Base API class to handle fetch requests
 */
class API {
	/**
	 * Generic fetch method with error handling
	 * @param {string} endpoint - API endpoint
	 * @param {Object} options - Fetch options
	 * @returns {Promise<any>} - Response data
	 */
	async fetchJSON(endpoint, options = {}) {
		const headers = {
			'Content-Type': 'application/json',
			...options.headers
		};

		const token = localStorage.getItem('token');
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}

		const config = {
			...options,
			headers,
			credentials: 'include' // For cookies to be sent
		};

		try {
			const response = await fetch(`${API_URL}${endpoint}`, config);

			// Handle non-JSON responses
			const contentType = response.headers.get('content-type');
			if (!contentType || !contentType.includes('application/json')) {
				if (!response.ok) {
					throw new Error(`Network error: ${response.status} ${response.statusText}`);
				}
				return { success: true };
			}

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || data.message || 'Something went wrong');
			}

			return data;
		} catch (error) {
			console.error('API Error:', error);
			throw error;
		}
	}

	// GET request
	get(endpoint, options = {}) {
		return this.fetchJSON(endpoint, {
			...options,
			method: 'GET'
		});
	}

	// POST request
	post(endpoint, data, options = {}) {
		return this.fetchJSON(endpoint, {
			...options,
			method: 'POST',
			body: JSON.stringify(data)
		});
	}

	// PUT request
	put(endpoint, data, options = {}) {
		return this.fetchJSON(endpoint, {
			...options,
			method: 'PUT',
			body: JSON.stringify(data)
		});
	}

	// DELETE request
	delete(endpoint, options = {}) {
		return this.fetchJSON(endpoint, {
			...options,
			method: 'DELETE'
		});
	}
}

// Auth API Service
export const authAPI = {
	register: (userData) => new API().post('/auth/register', userData),
	login: (credentials) => new API().post('/auth/login', credentials),
	logout: () => new API().get('/auth/logout'),
	getCurrentUser: () => new API().get('/auth/me'),
	updateUserDetails: (userData) => new API().put('/auth/updatedetails', userData),
	updatePassword: (passwordData) => new API().put('/auth/updatepassword', passwordData),
	forgotPassword: (email) => new API().post('/auth/forgotpassword', { email }),
	resetPassword: (token, password) => new API().put(`/auth/resetpassword/${token}`, { password })
};

// Products API Service
export const productsAPI = {
	getProducts: (params = {}) => {
		const queryParams = new URLSearchParams();
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				queryParams.append(key, value);
			}
		});
		return new API().get(`/products?${queryParams.toString()}`);
	},
	getProductById: (id) => new API().get(`/products/${id}`),
	getFeaturedProducts: () => new API().get('/products/featured'),
	getProductsOnSale: () => new API().get('/products/on-sale'),
	addProductRating: (id, ratingData) => new API().post(`/products/${id}/ratings`, ratingData)
};

// Category API Service
export const categoryAPI = {
	getAllCategories: () => new API().get('/categories'),
	getCategoryById: (id) => new API().get(`/categories/${id}`),
	createCategory: (data) => new API().post('/categories', data),
	updateCategory: (id, data) => new API().put(`/categories/${id}`, data),
	deleteCategory: (id) => new API().delete(`/categories/${id}`),
	getProductsByCategory: (categoryId) => new API().get(`/categories/${categoryId}/products`)
};

// Cart API Service
export const cartAPI = {
	getCartItems: () => new API().get('/cart/items'),
	addToCart: (productId, quantity) => new API().post('/cart/items', { productId, quantity }),
	updateCartItem: (productId, updates) => new API().put(`/cart/items/${productId}`, updates),
	removeCartItem: (productId) => new API().delete(`/cart/items/${productId}`),
	clearCart: () => new API().delete('/cart/items'),
	getCartTotal: () => new API().get('/cart/total'),
	transferGuestCart: (guestId) => new API().post('/cart/transfer', { guestId })
};

// favourites API Service
export const favouritesAPI = {
	getfavourites: () => new API().get('/favourites'),
	addTofavourites: (productId) => new API().post('/favourites', { productId }),
	removeFromfavourites: (id) => new API().delete(`/favourites/${id}`),
	checkfavourite: (productId) => new API().get(`/favourites/check/${productId}`)
};

// Categories API Service
export const categoriesAPI = {
	getCategories: () => new API().get('/categories')
};

// Promotions API Service
export const promotionsAPI = {
	getPromotions: () => new API().get('/promotions')
};

// Order API Service
export const orderAPI = {
	createOrder: (orderData) => new API().post('/orders', orderData),
	updateOrderStatus: (id, status) => new API().put(`/orders/${id}/status`, { status }),
	cancelOrder: (id) => new API().delete(`/orders/${id}`),
	processRefund: (id) => new API().post(`/orders/${id}/refund`)
};

// Payment API Service
export const paymentAPI = {
	createPaymentIntent: (paymentData) =>
		new API().post('/payments/create-payment-intent', paymentData)
};

// Shopping Lists API Service
export const shoppingListsAPI = {
  getLists: () => new API().get('/shopping-lists'),
  
  createList: (listData) => new API().post('/shopping-lists', listData),
  
  getList: (id) => new API().get(`/shopping-lists/${id}`),
  
  // Enhanced update method to handle structured items with quantities
  updateList: (id, listData) => {
    // If listData contains items array with product objects, convert to proper format
    if (listData.items && Array.isArray(listData.items)) {
      // Check if the items are in the structured format (with product objects)
      if (listData.items.some(item => item.product)) {
        // Convert to the format expected by the API
        listData.items = listData.items.map(item => ({
          productId: item.product._id || item.productId,
          quantity: item.quantity || 1,
          notes: item.notes || ''
        }));
      }
    }
    
    return new API().put(`/shopping-lists/${id}`, listData);
  },
  
  deleteList: (id) => new API().delete(`/shopping-lists/${id}`),
  
  // Add item to list with quantity
  addItemToList: (listId, productId, quantity = 1, notes = '') => {
    return new API().post(`/shopping-lists/${listId}/items`, {
      productId,
      quantity,
      notes
    });
  },
  
  // Remove item from list
  removeItemFromList: (listId, productId) => {
    return new API().delete(`/shopping-lists/${listId}/items/${productId}`);
  },
  
  // Update item quantity
  updateItemQuantity: (listId, productId, quantity) => {
    return new API().put(`/shopping-lists/${listId}/items/${productId}`, { quantity });
  }
};

// Export a default API instance
export default new API();
