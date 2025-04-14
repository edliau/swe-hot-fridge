<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { authStore } from '$lib/stores/auth';
    
    let formData = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    
    let isSubmitting = false;
    let errorMessage = '';
    let successMessage = '';
    let passwordStrength = 0;
    
    // Subscribe to auth store
    $: isLoggedIn = $authStore.isAuthenticated;
    $: if (isLoggedIn) {
      // Redirect to home if already logged in
      goto('/');
    }
    
    $: if ($authStore.error) {
      errorMessage = $authStore.error;
      // Clear error after 5 seconds
      setTimeout(() => {
        authStore.clearError();
        errorMessage = '';
      }, 5000);
    }
    
    // Password validation
    $: passwordsMatch = formData.password === formData.confirmPassword;
    $: passwordMinLength = formData.password.length >= 6;
    
    // Check password strength
    $: {
      if (!formData.password) {
        passwordStrength = 0;
      } else if (formData.password.length < 6) {
        passwordStrength = 1; // Weak
      } else if (/^[a-zA-Z0-9]+$/.test(formData.password)) {
        passwordStrength = 2; // Medium
      } else if (/^.*(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).*$/.test(formData.password)) {
        passwordStrength = 3; // Strong
      } else {
        passwordStrength = 2; // Medium
      }
    }
    
    function getPasswordStrengthText() {
      if (passwordStrength === 0) return '';
      if (passwordStrength === 1) return 'Weak';
      if (passwordStrength === 2) return 'Medium';
      if (passwordStrength === 3) return 'Strong';
    }
    
    function getPasswordStrengthColor() {
      if (passwordStrength === 0) return 'bg-gray-200';
      if (passwordStrength === 1) return 'bg-red-500';
      if (passwordStrength === 2) return 'bg-yellow-500';
      if (passwordStrength === 3) return 'bg-green-500';
    }
    
    async function handleSubmit() {
      // Validate form
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
        errorMessage = 'Please fill all required fields';
        return;
      }
      
      if (!passwordsMatch) {
        errorMessage = 'Passwords do not match';
        return;
      }
      
      if (!passwordMinLength) {
        errorMessage = 'Password must be at least 6 characters';
        return;
      }
      
      isSubmitting = true;
      
      try {
        // Remove confirmPassword before sending to API
        const { confirmPassword, ...userData } = formData;
        
        const success = await authStore.register(userData);
        
        if (success) {
          successMessage = 'Registration successful! You can now log in.';
          errorMessage = '';
          
          // Check if user was automatically logged in (depends on your backend setup)
          if ($authStore.isAuthenticated) {
            goto('/');
          } else {
            // Clear form
            formData = {
              firstName: '',
              lastName: '',
              email: '',
              password: '',
              confirmPassword: ''
            };
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
              goto('/account');
            }, 2000);
          }
        }
      } catch (error) {
        errorMessage = error.message || 'Registration failed. Please try again.';
      } finally {
        isSubmitting = false;
      }
    }
    
    function goToLogin() {
      goto('/account');
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
    <main class="flex-1 p-4 max-w-md mx-auto">
      <div class="bg-pink-200 text-center text-xl font-semibold py-3 px-4 rounded-full shadow-md mb-6">
        Create Account
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
      
      <form class="space-y-4" on:submit|preventDefault={handleSubmit}>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label for="firstName" class="block mb-1 font-medium">First Name</label>
            <input 
              type="text"
              id="firstName" 
              bind:value={formData.firstName} 
              placeholder="First Name" 
              required
              class="w-full p-3 rounded bg-amber-50 border border-amber-100 focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
          
          <div>
            <label for="lastName" class="block mb-1 font-medium">Last Name</label>
            <input 
              type="text"
              id="lastName" 
              bind:value={formData.lastName} 
              placeholder="Last Name" 
              required
              class="w-full p-3 rounded bg-amber-50 border border-amber-100 focus:outline-none focus:ring-2 focus:ring-pink-300"
            />
          </div>
        </div>
        
        <div>
          <label for="email" class="block mb-1 font-medium">Email</label>
          <input 
            type="email"
            id="email" 
            bind:value={formData.email} 
            placeholder="Enter email" 
            required
            class="w-full p-3 rounded bg-amber-50 border border-amber-100 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
        </div>
        
        <div>
          <label for="password" class="block mb-1 font-medium">Password</label>
          <input 
            type="password" 
            id="password" 
            bind:value={formData.password} 
            placeholder="Enter password" 
            required
            class="w-full p-3 rounded bg-amber-50 border border-amber-100 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          
          {#if formData.password}
            <div class="mt-2">
              <div class="flex justify-between items-center mb-1">
                <span class="text-xs text-gray-600">Password strength: {getPasswordStrengthText()}</span>
                {#if !passwordMinLength}
                  <span class="text-xs text-red-500">At least 6 characters required</span>
                {/if}
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class={`${getPasswordStrengthColor()} h-2 rounded-full`} style="width: {passwordStrength * 33}%"></div>
              </div>
            </div>
          {/if}
        </div>
        
        <div>
          <label for="confirmPassword" class="block mb-1 font-medium">Confirm Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            bind:value={formData.confirmPassword} 
            placeholder="Confirm password" 
            required
            class="w-full p-3 rounded bg-amber-50 border border-amber-100 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          {#if formData.confirmPassword && !passwordsMatch}
            <p class="text-red-500 text-xs mt-1">Passwords do not match</p>
          {/if}
        </div>
        
        <div class="pt-2">
          <button 
            type="submit" 
            disabled={isSubmitting}
            class="w-full bg-pink-400 hover:bg-pink-500 text-white py-3 rounded-lg transition duration-200 font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
        
        <div class="text-center">
          <p class="text-gray-600">
            Already have an account? 
            <button 
              type="button" 
              on:click={goToLogin} 
              class="text-pink-500 font-medium hover:underline"
            >
              Log in
            </button>
          </p>
        </div>
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