// src/lib/stores/cart.js
import { writable, derived } from 'svelte/store';
import { cartAPI } from '$lib/api';
import { authStore } from './auth';
import { browser } from '$app/environment';

// Initial state
const initialState = {
	items: [],
	isLoading: false,
	error: null
};

function createCartStore() {
	const { subscribe, set, update } = writable(initialState);

	// Subscribe to auth state to reset cart on login/logout
	let unsubscribe;
	if (browser) {
		unsubscribe = authStore.subscribe(async ($auth) => {
			if (!$auth.isLoading) {
				await fetchCartItems();
			}
		});
	}

	return {
		subscribe,

		// Fetch cart items
		fetchItems: async () => {
			try {
				update((state) => ({ ...state, isLoading: true, error: null }));

				const result = await cartAPI.getCartItems();

				update((state) => ({
					...state,
					items: result.data && result.data.items ? result.data.items : [],
					isLoading: false
				}));
			} catch (error) {
				console.error('Error fetching cart items:', error);
				update((state) => ({
					...state,
					isLoading: false,
					error: error.message
				}));
			}
		},

		// Add item to cart
		addItem: async (productId, quantity = 1) => {
			try {
				update((state) => ({ ...state, isLoading: true, error: null }));

				const result = await cartAPI.addToCart(productId, quantity);

				update((state) => ({
					...state,
					items: result.data && result.data.items ? result.data.items : state.items,
					isLoading: false
				}));

				return true;
			} catch (error) {
				console.error('Error adding item to cart:', error);
				update((state) => ({
					...state,
					isLoading: false,
					error: error.message
				}));
				return false;
			}
		},

		// Update cart item (quantity or selected status)
		updateItem: async (productId, updates) => {
			try {
				update((state) => ({ ...state, isLoading: true, error: null }));

				const result = await cartAPI.updateCartItem(productId, updates);

				update((state) => ({
					...state,
					items: result.data && result.data.items ? result.data.items : state.items,
					isLoading: false
				}));

				return true;
			} catch (error) {
				console.error('Error updating cart item:', error);
				update((state) => ({
					...state,
					isLoading: false,
					error: error.message
				}));
				return false;
			}
		},

		// Remove item from cart
		removeItem: async (productId) => {
			try {
				update((state) => ({ ...state, isLoading: true, error: null }));

				await cartAPI.removeCartItem(productId);

				update((state) => ({
					...state,
					items: state.items.filter((item) => {
						return item.productId.id.toString() !== productId.toString();
					}),
					isLoading: false
				}));

				return true;
			} catch (error) {
				console.error('Error removing item from cart:', error);
				update((state) => ({
					...state,
					isLoading: false,
					error: error.message
				}));
				return false;
			}
		},

		// Clear entire cart
		clearCart: async () => {
			try {
				update((state) => ({ ...state, isLoading: true, error: null }));

				await cartAPI.clearCart();

				update((state) => ({
					...state,
					items: [],
					isLoading: false
				}));

				return true;
			} catch (error) {
				console.error('Error clearing cart:', error);
				update((state) => ({
					...state,
					isLoading: false,
					error: error.message
				}));
				return false;
			}
		},

		// Update quantities
		updateQuantity: async function (productId, quantity) {
			return this.updateItem(productId, { quantity });
		},

		// Toggle item selection
		toggleSelection: async function (productId, selected) {
			return this.updateItem(productId, { selected });
		},

		// Clear error
		clearError: () => {
			update((state) => ({ ...state, error: null }));
		}
	};
}

// Helper function to fetch cart items
async function fetchCartItems() {
	try {
		const result = await cartAPI.getCartItems();

		return result.data && result.data.items ? result.data.items : [];
	} catch (error) {
		console.error('Error fetching cart items:', error);
		return [];
	}
}

// Create cart store
export const cartStore = createCartStore();

// Derived store for cart total
export const cartTotal = derived(cartStore, ($cart) => {
	const selectedItems = $cart.items.filter((item) => item.selected);

	const itemCount = selectedItems.length;

	const totalAmount = selectedItems.reduce((total, item) => {
		const price = item.productId.isOnSale ? item.productId.discountPrice : item.productId.price;

		return total + price * item.quantity;
	}, 0);

	return {
		itemCount,
		totalAmount
	};
});
