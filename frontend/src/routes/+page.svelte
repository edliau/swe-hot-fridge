<script>
  // Import necessary components
  import { onMount } from 'svelte';
  
  // State variables
  let searchQuery = '';
  let promotions = [];
  let faqs = [];
  
  // Fetch promotions data
  onMount(async () => {
    try {
      // This will be replaced with an actual API call later
      promotions = [
        { 
          id: 1, 
          name: 'Kleenex 3ply', 
          image: '/images/kleenex.png',
          originalPrice: 3.69,
          discountedPrice: 2.98,
          discountPercentage: 19
        },
        { 
          id: 2, 
          name: 'Jinro Strawberry', 
          image: '/images/jinro-strawberry.png',
          originalPrice: 14.99,
          discountedPrice: 12.50,
          discountPercentage: 17
        },
        { 
          id: 3, 
          name: 'LUX Jasmine 350ml', 
          image: '/images/lux-jasmine.png',
          originalPrice: 10.33,
          discountedPrice: 6.86,
          discountPercentage: 34
        }
      ];

      // FAQs data
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
    }
  });
  
  // Handle search input
  function handleSearch() {
    console.log('Searching for:', searchQuery);
    // Will implement actual search functionality later
  }
</script>

<div class="min-h-screen flex flex-col bg-white">
  <!-- Header -->
  <header class="bg-pink-400 p-4 flex items-center justify-between">
    <div class="flex items-center">
      <h1 class="text-2xl font-bold text-white mr-2">Hot<br>Fridge</h1>
      <!-- Logo placeholder -->
      <div class="h-12 w-12 bg-green-200 rounded-md flex items-center justify-center text-xs text-gray-600 font-bold">
        Logo
      </div>
    </div>
    
    <div class="flex-1 mx-4">
<!-- Replace only the search icon part in your code -->
<div class="relative">
  <input
    type="text"
    bind:value={searchQuery}
    placeholder="Search for product"
    class="w-full rounded-full py-2 px-10 border-2 border-gray-300 focus:outline-none"
  />
  <!-- Fixed magnifying glass icon with explicit sizing -->
  <div class="absolute left-3 top-1/2 transform -translate-y-1/2">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" class="text-gray-400" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  </div>
</div>
    </div>
    
    <div class="flex items-center">
      <button class="mx-2" aria-label="User account">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </button>
      <button class="mx-2" aria-label="Favorites">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      </button>
      <button class="mx-2" aria-label="Shopping cart">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </button>
    </div>
  </header>
  
  <!-- Colorful divider -->
  <div class="h-2 bg-gradient-to-r from-cyan-400 via-lime-300 to-yellow-200"></div>
  
  <!-- Main content -->
  <main class="flex-1 p-4">
    <!-- Popular Categories -->
    <div class="mb-6">
      <div class="bg-pink-200 text-lg font-semibold py-2 px-4 rounded-full inline-block shadow-md mb-3">
        Popular categories
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-red-200 p-4 rounded-lg flex flex-col items-center">
          <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <div class="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-xs font-bold">
              <span>Meat</span>
            </div>
          </div>
          <span>Meat</span>
        </div>
        
        <div class="bg-yellow-200 p-4 rounded-lg flex flex-col items-center">
          <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <div class="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center text-xs font-bold">
              <span>Dairy</span>
            </div>
          </div>
          <span>Dairy</span>
        </div>
        
        <div class="bg-green-200 p-4 rounded-lg flex flex-col items-center">
          <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold">
              <span>Produce</span>
            </div>
          </div>
          <span>Produce</span>
        </div>
        
        <div class="bg-pink-100 p-4 rounded-lg flex flex-col items-center">
          <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <div class="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center text-xs font-bold">
              <span>Beverages</span>
            </div>
          </div>
          <span>Beverages</span>
        </div>
        
        <div class="bg-purple-200 p-4 rounded-lg flex flex-col items-center">
          <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xs font-bold">
              <span>Alcohol</span>
            </div>
          </div>
          <span>Alcohol</span>
        </div>
        
        <div class="bg-orange-200 p-4 rounded-lg flex flex-col items-center">
          <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <div class="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xs font-bold">
              <span>Condiments</span>
            </div>
          </div>
          <span>Condiments</span>
        </div>
        
        <div class="bg-blue-200 p-4 rounded-lg flex flex-col items-center">
          <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold">
              <span>Cleaning</span>
            </div>
          </div>
          <span>Cleaning</span>
        </div>
        
        <div class="bg-teal-200 p-4 rounded-lg flex flex-col items-center">
          <div class="bg-white rounded-full w-16 h-16 flex items-center justify-center mb-2">
            <div class="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-xs font-bold">
              <span>Personal</span>
            </div>
          </div>
          <span>Personal care</span>
        </div>
      </div>
    </div>
    
    <!-- Promotions -->
    <div class="mb-6">
      <div class="bg-pink-200 text-lg font-semibold py-2 px-4 rounded-full inline-block shadow-md mb-3">
        Promotions
      </div>
      
      <div class="bg-amber-100 p-4 rounded-lg">
        <div class="flex overflow-x-auto space-x-4 pb-2">
          {#each promotions as promo, i}
            <div class="min-w-[150px] flex flex-col items-center">
              <!-- Placeholder for product image -->
              <div class="w-20 h-20 bg-gray-200 rounded flex items-center justify-center mb-1">
                <span class="text-xs text-gray-600 font-medium">{promo.name}</span>
              </div>
              <div class="text-center">
                <div class="font-medium">{promo.name}</div>
                <div class="flex items-center justify-center">
                  <span class="line-through text-sm text-gray-500 mr-1">${promo.originalPrice.toFixed(2)}</span>
                  <span class="font-bold text-red-600">${promo.discountedPrice.toFixed(2)}</span>
                </div>
                <div class="text-sm">({promo.discountPercentage}% OFF)</div>
              </div>
            </div>
          {/each}
          <div class="min-w-[100px] flex items-center justify-center">
            <button class="text-gray-400 hover:text-gray-600 flex flex-col items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <span class="text-xs text-gray-500">See all promotions<br>and discounts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    
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
      <a href="/account" class="bg-pink-200 text-center w-64 py-3 px-4 rounded-full shadow-md font-semibold">
        Account
      </a>
    </div>
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
      <!-- Logo placeholder -->
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