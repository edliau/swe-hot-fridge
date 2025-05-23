<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import SearchBar from '$lib/components/SearchBar.svelte';
  
  let email = '';
  let password = '';
  let isSubmitting = false;
  let errorMessage = '';
  let successMessage = '';
  
  // Subscribe to auth store
  $: isLoggedIn = $authStore.isAuthenticated;
  $: user = $authStore.user;
  $: if (isLoggedIn) {
    goto('/dashboard');
  }
  
  $: if ($authStore.error) {
    errorMessage = $authStore.error;
    // Clear error after 5 seconds
    setTimeout(() => {
      authStore.clearError();
      errorMessage = '';
    }, 5000);
  }
  
  async function handleLogin() {
    if (!email || !password) {
      errorMessage = 'Please enter both email and password';
      return;
    }
    
    isSubmitting = true;
    
    try {
      const success = await authStore.login({ email, password });
      
      if (success) {
        successMessage = 'Login successful!';
        errorMessage = '';
        // Redirect will happen automatically due to the reactive statement above
      }
    } catch (error) {
      errorMessage = error.message || 'Login failed. Please try again.';
    } finally {
      isSubmitting = false;
    }
  }
  
  function handleSignUp() {
    goto('/account/register');
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
      <button class="mx-2" aria-label="Account">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </button>
        <button class="mx-2" aria-label="favourites">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
        <button class="mx-2" aria-label="Shopping Cart">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </button>
    </div>
  </header>
  
  <!-- Colorful divider -->
  <div class="h-2 bg-gradient-to-r from-cyan-400 via-lime-300 to-yellow-200"></div>
  
  <!-- Main content -->
  <main class="flex-1 p-4 max-w-md mx-auto">
    <div class="bg-pink-200 text-center text-xl font-semibold py-3 px-4 rounded-full shadow-md mb-6">
      Account
    </div>
    
    {#if errorMessage}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {errorMessage}
      </div>
    {/if}
    
    {#if successMessage}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        {successMessage}
      </div>
    {/if}
    
    <form class="space-y-4" on:submit|preventDefault={handleLogin}>
      <div>
        <label for="email" class="block mb-1 font-medium">Email</label>
        <input 
          type="email"
          id="email" 
          bind:value={email} 
          placeholder="Enter email" 
          required
          class="w-full p-3 rounded bg-amber-50 border border-amber-100"
        />
      </div>
      
      <div>
        <label for="password" class="block mb-1 font-medium">Password</label>
        <input 
          type="password" 
          id="password" 
          bind:value={password} 
          placeholder="Enter password" 
          required
          class="w-full p-3 rounded bg-amber-50 border border-amber-100"
        />
        <div class="text-right mt-1">
          <a href="/account/forgot-password" class="text-red-500 text-sm">Forgot password?</a>
        </div>
      </div>
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        class="w-full bg-pink-400 hover:bg-pink-500 text-white py-3 rounded-lg transition duration-200 font-medium disabled:opacity-50"
      >
        {isSubmitting ? 'Logging in...' : 'Log in'}
      </button>
      
      <button 
        type="button" 
        on:click={handleSignUp} 
        disabled={isSubmitting}
        class="w-full bg-pink-400 hover:bg-pink-500 text-white py-3 rounded-lg transition duration-200 font-medium disabled:opacity-50"
      >
        Sign up
      </button>
    </form>
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