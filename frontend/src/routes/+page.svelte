<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { productsAPI, categoriesAPI, promotionsAPI } from '$lib/api';
  import { cartStore } from '$lib/stores/cart';
  import { authStore } from '$lib/stores/auth';
  
  // State variables
  let searchQuery = '';
  let categories = [];
  let promotions = [];
  let faqs = [];
  let featuredProducts = [];
  let isLoading = true;
  let errorMessage = '';
  let isAddingToCart = false;
  let addToCartSuccess = false;
  
  // Auth state
  $: isAuthenticated = $authStore.isAuthenticated;
  $: user = $authStore.user;
  
  // Functions
  async function fetchData() {
    try {
      isLoading = true;
      
      // Fetch categories
      const categoriesResult = await categoriesAPI.getCategories();
      categories = categoriesResult.data || [];
      
      // Fetch promotions
      const promotionsResult = await promotionsAPI.getPromotions();
      promotions = promotionsResult.data || [];
      
      // Fetch featured products
      const featuredResult = await productsAPI.getFeaturedProducts();
      featuredProducts = featuredResult.data || [];
      
      // Static FAQs for now (could be from backend later)
      faqs = [
        {
          question: "How long will delivery take?",
          answer: "While the exact delivery time depends on the products chosen and your location, we ensure that delivery is completed within 3 days."
        },
        {
          question: "How long will it take for a product to be restocked?",
          answer: "Fresh products are restocked daily, whereas preservables are restocked once a week."
        },
        {
          question: "What payment methods are accepted?",
          answer: "We currently accept Visa, Mastercard, PayLah, and ApplePay. We are in the process of including more payment methods."
        }
      ];
    } catch (error) {
      console.error('Error fetching data:', error);
      errorMessage = 'Failed to load some content. Please try again later.';
    } finally {
      isLoading = false;
    }
  }
  
  // Handle search input
  function handleSearch() {
    if (!searchQuery.trim()) return;
    
    // Redirect to search page with query parameter
    goto(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  }

    // Handle Add to Cart action
    async function addToCart(productId) {
      try {
        isAddingToCart = true;
        const success = await cartStore.addItem(productId, 1);
        
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
  
  // Navigate to category page
  function viewCategory(categoryId) {
    goto(`/category/${categoryId}`);
  }
  
  // Navigate to product page
  function viewProduct(productId) {
    goto(`/product/${productId}`);
  }
  
  onMount(() => {
    fetchData();
  });
</script>

<div class="min-h-screen flex flex-col bg-white">
  <!-- Header -->
  <header class="bg-pink-400 p-4 flex items-center justify-between">
    <div class="flex items-center">
      <h1 class="text-2xl font-bold text-white mr-2">Hot<br>Fridge</h1>
      <div class="h-12 w-12 bg-green-200 rounded-md flex items-center justify-center text-xs text-gray-600 font-bold">
        Logo
      </div>
    </div>
    
    <div class="flex-1 mx-4">
      <form on:submit|preventDefault={handleSearch}>
        <div class="relative">
          <input
            type="text"
            bind:value={searchQuery}
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
      <a href="/account" class="mx-2" aria-label="User account">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </a>
      <a href="/favourites" class="mx-2" aria-label="favourites">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </a>
      <a href="/cart" class="mx-2" aria-label="Shopping cart">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </a>
    </div>
  </header>
  
  <!-- Colorful divider -->
  <div class="h-2 bg-gradient-to-r from-cyan-400 via-lime-300 to-yellow-200"></div>
  
  <!-- Main content -->
  <main class="flex-1 p-4">
    {#if errorMessage}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {errorMessage}
      </div>
    {/if}
    
    {#if isLoading}
      <div class="flex justify-center items-center py-10">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    {:else}
      <!-- Popular Categories -->
      <div class="mb-6">
        <div class="bg-pink-200 text-lg font-semibold py-2 px-4 rounded-full inline-block shadow-md mb-3">
          Popular categories
        </div>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          {#if categories.length > 0}
            {#each categories as category}
              <button 
                type="button"
                class="bg-pink-100 p-4 rounded-lg flex flex-col items-center hover:bg-pink-200 transition-colors w-full"
                on:click={() => viewCategory(category._id)}
                on:keydown={(e) => e.key === 'Enter' && viewCategory(category._id)}
              >
                <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-2">
                  <div class="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-xs font-bold">
                    <span>{category.name.slice(0, 1).toUpperCase()}</span>
                  </div>
                </div>
                <span>{category.name}</span>
              </button>
            {/each}
          {:else}
            <div class="col-span-2 md:col-span-4 text-center py-5 text-gray-500">
              Categories could not be loaded
            </div>
          {/if}
        </div>
      </div>
      
      <!-- Promotions -->
      <div class="mb-6">
        <div class="bg-pink-200 text-lg font-semibold py-2 px-4 rounded-full inline-block shadow-md mb-3">
          Promotions
        </div>
        
        <div class="bg-amber-100 p-4 rounded-lg">
          <div class="flex overflow-x-auto space-x-4 pb-2">
            {#if promotions.length > 0}
              {#each promotions as promo}
                {#if promo.applicableProducts && promo.applicableProducts.length > 0 && promo.applicableProducts[0]}
                  <div class="min-w-[150px] flex flex-col items-center">
                    <!-- Product image or placeholder -->
                    <button 
                      type="button"
                      class="w-20 h-20 bg-white rounded flex items-center justify-center mb-1"
                      on:click={() => viewProduct(promo.applicableProducts[0]._id)}
                      on:keydown={(e) => e.key === 'Enter' && viewProduct(promo.applicableProducts[0]._id)}
                      aria-label={`View ${promo.applicableProducts[0].name} details`}
                    >
                      {#if promo.applicableProducts[0].image}
                        <img src={promo.applicableProducts[0].image} alt={promo.applicableProducts[0].name} class="h-16 w-16 object-contain">
                      {:else}
                        <span class="text-xs text-gray-600 font-medium">{promo.applicableProducts[0].name}</span>
                      {/if}
                    </button>
                    <div class="text-center">
                      <div class="font-medium">{promo.applicableProducts[0].name}</div>
                      <div class="flex items-center justify-center">
                        <span class="line-through text-sm text-gray-500 mr-1">${promo.applicableProducts[0].price.toFixed(2)}</span>
                        <span class="font-bold text-red-600">
                          ${promo.applicableProducts[0].discountPrice ? 
                            promo.applicableProducts[0].discountPrice.toFixed(2) : 
                            (promo.applicableProducts[0].price * (1 - promo.discountPercent / 100)).toFixed(2)
                          }
                        </span>
                      </div>
                      <div class="text-sm">({promo.discountPercent}% OFF)</div>
                      <button 
                        class="mt-2 text-sm bg-pink-400 text-white px-3 py-1 rounded-full hover:bg-pink-500 transition-colors"
                        on:click={() => addToCart(promo.applicableProducts[0]._id)}
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                {/if}
              {/each}
            {:else}
              <div class="w-full text-center py-5 text-gray-500">
                No promotions available at the moment
              </div>
            {/if}
            
            <div class="min-w-[100px] flex items-center justify-center">
              <a href="/promotions" class="text-gray-400 hover:text-gray-600 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
                <span class="text-xs text-gray-500">See all promotions<br>and discounts</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Featured Products -->
      {#if featuredProducts.length > 0}
        <div class="mb-6">
          <div class="bg-pink-200 text-lg font-semibold py-2 px-4 rounded-full inline-block shadow-md mb-3">
            Featured Products
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            {#each featuredProducts as product}
              <div class="bg-white p-4 rounded-lg shadow-md">
                <button 
                  type="button"
                  class="w-full h-32 bg-gray-100 mb-3 flex items-center justify-center"
                  on:click={() => viewProduct(product._id)}
                  on:keydown={(e) => e.key === 'Enter' && viewProduct(product._id)}
                  aria-label={`View ${product.name} details`}
                >
                  {#if product.image}
                    <img src={product.image} alt={product.name} class="h-28 object-contain">
                  {:else}
                    <span class="text-gray-500">{product.name}</span>
                  {/if}
                </button>
                <h3 class="font-medium text-sm mb-1">{product.name}</h3>
                <div class="flex justify-between items-center">
                  <div>
                    {#if product.isOnSale && product.discountPrice}
                      <div class="line-through text-xs text-gray-500">${product.price.toFixed(2)}</div>
                      <div class="font-bold text-red-600">${product.discountPrice.toFixed(2)}</div>
                    {:else}
                      <div class="font-bold">${product.price.toFixed(2)}</div>
                    {/if}
                  </div>
                  <button 
                    class="bg-pink-400 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-pink-500 transition-colors"
                    on:click={() => addToCart(product._id)}
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Success message for adding to cart -->
      {#if addToCartSuccess}
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center fixed top-0 left-1/2 transform -translate-x-1/2 z-50">
          <span>Product added to cart successfully!&nbsp;</span>
          <a href="/cart" class="text-green-700 underline">View Cart</a>
        </div>
      {/if}
      
      <!-- FAQ Section -->
      <div class="mb-6">
        <div class="bg-pink-200 text-lg font-semibold py-2 px-4 rounded-full inline-block shadow-md mb-3">
          FAQ
        </div>
        
        <div class="space-y-4">
          {#each faqs as faq, i}
            <div class="bg-gray-50 p-4 rounded-lg shadow-sm">
              <h3 class="font-bold text-lg">Q. {faq.question}</h3>
              <p class="mt-1">{faq.answer}</p>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Account button -->
      <div class="flex justify-center mb-6">
        <a href="/account" class="bg-pink-200 text-center w-64 py-3 px-4 rounded-full shadow-md font-semibold hover:bg-pink-300 transition-colors">
          {isAuthenticated ? 'My Account' : 'Login / Register'}
        </a>
      </div>
    {/if}
  </main>
  
  <!-- Footer -->
  <footer class="bg-pink-400 p-4 text-white">
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
      <div class="h-12 w-12 bg-green-200 rounded-md flex items-center justify-center text-xs text-gray-600 font-bold">
        Logo
      </div>
    </div>
  </footer>
</div>

<style>
  /* Custom styles using regular CSS */
  
  /* Make the horizontal scrollbar in promotions less obtrusive */
  .overflow-x-auto::-webkit-scrollbar {
    height: 4px;
  }
  
  .overflow-x-auto::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 10px;
  }
  
  .overflow-x-auto::-webkit-scrollbar-thumb {
    background: #d1d1d1;
    border-radius: 10px;
  }
</style>