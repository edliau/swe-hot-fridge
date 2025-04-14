<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { authStore } from '$lib/stores/auth';
    import { shoppingListsAPI } from '$lib/api';
    
    // State variables
    let shoppingLists = [];
    let pastOrders = [];
    let isLoading = true;
    let errorMessage = '';
    let user = null;
    let activeTab = 'orders';
    let newListName = '';
    let isCreatingList = false;
    let showNewListForm = false;
    
    // Subscribe to auth store
    $: isAuthenticated = $authStore.isAuthenticated;
    $: user = $authStore.user;
    $: if (!isAuthenticated && !$authStore.isLoading) {
      // Redirect to login if not authenticated
      goto('/account');
    }
    
    onMount(async () => {
      if (!isAuthenticated) return;
      
      try {
        isLoading = true;
        
        // Fetch shopping lists
        try {
          const response = await shoppingListsAPI.getLists();
          shoppingLists = response.data || [];
        } catch (error) {
          console.error('Error fetching shopping lists:', error);
        }
        
        // Fetch past orders
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          
          if (response.ok) {
            const result = await response.json();
            pastOrders = result.data || [];
          }
        } catch (error) {
          console.error('Error fetching orders:', error);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        errorMessage = error.message || 'Failed to load dashboard data';
      } finally {
        isLoading = false;
      }
    });
    
    async function handleLogout() {
      await authStore.logout();
      goto('/');
    }
    
    // Shopping list functions
    async function createNewList() {
      if (!newListName.trim()) {
        errorMessage = 'Please enter a list name';
        return;
      }
      
      try {
        isCreatingList = true;
        
        const response = await shoppingListsAPI.createList({ 
          name: newListName,
          description: ''
        });
        
        // Add new list to existing lists
        shoppingLists = [...shoppingLists, response.data];
        
        // Reset form
        newListName = '';
        showNewListForm = false;
      } catch (error) {
        console.error('Error creating shopping list:', error);
        errorMessage = error.message || 'Failed to create shopping list';
      } finally {
        isCreatingList = false;
      }
    }
    
    async function deleteList(id) {
      if (!confirm('Are you sure you want to delete this shopping list?')) {
        return;
      }
      
      try {
        await shoppingListsAPI.deleteList(id);
        // Remove deleted list from array
        shoppingLists = shoppingLists.filter(list => list._id !== id);
      } catch (error) {
        console.error('Error deleting shopping list:', error);
        errorMessage = error.message || 'Failed to delete shopping list';
      }
    }
    
    function viewList(id) {
      goto(`/shopping-list/${id}`);
    }
    
    function viewOrder(id) {
      goto(`/order/${id}`);
    }
    
    // Format date for display
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
    <main class="flex-1 p-4 max-w-4xl mx-auto">
      <div class="bg-pink-200 text-lg font-semibold py-2 px-4 rounded-full inline-block shadow-md mb-3">
        My Dashboard
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
      {:else}
        <!-- Welcome section -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-xl font-bold">Welcome, {user ? user.firstName : 'User'}!</h2>
              <p class="text-gray-600">Manage your orders and shopping lists</p>
            </div>
            <button 
              on:click={handleLogout}
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
        
        <!-- Tabs -->
        <div class="mb-6">
          <div class="flex border-b">
            <button 
              class={`py-2 px-4 font-medium ${activeTab === 'orders' ? 'border-b-2 border-pink-400 text-pink-500' : 'text-gray-500 hover:text-gray-700'}`}
              on:click={() => activeTab = 'orders'}
            >
              My Orders
            </button>
            <button 
              class={`py-2 px-4 font-medium ${activeTab === 'shopping-lists' ? 'border-b-2 border-pink-400 text-pink-500' : 'text-gray-500 hover:text-gray-700'}`}
              on:click={() => activeTab = 'shopping-lists'}
            >
              Shopping Lists
            </button>
          </div>
        </div>
        
        <!-- Orders Tab Content -->
        <div class={activeTab === 'orders' ? '' : 'hidden'}>
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="border-b p-4 bg-pink-50 flex justify-between items-center">
              <h2 class="text-xl font-semibold">My Orders</h2>
            </div>
            
            {#if pastOrders.length === 0}
              <div class="p-6 text-center text-gray-500">
                <p>You haven't placed any orders yet.</p>
                <a href="/" class="text-pink-500 inline-block mt-2 hover:underline">Start Shopping</a>
              </div>
            {:else}
              <div class="divide-y">
                {#each pastOrders as order}
                  <div class="p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex justify-between items-start">
                      <div>
                        <h3 class="font-medium">Order #{order._id}</h3>
                        <p class="text-sm text-gray-500">Placed on {formatDate(order.orderDate)}</p>
                        <p class="text-sm">
                          <span class="font-medium">Status:</span>
                          <span class={order.status === 'Delivered' ? 'text-green-600' : order.status === 'Cancelled' ? 'text-red-600' : 'text-yellow-600'}>
                            {order.status}
                          </span>
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-bold">${order.total.toFixed(2)}</p>
                        <p class="text-sm text-gray-500">{order.orderItems.length} item(s)</p>
                        <button 
                          on:click={() => viewOrder(order._id)}
                          class="text-pink-500 text-sm hover:underline mt-1"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Shopping Lists Tab Content -->
        <div class={activeTab === 'shopping-lists' ? '' : 'hidden'}>
          <div class="bg-white rounded-lg shadow-md overflow-hidden">
            <div class="border-b p-4 bg-pink-50 flex justify-between items-center">
              <h2 class="text-xl font-semibold">Shopping Lists</h2>
              <button 
                on:click={() => showNewListForm = !showNewListForm}
                class="px-3 py-1 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New List
              </button>
            </div>
            
            {#if showNewListForm}
              <div class="p-4 border-b bg-gray-50">
                <form on:submit|preventDefault={createNewList} class="flex items-center space-x-2">
                  <input 
                    type="text" 
                    bind:value={newListName}
                    placeholder="Enter list name"
                    required
                    class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                  />
                  <button 
                    type="submit"
                    disabled={isCreatingList}
                    class="px-4 py-2 bg-pink-400 text-white rounded hover:bg-pink-500 disabled:opacity-50"
                  >
                    {isCreatingList ? 'Creating...' : 'Create'}
                  </button>
                  <button 
                    type="button"
                    on:click={() => showNewListForm = false}
                    class="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </form>
              </div>
            {/if}
            
            {#if shoppingLists.length === 0}
              <div class="p-6 text-center text-gray-500">
                <p>You don't have any shopping lists yet.</p>
                <button 
                  on:click={() => showNewListForm = true}
                  class="text-pink-500 inline-block mt-2 hover:underline"
                >
                  Create your first list
                </button>
              </div>
            {:else}
              <div class="divide-y">
                {#each shoppingLists as list}
                  <div class="p-4 hover:bg-gray-50 transition-colors">
                    <div class="flex justify-between items-start">
                      <div>
                        <h3 class="font-medium">{list.name}</h3>
                        {#if list.description}
                          <p class="text-sm text-gray-600">{list.description}</p>
                        {/if}
                        <p class="text-sm text-gray-500">Created on {formatDate(list.createdAt)}</p>
                        <p class="text-sm">
                          <span class="font-medium">Items:</span> {list.items?.length || 0}
                        </p>
                      </div>
                      <div class="flex space-x-2">
                        <button 
                          on:click={() => viewList(list._id)}
                          class="px-3 py-1 bg-pink-400 text-white rounded hover:bg-pink-500 text-sm"
                        >
                          View
                        </button>
                        <button 
                          on:click={() => deleteList(list._id)}
                          class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
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