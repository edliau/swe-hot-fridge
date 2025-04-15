// src/routes/category/[id]/+page.server.js
import { productsAPI } from '$lib/api';

/** @type {import('./$types').PageServerLoad} */
export async function load({ params }) {
	try {
		// Fetch category details
		const categoryResponse = await productsAPI.getCategoryById(params.id);
		if (!categoryResponse.success) {
			return {
				error: 'Failed to load category'
			};
		}

		// Fetch products for this category
		const productsResponse = await productsAPI.getProductsByCategory(params.id);
		if (!productsResponse.success) {
			return {
				category: categoryResponse.data,
				error: 'Failed to load products'
			};
		}

		return {
			category: categoryResponse.data,
			products: productsResponse.data
		};
	} catch (error) {
		console.error('Error loading category page:', error);
		return {
			error: error.message || 'An error occurred while loading the category'
		};
	}
}
