<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { productsAPI, shoppingListsAPI } from '$lib/api';
    import { authStore } from '$lib/stores/auth';
    import { cartStore } from '$lib/stores/cart';
    import SearchBar from '$lib/components/SearchBar.svelte';
    import { fuzzySearchProducts } from '$lib/utils/fuzzySearch';
    
    // Get list ID from URL
    const listId = $page.params.id;
    
    // State variables
    let shoppingList = null;
    let listItems = []; // Will store products with quantities
    let isLoading = true;
    let errorMessage = '';
    let successMessage = '';
    let searchTerm = '';
    let searchResults = [];
    let isSearching = false;
    let selectedProduct = null;
    let selectedQuantity = 1;
    let isAddingToList = false;
    let isEditMode = false;
    let editItemId = null;
    let editItemQuantity = 1;
    let allProducts = [];
    let fuzzySuggestions = [];

    
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
        await loadShoppingList();

        const response = await productsAPI.getProducts({ limit: 1000 }); // or use pagination
        if (response.success) {
          allProducts = response.data;
        }
      } catch (error) {
        console.error('Error:', error);
        errorMessage = error.message || 'An error occurred';
      } finally {
        isLoading = false;
      }
    });
    
    async function loadShoppingList() {
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
        
        // Reset list items
        listItems = [];
        
        // If the list has items array, fetch product details for each item
        if (shoppingList?.items && Array.isArray(shoppingList.items)) {
          // Look for items that have productId and quantity (new format)
          const hasStructuredItems = shoppingList.items.some(item => 
            item && typeof item === 'object' && item.productId);
          
          if (hasStructuredItems) {
            // New format with quantities
            for (const item of shoppingList.items) {
              try {
                const productResponse = await productsAPI.getProductById(item.productId);
                if (productResponse.success) {
                  listItems.push({
                    product: productResponse.data,
                    quantity: item.quantity || 1,
                    notes: item.notes || ''
                  });
                }
              } catch (error) {
                console.error(`Error fetching product ${item.productId}:`, error);
              }
            }
          } else {
            // Old format (just product IDs)
            for (const productId of shoppingList.items) {
              try {
                const productResponse = await productsAPI.getProductById(productId);
                if (productResponse.success) {
                  listItems.push({
                    product: productResponse.data,
                    quantity: 1,
                    notes: ''
                  });
                }
              } catch (error) {
                console.error(`Error fetching product ${productId}:`, error);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching shopping list:', error);
        throw error;
      }
    }
    
    // Search for products to add to list
    async function searchProducts() {
      if (!searchTerm.trim()) {
        searchResults = [];
        fuzzySuggestions = [];
        return;
      }

      try {
        isSearching = true;

        const { matches, suggestions } = fuzzySearchProducts(searchTerm.trim(), allProducts);
        searchResults = matches;
        fuzzySuggestions = suggestions;

      } catch (error) {
        console.error('Error during fuzzy search:', error);
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
        
        // Check if this product is already in the list
        const existingItemIndex = listItems.findIndex(item => 
          item.product._id === selectedProduct._id);
        
        if (existingItemIndex >= 0) {
          // Product already exists, update quantity instead
          const existingItem = listItems[existingItemIndex];
          existingItem.quantity += selectedQuantity;
          
          // Update the list items array
          listItems = [...listItems];
        } else {
          // Add new product to list items
          listItems = [...listItems, {
            product: selectedProduct,
            quantity: selectedQuantity,
            notes: ''
          }];
        }
        
        // Prepare the new items array for the API
        const updatedItems = listItems.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          notes: item.notes
        }));
        
        // Update the list in the database
        const response = await shoppingListsAPI.updateList(listId, {
          ...shoppingList,
          items: updatedItems
        });
        
        if (response.success) {
          // Update the local shopping list data
          shoppingList = response.data;
          
          // Reset selection
          selectedProduct = null;
          selectedQuantity = 1;
          searchTerm = '';
          
          // Show success message
          successMessage = 'Product added to list';
          setTimeout(() => { successMessage = ''; }, 3000);
        }
      } catch (error) {
        console.error('Error adding product to list:', error);
        errorMessage = error.message || 'Failed to add product to list';
        setTimeout(() => { errorMessage = ''; }, 5000);
      } finally {
        isAddingToList = false;
      }
    }
    
    // Remove product from shopping list
    async function removeProductFromList(productId) {
      try {
        // Remove from the local list
        listItems = listItems.filter(item => item.product._id !== productId);
        
        // Prepare the new items array for the API
        const updatedItems = listItems.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          notes: item.notes
        }));
        
        // Update the list in the database
        const response = await shoppingListsAPI.updateList(listId, {
          ...shoppingList,
          items: updatedItems
        });
        
        if (response.success) {
          // Update the local shopping list data
          shoppingList = response.data;
          
          // Show success message
          successMessage = 'Product removed from list';
          setTimeout(() => { successMessage = ''; }, 3000);
        }
      } catch (error) {
        console.error('Error removing product from list:', error);
        errorMessage = error.message || 'Failed to remove product from list';
        setTimeout(() => { errorMessage = ''; }, 5000);
      }
    }
    
    // Edit product quantity
    function startEditItem(item) {
      editItemId = item.product._id;
      editItemQuantity = item.quantity;
      isEditMode = true;
    }
    
    // Save edited quantity
    async function saveEditedItem() {
      if (!editItemId) return;
      
      try {
        // Find and update the item in the local list
        const itemIndex = listItems.findIndex(item => item.product._id === editItemId);
        if (itemIndex >= 0) {
          listItems[itemIndex].quantity = editItemQuantity;
          
          // Create updated array for API
          const updatedItems = listItems.map(item => ({
            productId: item.product._id,
            quantity: item.quantity,
            notes: item.notes
          }));
          
          // Update the list in the database
          const response = await shoppingListsAPI.updateList(listId, {
            ...shoppingList,
            items: updatedItems
          });
          
          if (response.success) {
            // Update the local shopping list data
            shoppingList = response.data;
            
            // Show success message
            successMessage = 'Quantity updated';
            setTimeout(() => { successMessage = ''; }, 3000);
          }
        }
      } catch (error) {
        console.error('Error updating product quantity:', error);
        errorMessage = error.message || 'Failed to update quantity';
        setTimeout(() => { errorMessage = ''; }, 5000);
      } finally {
        // Reset edit mode
        isEditMode = false;
        editItemId = null;
        editItemQuantity = 1;
      }
    }
    
    // Cancel editing
    function cancelEdit() {
      isEditMode = false;
      editItemId = null;
      editItemQuantity = 1;
    }
    
    // Add all list items to cart
    async function addAllToCart() {
      if (!listItems.length) return;
      
      try {
        // Add each product to the cart with the specified quantity
        for (const item of listItems) {
          await cartStore.addItem(item.product._id, item.quantity);
        }
        
        successMessage = 'All items added to cart';
        setTimeout(() => {
          goto('/cart');
        }, 1000);
      } catch (error) {
        console.error('Error adding products to cart:', error);
        errorMessage = error.message || 'Failed to add products to cart';
        setTimeout(() => { errorMessage = ''; }, 5000);
      }
    }
    
    // Add a single item to cart
    async function addItemToCart(item) {
      try {
        await cartStore.addItem(item.product._id, item.quantity);
        successMessage = 'Item added to cart';
        setTimeout(() => { successMessage = ''; }, 3000);
      } catch (error) {
        console.error('Error adding product to cart:', error);
        errorMessage = error.message || 'Failed to add product to cart';
        setTimeout(() => { errorMessage = ''; }, 5000);
      }
    }
    
    // Update shopping list name and description
    async function updateList() {
      try {
        // Preserve the existing items when updating the list metadata
        const updatedItems = listItems.map(item => ({
          productId: item.product._id,
          quantity: item.quantity,
          notes: item.notes
        }));
        
        const response = await shoppingListsAPI.updateList(listId, {
          name: shoppingList.name,
          description: shoppingList.description,
          items: updatedItems
        });
        
        if (response.success) {
          shoppingList = response.data;
          successMessage = 'Shopping list updated';
          setTimeout(() => { successMessage = ''; }, 3000);
        }
      } catch (error) {
        console.error('Error updating shopping list:', error);
        errorMessage = error.message || 'Failed to update shopping list';
        setTimeout(() => { errorMessage = ''; }, 5000);
      }
    }
    
    // Format price for display
    function formatPrice(price) {
      return `$${price.toFixed(2)}`;
    }
