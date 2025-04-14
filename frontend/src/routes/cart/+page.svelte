<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { cartStore, cartTotal } from '$lib/stores/cart';
  import { authStore } from '$lib/stores/auth';
  import SearchBar from '$lib/components/SearchBar.svelte';
  
  let isLoading = true;
  let errorMessage = '';
  
  // Subscribe to cart and auth stores
  $: items = $cartStore.items;
  $: totalAmount = $cartTotal.totalAmount;
  $: isAuthenticated = $authStore.isAuthenticated;
  $: isGuest = $authStore.isGuest;
  
  onMount(async () => {
    try {
      isLoading = true;
      await cartStore.fetchItems();
    } catch (error) {
      errorMessage = error.message || 'Failed to load cart items';
    } finally {
      isLoading = false;
    }
  });
  
  // Methods
  async function updateQuantity(productId, delta) {
    const item = items.find(item => item.productId._id === productId);
    console.log('Item before update:', item); // Check if the item is found
    if (!item) return;
    
    const newQuantity = item.quantity + delta;
    console.log('New quantity:', newQuantity); // Log the new quantity
    if (newQuantity > 0) {
      await cartStore.updateQuantity(productId, newQuantity);
    }
  }

  // async function updateQuantity(productId, newQuantity) {
  //   const itemIndex = this.items.findIndex(item => item.productId._id === productId);
  //   if (itemIndex !== -1) {
  //     this.items[itemIndex].quantity = newQuantity;
  //   }
  // }
  
  async function toggleSelectItem(productId) {
    const item = items.find(item => item.productId._id === productId);
    if (!item) return;
    
    await cartStore.toggleSelection(productId, !item.selected);
  }
  
  async function toggleSelectAll() {
    const allSelected = items.every(item => item.selected);
    
    // Loop through all items and update their selection status
    for (const item of items) {
      await cartStore.toggleSelection(item.productId._id, !allSelected);
    }
  }
  
  function backToBrowsing() {
    goto('/');
  }
  
  async function removeItem(productId) {
    await cartStore.removeItem(productId);
  }
  
  async function clearCart() {
    console.log('Clearing cart...');
    await cartStore.clearCart();
  }
  
  function checkoutAsGuest() {
    goto('/checkout');
  }
  
  function viewPromotions() {
    goto('/promotions');
  }
  
  function loginForPoints() {
    goto('/account');
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
  
  <!-- Colorful divider -->
  <div class="h-2 bg-gradient-to-r from-cyan-400 via-lime-300 to-yellow-200"></div>
  
  <!-- Main content -->
  <main class="flex-1 p-4">
    <div class="bg-pink-200 text-lg font-semibold py-2 px-4 rounded-full inline-block shadow-md mb-3">
      Shopping Cart
    </div>
    
    {#if errorMessage}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {errorMessage}
      </div>
    {/if}
    
    {#if isLoading}
      <div class="flex justify-center items-center py-10">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    {:else if items.length === 0}
      <div class="text-center py-10">
        <p class="text-gray-500 mb-4">Your cart is empty</p>
        <button 
          on:click={backToBrowsing}
          class="bg-pink-400 hover:bg-pink-500 text-white py-2 px-4 rounded-lg transition duration-200"
        >
          Browse Products
        </button>
      </div>
    {:else}
      <div class="flex justify-end mb-3">
        <div class="flex items-center">
          <span class="text-sm mr-2">Page 1 of 1</span>
          <button class="mr-1 p-1" aria-label="Previous page">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button class="p-1" aria-label="Next page">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      <div class="bg-white rounded-lg overflow-hidden shadow mb-4">
        <!-- Table header -->
        <div class="grid grid-cols-12 border-b p-2 bg-gray-50 text-sm font-medium">
          <div class="col-span-1 flex items-center justify-center">
            <button on:click={toggleSelectAll} class="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center">
              {#if items.every(item => item.selected)}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </button>
          </div>
          <div class="col-span-5">Item</div>
          <div class="col-span-3 text-right">Price</div>
          <div class="col-span-3 text-right">Quantity</div>
        </div>
        
        <!-- Cart items -->
        {#each items as item}
          <div class="grid grid-cols-12 border-b p-3 items-center">
            <div class="col-span-1 flex items-center justify-center">
              <button on:click={() => toggleSelectItem(item.productId._id)} class="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center">
                {#if item.selected}
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                {/if}
              </button>
            </div>
            <div class="col-span-5 flex items-center">
              <div class="h-16 w-16 bg-gray-200 rounded flex items-center justify-center mr-3">
                {#if item.productId.image}
                  <img src={item.productId.image} alt={item.productId.name} class="h-16 w-16 object-contain">
                {:else}
                  <span class="text-xs text-gray-600 font-medium">{item.productId.name}</span>
                {/if}
              </div>
              <div class="font-medium">{item.productId.name}</div>
            </div>
            <div class="col-span-3 text-right">
              {#if item.productId.isOnSale && item.productId.discountPrice}
                <div class="line-through text-gray-500">${item.productId.price.toFixed(2)}</div>
                <div class="font-bold">${item.productId.discountPrice.toFixed(2)}</div>
                <div class="text-sm text-gray-500">Promotion applied</div>
              {:else}
                <div class="font-bold">${item.productId.price.toFixed(2)}</div>
              {/if}
            </div>
            <div class="col-span-3 flex items-center justify-end">
              <button 
                on:click={() => {
                  updateQuantity(item.productId._id, -1)} }
                class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mx-1"
                aria-label={`Decrease quantity of ${item.productId.name}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                </svg>
              </button>
              
              <span class="mx-2 min-w-[2rem] text-center">{item.quantity}</span>
              
              <button 
                on:click={() => updateQuantity(item.productId._id, 1)} 
                class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mx-1"
                aria-label={`Increase quantity of ${item.productId.name}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
              
              <button 
                on:click={() => removeItem(item.productId._id)} 
                class="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center ml-2"
                aria-label={`Remove ${item.productId.name} from cart`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        {/each}
        
        <!-- Summary row -->
        <div class="grid grid-cols-12 p-3 items-center bg-gray-50">
          <div class="col-span-1 flex items-center justify-center">
            <button on:click={toggleSelectAll} class="w-6 h-6 rounded-full bg-pink-200 flex items-center justify-center">
              {#if items.every(item => item.selected)}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              {/if}
            </button>
          </div>
          <div class="col-span-5 font-medium">Select All</div>
          <div class="col-span-3 text-right font-bold">Total</div>
          <div class="col-span-3 text-right font-bold text-xl">${totalAmount.toFixed(2)}</div>
        </div>
      </div>
      
      <!-- Action buttons -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <button 
          on:click={backToBrowsing}
          class="bg-pink-400 hover:bg-pink-500 text-white py-3 px-4 rounded-lg transition duration-200"
        >
          Back to browsing
        </button>
        
        <button 
          on:click={isAuthenticated ? checkoutAsGuest : checkoutAsGuest}
          class="bg-pink-400 hover:bg-pink-500 text-white py-3 px-4 rounded-lg transition duration-200"
        >
          {isAuthenticated ? 'Checkout' : 'Checkout as guest'}
        </button>
        
        <button 
          on:click={viewPromotions}
          class="bg-pink-400 hover:bg-pink-500 text-white py-3 px-4 rounded-lg transition duration-200"
        >
          View promotions
        </button>
        
        {#if isGuest}
          <button 
            on:click={loginForPoints}
            class="bg-pink-400 hover:bg-pink-500 text-white py-3 px-4 rounded-lg transition duration-200"
          >
            Log in to gain points
          </button>
        {:else}
          <button 
            on:click={clearCart}
            class="bg-red-400 hover:bg-red-500 text-white py-3 px-4 rounded-lg transition duration-200"
          >
            Clear cart
          </button>
        {/if}
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
          <li>My account</li>
          <li>Shopping cart</li>
          <li>Past orders</li>
          <li>Return orders</li>
          <li>Favourites</li>
        </ul>
      </div>
      
      <div>
        <h3 class="font-bold mb-2">Information</h3>
        <ul class="text-sm">
          <li>About us</li>
          <li>Contact us</li>
          <li>Shipping & delivery</li>
          <li>Privacy Policy</li>
          <li>Terms of Use</li>
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