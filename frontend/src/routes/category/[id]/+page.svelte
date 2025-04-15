<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { productsAPI, categoryAPI } from '$lib/api';
  import { cartStore } from '$lib/stores/cart';
  import { authStore } from '$lib/stores/auth';

  const categoryId = $page.params.id;

  let category = null;
  let products = [];
  let isLoading = true;
  let errorMessage = '';
  let isAddingToCart = {};
  let addToCartSuccess = {};

  // Check if user is authenticated
  $: isAuthenticated = $authStore.isAuthenticated;
  
  onMount(async () => {
    try {
      isLoading = true;
      console.log('Category ID:', categoryId)
      // Fetch category details
      const categoryResponse = await categoryAPI.getCategoryById(categoryId);
      if (!categoryResponse.success) {
        throw new Error('Failed to fetch category details');
      }
      
      category = categoryResponse.data;
      
      // Fetch products in this category
      const productsResponse = await categoryAPI.getProductsByCategory(categoryId);
      if (!productsResponse.success) {
        throw new Error('Failed to fetch products in this category');
      }
      
      products = productsResponse.data;
    } catch (error) {
      console.error('Error fetching category data:', error);
      errorMessage = error.message || 'Failed to load category data';
    } finally {
      isLoading = false;
    }
  });
  
  // Add product to cart
  async function addToCart(productId) {
    try {
      isAddingToCart[productId] = true;
      const success = await cartStore.addItem(productId, 1);
      
      if (success) {
        addToCartSuccess[productId] = true;
        setTimeout(() => {
          addToCartSuccess[productId] = false;
        }, 3000);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      errorMessage = error.message || 'Failed to add product to cart';
    } finally {
      isAddingToCart[productId] = false;
    }
  }
</script>

<div class="min-h-screen flex flex-col">
<!-- Header -->
<header class="bg-pink-400 p-4 flex items-center justify-between">
  <div class="flex items-center">
    <a href="/" class="flex items-center">
      <h1 class="text-2xl font-bold text-white mr-2">Hot<br>Fridge</h1>
      <div class="h-12 w-12 bg-green-200 rounded-md flex items-center justify-center text-xs text-gray-600 font-bold">
        Logo
      </div>
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
<main class="flex-1 p-4 max-w-6xl mx-auto">
  {#if errorMessage}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {errorMessage}
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
  {:else if category}
    <h1 class="text-2xl font-bold mb-6">{category.name}</h1>
    
    {#if category.description}
      <p class="text-gray-600 mb-6">{category.description}</p>
    {/if}
    
    {#if products.length === 0}
      <div class="bg-gray-100 p-8 rounded-lg text-center shadow-md">
        <p class="text-lg text-gray-600">No products available in this category.</p>
      </div>
    {:else}
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {#each products as product (product._id)}
          <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <!-- Success indicator for this product -->
            {#if addToCartSuccess[product._id]}
              <div class="bg-green-100 text-green-700 px-2 py-1 text-center text-sm">
                Added to cart!
              </div>
            {/if}
            
            <a href="/product/{product._id}" class="block">
              <div class="h-40 overflow-hidden bg-gray-50 flex items-center justify-center">
                {#if product.image}
                  <img src={product.image} alt={product.name} class="w-full h-full object-contain p-2">
                {:else}
                  <div class="text-center p-4 bg-gray-100 w-full h-full flex items-center justify-center">
                    <span class="text-gray-500 text-sm">No image available</span>
                  </div>
                {/if}
              </div>
            </a>
            
            <div class="p-4">
              <a href="/product/{product._id}" class="block">
                <h2 class="font-semibold text-gray-800 mb-1 line-clamp-2 hover:text-pink-500">
                  {product.name}
                </h2>
              </a>
              
              <div class="flex justify-between items-center mb-2">
                {#if product.isOnSale && product.discountPrice}
                  <div>
                    <span class="font-bold text-red-600">${product.discountPrice.toFixed(2)}</span>
                    <span class="text-sm line-through text-gray-500 ml-1">${product.price.toFixed(2)}</span>
                  </div>
                {:else}
                  <span class="font-bold">${product.price.toFixed(2)}</span>
                {/if}
                
                {#if product.unit}
                  <span class="text-xs text-gray-500">
                    {product.unit}
                  </span>
                {/if}
              </div>
              
              <div class="flex justify-between items-center">
                <a 
                  href="/product/{product._id}" 
                  class="text-pink-500 hover:text-pink-600 text-sm"
                >
                  View Details
                </a>
                
                <button 
                  on:click={() => addToCart(product._id)} 
                  class="bg-pink-400 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-pink-500 transition-colors"
                  aria-label={`Add ${product.name} to cart`}
                  disabled={isAddingToCart[product._id] || !product.inStock}
                >
                  {#if isAddingToCart[product._id]}
                    <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  {:else if addToCartSuccess[product._id]}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  {/if}
                </button>
              </div>
              
              {#if !product.inStock}
                <div class="text-red-600 text-xs mt-2">Out of Stock</div>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="text-center py-10">
      <p class="text-gray-600">Category not found</p>
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
    <div class="h-12 w-12 bg-green-200 rounded-md flex items-center justify-center text-xs text-gray-600 font-bold">
      Logo
    </div>
  </div>
</footer>
</div>