</script>

<div class="min-h-screen flex flex-col">
  <!-- Header -->
  <header class="bg-pink-400 p-4 flex items-center justify-between">
    <div class="flex items-center">
      <a href="/" class="flex items-center">
        <h1 class="text-2xl font-bold text-white mr-2">Hot<br>Fridge</h1>
        <img 
        src="/images/logo/logo.png" 
        alt="Hot Fridge Logo" 
        class="h-12 w-12 rounded-md"
        />
      </a>
    </div>
    
    <div class="flex-1 mx-4">
      <SearchBar />
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
  </header>
  
  <!-- Colorful divider -->
  <div class="h-2 bg-gradient-to-r from-cyan-400 via-lime-300 to-yellow-200"></div>
  
  <!-- Main content -->
  <main class="flex-1 p-4 max-w-4xl mx-auto">
    {#if errorMessage}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
        <span>{errorMessage}</span>
        <button on:click={() => errorMessage = ''} class="text-red-700" aria-label="Close error message">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    {/if}
    
    {#if successMessage}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
        <span>{successMessage}</span>
        <button on:click={() => successMessage = ''} class="text-green-700" aria-label="Close success message">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    {/if}
    
    <!-- Back button -->
    <div class="mb-4">
      <a 
        href="/dashboard"
        class="inline-flex items-center text-gray-600 hover:text-gray-900"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Dashboard
      </a>
    </div>
    
    {#if isLoading}
      <div class="flex justify-center items-center py-10">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500" aria-label="Loading"></div>
      </div>
    {:else if !shoppingList}
      <div class="text-center py-10">
        <p class="text-gray-600">Shopping list not found</p>
      </div>
    {:else}
      <!-- Shopping list header -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div class="flex-1">
            <input 
              type="text"
              bind:value={shoppingList.name}
              class="w-full text-xl font-bold p-2 border border-gray-300 rounded"
              on:blur={updateList}
              aria-label="Shopping list name"
            />
            <textarea 
              bind:value={shoppingList.description}
              placeholder="Add a description (optional)"
              class="w-full mt-2 p-2 border border-gray-300 rounded text-gray-600 text-sm"
              rows="2"
              on:blur={updateList}
              aria-label="Shopping list description"
            ></textarea>
          </div>
          <div class="flex flex-col gap-2">
            <button 
              on:click={addAllToCart}
              disabled={!listItems.length}
              class="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Add All to Cart
            </button>
          </div>
        </div>
      </div>
      
      <!-- Add product form -->
      <div class="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 class="text-lg font-bold mb-4">Add Product to List</h2>
        
        <div class="mb-4">
          <label for="searchTerm" class="block mb-1 text-sm font-medium">Search for products</label>
          <div class="relative">
            <input 
              type="text"
              id="searchTerm"
              bind:value={searchTerm}
              on:input={searchProducts}
              placeholder="Type to search products"
              class="w-full p-2 pr-10 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-pink-400"
            />
            {#if isSearching}
              <div class="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div class="animate-spin h-4 w-4 border-2 border-pink-400 rounded-full border-t-transparent" aria-label="Searching"></div>
              </div>
            {:else if searchTerm}
              <button 
                on:click={() => { searchTerm = ''; searchResults = []; }}
                class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            {/if}
          </div>
          
          <!-- Search results -->
          {#if searchResults.length > 0}
            <div class="mt-2 border border-gray-200 rounded overflow-hidden">
              {#each searchResults as product}
                <button 
                  type="button"
                  on:click={() => selectProduct(product)}
                  class="w-full p-2 flex items-center hover:bg-gray-50 border-b last:border-b-0"
                  aria-label="Select {product.name}"
                >
                  <div class="h-10 w-10 bg-gray-100 mr-2 flex items-center justify-center rounded">
                    {#if product.image}
                      <img src={product.image} alt={product.name} class="h-8 w-8 object-contain">
                    {:else}
                      <div class="text-xs text-gray-500">{product.name.charAt(0)}</div>
                    {/if}
                  </div>
                  <div class="flex-1 text-left">
                    <div class="font-medium">{product.name}</div>
                    <div class="text-sm text-gray-500">{formatPrice(product.price)}</div>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
        
        {#if selectedProduct}
          <div class="mb-4 p-3 border border-gray-200 rounded bg-gray-50">
            <div class="flex items-center mb-2">
              <div class="h-12 w-12 bg-gray-100 mr-3 flex items-center justify-center rounded">
                {#if selectedProduct.image}
                  <img src={selectedProduct.image} alt={selectedProduct.name} class="h-10 w-10 object-contain">
                {:else}
                  <div class="text-sm text-gray-500">{selectedProduct.name.charAt(0)}</div>
                {/if}
              </div>
              <div>
                <div class="font-medium">{selectedProduct.name}</div>
                <div class="text-sm text-gray-500">{formatPrice(selectedProduct.price)}</div>
              </div>
            </div>
            
            <div class="flex items-center">
              <label for="quantity" class="block mr-3 text-sm font-medium">Quantity:</label>
              <div class="flex items-center">
                <button 
                  on:click={() => selectedQuantity = Math.max(1, selectedQuantity - 1)}
                  class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                  aria-label="Decrease quantity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                  </svg>
                </button>
                
                <input 
                  type="number"
                  id="quantity"
                  bind:value={selectedQuantity}
                  min="1"
                  class="mx-2 w-16 p-1 text-center border border-gray-300 rounded"
                  aria-label="Product quantity"
                />
                
                <button 
                  on:click={() => selectedQuantity += 1}
                  class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                  aria-label="Increase quantity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end">
            <button 
              on:click={() => {selectedProduct = null; searchTerm = '';}}
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 mr-2"
            >
              Cancel
            </button>
            <button 
              on:click={addProductToList}
              disabled={isAddingToList}
              class="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors disabled:opacity-50"
            >
              {#if isAddingToList}
                <div class="flex items-center">
                  <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" aria-hidden="true"></div>
                  Adding...
                </div>
              {:else}
                Add to List
              {/if}
            </button>
          </div>
        {/if}
      </div>
      
      <!-- Shopping list items -->
      <div class="bg-white rounded-lg shadow-md overflow-hidden">
        <div class="border-b p-4 bg-pink-50">
          <h2 class="text-lg font-bold">Shopping List Items ({listItems.length})</h2>
        </div>
        
        {#if listItems.length === 0}
          <div class="p-6 text-center text-gray-500">
            <p>No items in this list yet.</p>
            <p class="mt-2 text-sm">Search for products above to add them to your list.</p>
          </div>
        {:else}
          <div class="divide-y">
            {#each listItems as item}
              <div class="p-4 hover:bg-gray-50">
                <div class="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div class="flex items-center flex-1">
                    <div class="h-16 w-16 bg-gray-100 rounded flex items-center justify-center mr-3">
                      {#if item.product.image}
                        <img src={item.product.image} alt={item.product.name} class="h-14 w-14 object-contain">
                      {:else}
                        <div class="text-gray-500">{item.product.name.charAt(0)}</div>
                      {/if}
                    </div>
                    <div class="flex-1">
                      <div class="font-medium">{item.product.name}</div>
                      <div class="text-sm text-gray-600">{item.product.description?.substring(0, 60)}...</div>
                      <div class="text-sm font-medium mt-1">
                        {#if item.product.isOnSale && item.product.discountPrice}
                          <span class="line-through text-gray-500 mr-1">{formatPrice(item.product.price)}</span>
                          <span class="text-red-600">{formatPrice(item.product.discountPrice)}</span>
                        {:else}
                          <span>{formatPrice(item.product.price)}</span>
                        {/if}
                      </div>
                    </div>
                  </div>
                  
                  <div class="flex flex-col sm:flex-row items-center gap-2">
                    <!-- Quantity editor -->
                    {#if isEditMode && editItemId === item.product._id}
                      <div class="flex items-center">
                        <input 
                          type="number"
                          bind:value={editItemQuantity}
                          min="1"
                          class="w-16 p-1 text-center border border-gray-300 rounded"
                        />
                        <div class="flex ml-2">
                          <button 
                            on:click={saveEditedItem}
                            class="p-1 text-green-600 hover:text-green-800"
                            title="Save quantity"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button 
                            on:click={cancelEdit}
                            class="p-1 text-red-600 hover:text-red-800"
                            title="Cancel"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    {:else}
                      <div 
                        class="px-3 py-1 bg-gray-100 rounded-full flex items-center cursor-pointer"
                        on:click={() => startEditItem(item)}
                        title="Click to edit quantity"
                      >
                        <span class="font-medium mr-1 text-gray-700">Qty: {item.quantity}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                    {/if}
                    
                    <div class="flex">
                      <button 
                        on:click={() => addItemToCart(item)}
                        class="mr-2 p-2 bg-pink-100 text-pink-600 rounded-full hover:bg-pink-200"
                        title="Add to cart"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                      
                      <button 
                        on:click={() => removeProductFromList(item.product._id)}
                        class="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                        title="Remove from list"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                {#if item.notes}
                  <div class="mt-2 text-sm text-gray-600 border-t pt-2">
                    <span class="font-medium">Notes:</span> {item.notes}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </main>
  
  <!-- Footer -->
  <footer class="bg-pink-400 p-4 text-white mt-8">
    <div class="grid grid-cols-3 gap-4">
      <div>
        <h3 class="font-bold mb-2">Need help?</h3>
        <p class="text-sm">24/7 hotline: +65 4823 4328</p>
        <p class="text-sm">customerqueries@hotfridge.com</p>
      </div>
      
      <div>
        <h3 class="font-bold mb-2">Customer</h3>
        <ul class="text-sm">
          <li><a href="/account" class="hover:underline">My account</a></li>
          <li><a href="/cart" class="hover:underline">Shopping cart</a></li>
          <li><a href="/account/orders" class="hover:underline">Past orders</a></li>
          <li><a href="/account/returns" class="hover:underline">Return orders</a></li>
          <li><a href="/favourites" class="hover:underline">Favourites</a></li>
        </ul>
      </div>
      
      <div>
        <h3 class="font-bold mb-2">Information</h3>
        <ul class="text-sm">
          <li><a href="/about" class="hover:underline">About us</a></li>
          <li><a href="/contact" class="hover:underline">Contact us</a></li>
          <li><a href="/shipping" class="hover:underline">Shipping & delivery</a></li>
          <li><a href="/privacy" class="hover:underline">Privacy Policy</a></li>
          <li><a href="/terms" class="hover:underline">Terms of Use</a></li>
        </ul>
      </div>
    </div>
    
    <div class="mt-4 flex justify-end items-center">
      <div class="text-right mr-2">
        <div class="text-xl font-bold">Hot<br>Fridge</div>
        <div class="text-xs">Fresh produce at the<br>click of a finger</div>
      </div>
      <img 
      src="/images/logo/logo.png" 
      alt="Hot Fridge Logo" 
      class="h-12 w-12 rounded-md"
      />
    </div>
  </footer>
</div>