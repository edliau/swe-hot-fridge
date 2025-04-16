<script>
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth';
  import { favouritesAPI } from '$lib/api';
  import ProductCard from '$lib/components/ProductCard.svelte';
  import { cartStore } from '$lib/stores/cart'; // assuming you're using a cart store
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import { fuzzySearchProducts } from '$lib/utils/fuzzySearch';



  let favouriteItems = [];
  let filteredFavourites = [];
  let searchInput = '';
  let isLoading = true;
  let errorMessage = '';
  let isAuthenticated;
  let addToCartSuccess = false;
  let addToCartTimer;

  $: isAuthenticated = $authStore.isAuthenticated;

  // Filter the favourites as the user types
  $: {
    if (searchInput.trim()) {
      const allProducts = favouriteItems.map(item => item.productId);
      const { matches } = fuzzySearchProducts(searchInput, allProducts);
      filteredFavourites = matches.map(product =>
        favouriteItems.find(item => item.productId._id === product._id)
      ).filter(Boolean);
    } else {
      filteredFavourites = favouriteItems;
    }
  }


  onMount(async () => {
    try {
      isLoading = true;
      const res = await favouritesAPI.getfavourites();
      
      // The API returns favourite items with productId containing the populated product data
      favouriteItems = res.data || [];
      
    } catch (e) {
      errorMessage = 'Could not load favourites.';
      console.error(e);
    } finally {
      isLoading = false;
    }
  });
  function handleAddToCart(productId) {
  cartStore.addItem(productId);
  addToCartSuccess = true;

  // Clear any existing timer
  if (addToCartTimer) clearTimeout(addToCartTimer);

  // Hide popup after 3 seconds
  addToCartTimer = setTimeout(() => {
    addToCartSuccess = false;
  }, 3000);
}
</script>

<svelte:head>
  <title>My Favourites</title>
</svelte:head>

<!-- HEADER -->
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
    <a href="/favourites" class="mx-2" aria-label="favourites">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    </a>
    <a href="/cart" class="mx-2" aria-label="Cart">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    </a>
  </div>
</header>

<!-- Divider -->
<div class="h-2 bg-gradient-to-r from-cyan-400 via-lime-300 to-yellow-200"></div>

<!-- MAIN CONTENT -->
<main class="p-6 bg-white min-h-[calc(100vh-200px)]">
  <h2 class="text-2xl font-bold mb-6">My Favourites</h2>
  <div class="mb-6 max-w-md">
    <input
      type="text"
      bind:value={searchInput}
      placeholder="Search within favourites"
      class="w-full rounded-full py-2 px-5 border-2 border-pink-300 focus:outline-none focus:ring-2 focus:ring-pink-400"
    />
  </div>  

  {#if isLoading}
    <div class="text-center text-gray-500">Loading...</div>
  {:else if errorMessage}
    <div class="text-center text-red-500">{errorMessage}</div>
  {:else if filteredFavourites.length > 0}
    <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
      {#each filteredFavourites as item}
        <ProductCard 
          product={item.productId} 
          favouriteId={item._id} 
          on:viewProduct={(e) => goto(`/product/${e.detail}`)} 
          on:addToCart={(e) => handleAddToCart(e.detail)} 
        />
      {/each}
    </div>
  {:else if searchInput.trim() !== ''}
    <div class="text-center text-gray-500">
      <p>No matching favourites found for "{searchInput}".</p>
    </div>
  {:else}
    <div class="text-center text-gray-500">
      <p>You haven't added any favourites yet.</p>
      <p class="mt-2">
        <a href="/" class="text-pink-500 hover:underline">Browse products</a> and click the star icon to add to your favourites.
      </p>
    </div>
  {/if}
  {#if addToCartSuccess}
    <div
      in:fade={{ duration: 200 }}
      out:fade={{ duration: 200 }}
      class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 flex justify-between items-center fixed top-5 left-1/2 transform -translate-x-1/2 z-50 shadow-lg w-[90%] max-w-md"
    >
      <span class="text-sm">Product added to cart successfully!</span>
      <a href="/cart" class="ml-4 text-green-700 underline text-sm">View Cart</a>
    </div>
  {/if}
</main>

<!-- FOOTER -->
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
    <img 
    src="/images/logo/logo.png" 
    alt="Hot Fridge Logo" 
    class="h-12 w-12 rounded-md"
    />
  </div>
</footer>