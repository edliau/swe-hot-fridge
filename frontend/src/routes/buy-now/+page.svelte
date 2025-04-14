<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { productsAPI } from '$lib/api';
    import { cartStore } from '$lib/stores/cart';
    import SearchBar from '$lib/components/SearchBar.svelte';
    
    let productId = $page.url.searchParams.get('product');
    let quantity = parseInt($page.url.searchParams.get('quantity') || '1');
    let isLoading = true;
    let errorMessage = '';
    let product = null;
    
    onMount(async () => {
      if (!productId) {
        errorMessage = 'Product ID is missing. Please go back and try again.';
        isLoading = false;
        return;
      }
      
      try {
        // Fetch product details
        const response = await productsAPI.getProductById(productId);
        if (!response.success) {
          throw new Error('Failed to fetch product details');
        }
        
        product = response.data;
        
        // Add the product to cart
        await cartStore.clearCart(); // First clear the cart
        await cartStore.addItem(productId, quantity);
        
        // Redirect to checkout page
        goto('/checkout');
      } catch (error) {
        console.error('Error in buy now flow:', error);
        errorMessage = error.message || 'Failed to process purchase. Please try again.';
        isLoading = false;
      }
    });
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
    </header>
    
    <!-- Colorful divider -->
    <div class="h-2 bg-gradient-to-r from-cyan-400 via-lime-300 to-yellow-200"></div>
    
    <!-- Main content -->
    <main class="flex-1 p-4 flex justify-center items-center">
      {#if errorMessage}
        <div class="bg-white rounded-lg shadow-md p-6 max-w-md text-center">
          <div class="text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 class="text-xl font-bold mb-2">Error</h1>
          <p class="text-gray-600 mb-4">{errorMessage}</p>
          <button 
            on:click={() => window.history.back()}
            class="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors"
          >
            Go Back
          </button>
        </div>
      {:else if isLoading}
        <div class="text-center">
          <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p class="text-gray-600">Processing your purchase...</p>
        </div>
      {/if}
    </main>
    
    <!-- Footer -->
    <footer class="bg-pink-400 p-4 text-white mt-auto">
      <div class="text-center text-sm">
        &copy; {new Date().getFullYear()} Hot Fridge. All rights reserved.
      </div>
    </footer>
  </div>