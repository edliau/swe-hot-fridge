<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { orderAPI } from '$lib/api';
    import { authStore } from '$lib/stores/auth';
    
    let order = null;
    let isLoading = true;
    let errorMessage = '';
    let orderId = $page.params.orderId;
    
    // Subscribe to auth store
    $: isAuthenticated = $authStore.isAuthenticated;
    $: user = $authStore.user;
    
    onMount(async () => {
      if (!orderId) {
        errorMessage = 'Order ID is missing';
        isLoading = false;
        return;
      }
      
      try {
        isLoading = true;
        const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }
        
        const result = await response.json();
        order = result.data;
      } catch (error) {
        console.error('Error fetching order details:', error);
        errorMessage = error.message || 'Failed to load order details';
      } finally {
        isLoading = false;
      }
    });
    
    function continueShopping() {
      goto('/');
    }
    
    function viewOrders() {
      goto('/account/orders');
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
      
      <div class="flex items-center">
        <a href="/account" class="mx-2" aria-label="Account">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
    <main class="flex-1 p-4 max-w-4xl mx-auto">
      {#if errorMessage}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      {/if}
      
      {#if isLoading}
        <div class="flex justify-center items-center py-10">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      {:else if order}
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-800 mb-2">Order Confirmed!</h1>
          <p class="text-lg text-gray-600">Thank you for your purchase.</p>
          <p class="text-gray-500">Your order number is: <span class="font-medium">{order._id}</span></p>
        </div>
        
        <div class="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div class="border-b p-4 bg-pink-50">
            <h2 class="text-xl font-bold">Order Summary</h2>
          </div>
          
          <div class="p-4">
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 class="font-medium mb-2">Order Information</h3>
                <p><span class="text-gray-500">Order date:</span> {new Date(order.orderDate).toLocaleString()}</p>
                <p><span class="text-gray-500">Status:</span> {order.status}</p>
                <p><span class="text-gray-500">Payment status:</span> {order.paymentStatus}</p>
              </div>
              
              <div>
                <h3 class="font-medium mb-2">Delivery Information</h3>
                <p><span class="text-gray-500">Delivery date:</span> {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Not specified'}</p>
                <p>
                  <span class="text-gray-500">Time slot:</span> 
                  {#if order.deliveryTimeSlot === 'morning'}
                    Morning (8:00 AM - 12:00 PM)
                  {:else if order.deliveryTimeSlot === 'afternoon'}
                    Afternoon (12:00 PM - 4:00 PM)
                  {:else if order.deliveryTimeSlot === 'evening'}
                    Evening (4:00 PM - 8:00 PM)
                  {:else}
                    {order.deliveryTimeSlot || 'Not specified'}
                  {/if}
                </p>
                {#if order.specialInstructions}
                  <p><span class="text-gray-500">Special instructions:</span> {order.specialInstructions}</p>
                {/if}
              </div>
            </div>
            
            <h3 class="font-medium mb-2">Items</h3>
            <div class="border rounded-lg overflow-hidden mb-4">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  {#each order.orderItems as item}
                    <tr>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-900">{item.productName}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">{item.quantity}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${item.price.toFixed(2)}</div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm text-gray-900">${item.total.toFixed(2)}</div>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
            
            <div class="flex justify-end">
              <div class="w-64 space-y-2">
                <div class="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span>Tax:</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-sm font-bold">
                  <span>Total:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-4 mb-8">
          <h2 class="text-xl font-bold mb-4">Shipping Address</h2>
          {#if order.addressId}
            <div>
              <div>{order.addressId.streetAddress}</div>
              {#if order.addressId.apartment}
                <div>{order.addressId.apartment}</div>
              {/if}
              <div>{order.addressId.city}, {order.addressId.state} {order.addressId.postalCode}</div>
              <div>{order.addressId.country}</div>
              <div>Phone: {order.addressId.phoneNumber}</div>
            </div>
          {:else}
            <p class="text-gray-500">Shipping address details not available</p>
          {/if}
        </div>
        
        <div class="flex justify-center space-x-4">
          <button 
            on:click={continueShopping}
            class="px-6 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors"
          >
            Continue Shopping
          </button>
          
          {#if isAuthenticated}
            <button 
              on:click={viewOrders}
              class="px-6 py-2 border border-pink-400 text-pink-500 rounded-lg hover:bg-pink-50 transition-colors"
            >
              View My Orders
            </button>
          {/if}
        </div>
      {:else}
        <div class="text-center py-10">
          <h1 class="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h1>
          <p class="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
          <button 
            on:click={continueShopping}
            class="px-6 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors"
          >
            Back to Shopping
          </button>
        </div>
      {/if}
    </main>
    
    <!-- Footer -->
    <footer class="bg-pink-400 p-4 text-white mt-8">
      <div class="max-w-4xl mx-auto">
        <div class="grid grid-cols-3 gap-4">
          <div>
            <h3 class="font-bold mb-2">Need help?</h3>
            <p class="text-sm">24/7 hotline: +65 4823 4328</p>
            <p class="text-sm">customerqueries@hotfridge.com</p>
          </div>
          
          <div>
            <h3 class="font-bold mb-2">Thank you!</h3>
            <p class="text-sm">Your order will be processed soon.</p>
          </div>
          
          <div class="text-right">
            <div class="flex items-center justify-end">
              <div class="text-right mr-2">
                <div class="text-xl font-bold">Hot<br>Fridge</div>
                <div class="text-xs">Fresh produce at the<br>click of a finger</div>
              </div>
              <div class="h-10 w-10 bg-green-200 rounded-md flex items-center justify-center text-xs text-gray-600 font-bold">
                Logo
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </div>