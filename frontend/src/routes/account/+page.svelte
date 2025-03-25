<script>
    import { onMount } from 'svelte';
    
    let username = '';
    let password = '';
    
    function handleLogin() {
      console.log('Login attempt with:', { username, password });
      // Will implement actual login functionality later
    }
    
    function handleSignUp() {
      console.log('Navigating to sign up page');
      // Will implement navigation to sign up page
    }
  </script>
  
  <div class="min-h-screen flex flex-col">
    <!-- Header -->
    <header class="bg-pink-400 p-4 flex items-center justify-between">
      <div class="flex items-center">
        <a href="/" class="flex items-center">
          <h1 class="text-2xl font-bold text-white mr-2">Hot<br>Fridge</h1>
          <img src="/images/fridge-logo.png" alt="Hot Fridge Logo" class="h-12 w-12">
        </a>
      </div>
      
      <div class="flex-1 mx-4">
        <div class="relative">
          <input
            type="text"
            placeholder="Jinro Strawberry"
            class="w-full rounded-full py-2 px-10 border-2 border-gray-300 focus:outline-none"
          />
          <div class="absolute left-3 top-1/2 transform -translate-y-1/2" style="width: 20px; height: 20px;">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400" style="max-width: 100%; max-height: 100%;" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>
      
      <div class="flex items-center">
        <button class="mx-2" aria-label="Account">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
          <button class="mx-2" aria-label="Favorites">
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
      
      <form class="space-y-4">
        <div>
          <label for="username" class="block mb-1 font-medium">Username</label>
          <input 
            type="text" 
            id="username" 
            bind:value={username} 
            placeholder="Enter username" 
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
            class="w-full p-3 rounded bg-amber-50 border border-amber-100"
          />
          <div class="text-right mt-1">
            <a href="/account/forgot-password" class="text-red-500 text-sm">Forgot password?</a>
          </div>
        </div>
        
        <button 
          type="button" 
          on:click={handleLogin} 
          class="w-full bg-pink-400 hover:bg-pink-500 text-white py-3 rounded-lg transition duration-200 font-medium"
        >
          Log in
        </button>
        
        <button 
          type="button" 
          on:click={handleSignUp} 
          class="w-full bg-pink-400 hover:bg-pink-500 text-white py-3 rounded-lg transition duration-200 font-medium"
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
        <img src="/images/fridge-logo.png" alt="Hot Fridge Logo" class="h-12 w-12">
      </div>
    </footer>
  </div>