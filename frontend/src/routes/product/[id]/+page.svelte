<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { productsAPI } from '$lib/api';
    import { cartStore } from '$lib/stores/cart';
    import { authStore } from '$lib/stores/auth';
    import { favouritesAPI } from '$lib/api';
    import { get } from 'svelte/store';

    const productId = get(page).params.id;
    let product = null;
    let isLoading = true;
    let errorMessage = '';
    let quantity = 1;
    let isfavourite = false;
    let isAddingToCart = false;
    let addToCartSuccess = false;
    
    // Check if user is authenticated
    $: isAuthenticated = $authStore.isAuthenticated;
    
    onMount(async () => {
      try {
        isLoading = true;
        
        // Fetch product details
        const response = await productsAPI.getProductById(productId);
        if (!response.success) {
          throw new Error('Failed to fetch product details');
        }
        
        product = response.data;
        
        // Check if product is in favourites if user is authenticated
        if (isAuthenticated) {
          try {
            const favouriteResponse = await favouritesAPI.checkfavourite(productId);
            isfavourite = favouriteResponse.isfavourite;
          } catch (error) {
            console.error('Error checking favourite status:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        errorMessage = error.message || 'Failed to load product details';
      } finally {
        isLoading = false;
      }
    });
    
    // Handle Add to Cart action
    async function addToCart() {
      try {
        isAddingToCart = true;
        const success = await cartStore.addItem(productId, quantity);
        
        if (success) {
          addToCartSuccess = true;
          setTimeout(() => {
            addToCartSuccess = false;
          }, 3000);
        }
      } catch (error) {
        console.error('Error adding to cart:', error);
        errorMessage = error.message || 'Failed to add product to cart';
      } finally {
        isAddingToCart = false;
      }
    }
    
    // Handle Buy Now action
    function buyNow() {
      // Redirect to buy-now page with product ID and quantity
      goto(`/buy-now?product=${productId}&quantity=${quantity}`);
    }
    
    // Handle favourite toggle
    async function togglefavourite() {
      if (!isAuthenticated) {
        goto('/account'); // Redirect to login page
        return;
      }
      
      try {
        if (isfavourite) {
          // Find the favourite item ID first
          const favouritesResponse = await favouritesAPI.getfavourites();
          if (favouritesResponse.success) {
            const favourite = favouritesResponse.data.find(
              fav => fav.productId._id === productId
            );
            
            if (favourite) {
              await favouritesAPI.removeFromfavourites(favourite._id);
              isfavourite = false;
            }
          }
        } else {
          await favouritesAPI.addTofavourites(productId);
          isfavourite = true;
        }
      } catch (error) {
        console.error('Error toggling favourite:', error);
        errorMessage = error.message || 'Failed to update favourites';
      }
    }
    
    // Handle quantity changes
    function incrementQuantity() {
      quantity += 1;
    }
    
    function decrementQuantity() {
      if (quantity > 1) {
        quantity -= 1;
      }
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
        <form action="/search" method="get">
          <div class="relative">
            <input
              type="text"
              name="q"
              placeholder="Search for product"
              class="w-full rounded-full py-2 px-10 border-2 border-gray-300 focus:outline-none"
            />
            <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button type="submit" class="hidden">Search</button>
          </div>
        </form>
      </div>
      
      <div class="flex items-center">
        <a href="/account" class="mx-2" aria-label="Account">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </a>
        <a href="/favourites" class="mx-2" aria-label="favourites">
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
    <main class="flex-1 p-4 max-w-6xl mx-auto">
      {#if errorMessage}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      {/if}
      
      <!-- Success message for adding to cart -->
      {#if addToCartSuccess}
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center fixed top-0 left-1/2 transform -translate-x-1/2 z-50">
          <span>Product added to cart successfully!&nbsp;</span>
          <a href="/cart" class="text-green-700 underline">View Cart</a>
        </div>
      {/if}
      
      <!-- Back button -->
      <div class="mb-4">
        <button 
          on:click={() => window.history.back()}
          class="flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>
      
      {#if isLoading}
        <div class="flex justify-center items-center py-10">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      {:else if product}
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Product image -->
          <div>
            <div class="bg-white rounded-lg shadow-md p-4 mb-4 h-96 flex items-center justify-center">
              {#if product.image}
                <img src={product.image} alt={product.name} class="max-h-full max-w-full object-contain">
              {:else}
                <div class="text-center p-8 bg-gray-100 rounded w-full h-full flex items-center justify-center">
                  <span class="text-gray-500 text-lg">No image available</span>
                </div>
              {/if}
            </div>
            
            {#if product.ingredients && product.ingredients.length > 0}
              <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                <h2 class="font-bold text-lg mb-2">Ingredients</h2>
                <p>{product.ingredients.join(', ')}</p>
              </div>
            {/if}
            
            {#if product.nutritionalInfo}
              <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                <h2 class="font-bold text-lg mb-2">Nutritional Information</h2>
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <span class="font-medium">Calories:</span> {product.nutritionalInfo.calories || '0'}
                  </div>
                  <div>
                    <span class="font-medium">Protein:</span> {product.nutritionalInfo.protein || '0'}g
                  </div>
                  <div>
                    <span class="font-medium">Fat:</span> {product.nutritionalInfo.fat || '0'}g
                  </div>
                  <div>
                    <span class="font-medium">Carbs:</span> {product.nutritionalInfo.carbs || '0'}g
                  </div>
                  {#if product.nutritionalInfo.sodium}
                    <div>
                      <span class="font-medium">Sodium:</span> {product.nutritionalInfo.sodium}mg
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
          
          <!-- Product details -->
          <div>
            <div class="bg-white rounded-lg shadow-md p-6 mb-4">
              <div class="flex justify-between">
                <h1 class="text-2xl font-bold mb-2">{product.name}</h1>
                <button 
                  on:click={togglefavourite}
                  class="text-gray-400 hover:text-red-500 focus:outline-none"
                  aria-label={isfavourite ? "Remove from favourites" : "Add to favourites"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill={isfavourite ? "currentColor" : "none"} class:text-red-500={isfavourite} viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>
              
              <div class="mb-4">
                {#if product.category}
                  <span class="inline-block bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full mr-2">
                    {product.category.name}
                  </span>
                {/if}
                
                {#if product.isOnSale}
                  <span class="inline-block bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                    Sale
                  </span>
                {/if}
              </div>
              
              <div class="mb-4">
                <p class="text-gray-600">{product.description}</p>
              </div>
              
              <div class="mb-6">
                {#if product.isOnSale && product.discountPrice}
                  <div class="flex items-baseline">
                    <span class="text-3xl font-bold text-red-600">${product.discountPrice.toFixed(2)}</span>
                    <span class="ml-2 text-lg line-through text-gray-500">${product.price.toFixed(2)}</span>
                    <span class="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                      Save ${(product.price - product.discountPrice).toFixed(2)}
                    </span>
                  </div>
                {:else}
                  <span class="text-3xl font-bold">${product.price.toFixed(2)}</span>
                {/if}
              </div>
              
              <div class="mb-6">
                <div class="flex items-center">
                  <span class="text-gray-700 mr-3">Quantity:</span>
                  <button 
                    on:click={decrementQuantity}
                    class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                    </svg>
                  </button>
                  
                  <span class="mx-4 text-lg font-medium w-8 text-center">{quantity}</span>
                  
                  <button 
                    on:click={incrementQuantity}
                    class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center"
                    aria-label="Increase quantity"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
                
                {#if product.inStock}
                  <div class="text-green-600 text-sm mt-2">In Stock</div>
                {:else}
                  <div class="text-red-600 text-sm mt-2">Out of Stock</div>
                {/if}
              </div>
              
              <div class="flex flex-col sm:flex-row gap-3">
                <button 
                  on:click={addToCart}
                  disabled={isAddingToCart || !product.inStock}
                  class="flex-1 bg-pink-400 hover:bg-pink-500 text-white py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {#if isAddingToCart}
                    <div class="flex items-center justify-center">
                      <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Adding...
                    </div>
                  {:else}
                    Add to Cart
                  {/if}
                </button>
                
                <button 
                  on:click={buyNow}
                  disabled={!product.inStock}
                  class="flex-1 bg-amber-400 hover:bg-amber-500 text-white py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Buy Now
                </button>
              </div>
            </div>
            
            <!-- Additional product info -->
            {#if product.allergens && product.allergens.length > 0}
              <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                <h2 class="font-bold text-lg mb-2">Allergens</h2>
                <div class="flex flex-wrap gap-2">
                  {#each product.allergens as allergen}
                    <span class="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      {allergen}
                    </span>
                  {/each}
                </div>
              </div>
            {/if}
            
            <!-- Ratings and reviews -->
            {#if product.ratings && product.ratings.length > 0}
              <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                <h2 class="font-bold text-lg mb-2">Ratings & Reviews</h2>
                
                <div class="flex items-center mb-4">
                  <div class="flex items-center mr-4">
                    <span class="text-2xl font-bold">{product.averageRating.toFixed(1)}</span>
                    <span class="text-gray-500 ml-1">/ 5</span>
                  </div>
                  
                  <div class="flex">
                    {#each Array(5) as _, i}
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" class:text-yellow-400={i < Math.round(product.averageRating)} class:text-gray-300={i >= Math.round(product.averageRating)} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    {/each}
                  </div>
                  
                  <span class="ml-2 text-gray-500">({product.ratings.length} reviews)</span>
                </div>
                
                <div class="space-y-4">
                  {#each product.ratings.slice(0, 3) as rating}
                    <div class="border-t pt-3">
                      <div class="flex justify-between mb-1">
                        <div class="flex">
                          {#each Array(5) as _, i}
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" class:text-yellow-400={i < rating.rating} class:text-gray-300={i >= rating.rating} fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                          {/each}
                        </div>
                        <span class="text-sm text-gray-500">{new Date(rating.date).toLocaleDateString()}</span>
                      </div>
                      {#if rating.review}
                        <p class="text-gray-600">{rating.review}</p>
                      {/if}
                    </div>
                  {/each}
                  
                  {#if product.ratings.length > 3}
                    <div class="text-center pt-2">
                      <button class="text-pink-500 hover:underline text-sm">
                        View all {product.ratings.length} reviews
                      </button>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <div class="text-center py-10">
          <p class="text-gray-600">Product not found</p>
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