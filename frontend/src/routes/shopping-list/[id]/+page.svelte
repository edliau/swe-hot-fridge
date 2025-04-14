<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { productsAPI, shoppingListsAPI } from '$lib/api';
    import { authStore } from '$lib/stores/auth';
    import { cartStore } from '$lib/stores/cart';
    
    // Get list ID from URL
    const listId = $page.params.id;
    
    // State variables
    let shoppingList = null;
    let products = [];
    let isLoading = true;
    let errorMessage = '';
    let searchTerm = '';
    let searchResults = [];
    let isSearching = false;
    let selectedProduct = null;
    let isAddingToList = false;
    
    // Subscribe to auth store
    $: isAuthenticated = $authStore.isAuthenticated;
    $: if (!isAuthenticated && !$authStore.isLoading) {
      // Redirect to login if not authenticated
      goto('/account');
    }
    
    onMount(async () => {
      if (!isAuthenticated || !listId) return;
      
      try {
        isLoading = true;
        
        // Fetch the shopping list details
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/shopping-lists/${listId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch shopping list details');
          }
          
          const result = await response.json();
          shoppingList = result.data;
          
          // If the list has items, fetch product details for each item
          if (shoppingList?.items && shoppingList.items.length > 0) {
            const productDetailsPromises = shoppingList.items.map(productId => 
              productsAPI.getProductById(productId)
            );
            
            const productResults = await Promise.all(productDetailsPromises);
            products = productResults
              .filter(result => result.success)
              .map(result => result.data);
          }
        } catch (error) {
          console.error('Error fetching shopping list:', error);
          errorMessage = error.message || 'Failed to load shopping list data';
        }
      } catch (error) {
        console.error('Error:', error);
        errorMessage = error.message || 'An error occurred';
      } finally {
        isLoading = false;
      }
    });
    
    // Search for products to add to list
    async function searchProducts() {
      if (!searchTerm.trim()) {
        searchResults = [];
        return;
      }
      
      try {
        isSearching = true;
        
        const response = await productsAPI.getProducts({ 
          search: searchTerm,
          limit: 5
        });
        
        if (response.success) {
          searchResults = response.data || [];
        }
      } catch (error) {
        console.error('Error searching products:', error);
      } finally {
        isSearching = false;
      }
    }
    
    // Select a product to add to the list
    function selectProduct(product) {
      selectedProduct = product;
      searchResults = [];
      searchTerm = product.name;
    }
    
    // Add selected product to the shopping list
    async function addProductToList() {
      if (!selectedProduct) return;
      
      try {
        isAddingToList = true;
        
        // Call API to update the shopping list
        const updatedList = { 
          ...shoppingList,
          items: [...(shoppingList.items || []), selectedProduct._id]
        };
        
        const response = await shoppingListsAPI.updateList(listId, updatedList);
        
        if (response.success) {
          // Update the local shopping list data
          shoppingList = response.data;
          
          // Add product to the products array
          products = [...products, selectedProduct];
          
          // Reset selection
          selectedProduct = null;
          searchTerm = '';
        }
      } catch (error) {
        console.error('Error adding product to list:', error);
        errorMessage = error.message || 'Failed to add product to list';
      } finally {
        isAddingToList = false;
      }
    }
    
    // Remove product from shopping list
    async function removeProductFromList(productId) {
      try {
        // Update the shopping list
        const updatedList = { 
          ...shoppingList,
          items: shoppingList.items.filter(item => item !== productId)
        };
        
        const response = await shoppingListsAPI.updateList(listId, updatedList);
        
        if (response.success) {
          // Update the local shopping list data
          shoppingList = response.data;
          
          // Remove product from the products array
          products = products.filter(product => product._id !== productId);
        }
      } catch (error) {
        console.error('Error removing product from list:', error);
        errorMessage = error.message || 'Failed to remove product from list';
      }
    }
    
    // Add all list items to cart
    async function addAllToCart() {
      if (!products.length) return;
      
      try {
        // Add each product to the cart with quantity 1
        for (const product of products) {
          await cartStore.addItem(product._id, 1);
        }
        
        goto('/cart');
      } catch (error) {
        console.error('Error adding products to cart:', error);
        errorMessage = error.message || 'Failed to add products to cart';
      }
    }
    
    // Update shopping list name and description
    async function updateList() {
      try {
        const response = await shoppingListsAPI.updateList(listId, {
          name: shoppingList.name,
          description: shoppingList.description
        });
        
        if (response.success) {
          shoppingList = response.data;
        }
      } catch (error) {
        console.error('Error updating shopping list:', error);
        errorMessage = error.message || 'Failed to update shopping list';
      }
    }
    
    // Format price for display
    function formatPrice(price) {
      return `$${price.toFixed(2)}`;
    }
  </script>
  
  <div class="min-h-screen flex flex-col">
    <header class="bg-pink-400 p-4 flex items-center justify-between">
      <div class="flex items-center">
        <a href="/" class="flex items-center">
          <h1 class="text-2xl font-bold text-white mr-2">Hot<br>Fridge</h1>
          <div class="h-12 w-12 bg-green-200 rounded-md flex items-center justify-center text-xs text-gray-600 font-bold">
            Logo
          </div>
        </a>
      </div>
      </header>
      <div class="flex-1 mx-4">
        <div class="relative">
          <input
            type="text"
            placeholder="Search for product"
            class="w-full rounded-full py-2 px-10 border-2 border-gray-300 focus:outline-none"
          />
          <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div class="flex items-center">
        <a href="/account" class="mx-2" aria-label="Account">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </a>
        <a href="/favourites" class="mx-2" aria-label="Favourites">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </a>
        <a href="/cart" class="mx-2" aria-label="Shopping Cart">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </a>
    </div>
</div>