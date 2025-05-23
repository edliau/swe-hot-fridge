<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/auth';
  import { addressListAPI, shoppingListsAPI } from '$lib/api';
  import SearchBar from '$lib/components/SearchBar.svelte';
  
  // State variables
  let shoppingLists = [];
  let pastOrders = [];
  let isLoading = true;
  let isOrdersLoading = false;
  let isListsLoading = false;
  let errorMessage = '';
  let user = null;
  let activeTab = 'orders';
  let newListName = '';
  let isCreatingList = false;
  let showNewListForm = false;


  let showNewAddressForm = false;
  let isAddressListsLoading = false;
  let newStreetAddress = '';
  let newApartment = '';
  let newCity = '';
  let newCountryState = '';
  let newPostalCode = '';
  let newCountry = '';
  let newPhoneNumber = '';
  let isDefaultAddress = false;
  let deliveryInstructions = '';
  let isCreatingAddress = false;
  let addressLists = [];

  let addressIdToEdit = ''; //may not need
  let showEditAddressForm = false;
  let editedStreetAddress = '';
  let editedApartment = '';
  let editedCity = '';
  let editedCountryState = '';
  let editedPostalCode = '';
  let editedCountry = '';
  let editedPhoneNumber = '';
  let editedDefaultAddress = false;
  let editedDeliveryInstructions = '';
  let isEditingAddress = false;
  
  // Subscribe to auth store
  $: isAuthenticated = $authStore.isAuthenticated;
  $: user = $authStore.user;
  $: {
    if (!$authStore.isLoading && !isAuthenticated) {
      // Redirect to login if not authenticated
      goto('/account');
    }
  }
  $: {
    if (!$authStore.isLoading && isAuthenticated) {
      // Fetch data when user is authenticated
      loadShoppingLists();
      loadPastOrders();
      loadAddressList();
    }
}
  
  
  onMount(async () => {
    try {
      isLoading = true;
      
      // Wait for auth status to resolve
      if (!isAuthenticated) return;
      
      // Load both data types in parallel
      await Promise.all([
        loadShoppingLists(),
        loadPastOrders(),
        loadAddressList()
      ]);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      errorMessage = error.message || 'Failed to load dashboard data';
    } finally {
      isLoading = false;
    }
  });
  
  async function loadShoppingLists() {
    try {
      isListsLoading = true;
      const response = await shoppingListsAPI.getLists();
      shoppingLists = response.data || [];
      console.log('Shopping lists loaded:', shoppingLists);
    } catch (error) {
      console.error('Error fetching shopping lists:', error);
      return []; // Return empty array instead of failing completely
    } finally {
      isListsLoading = false;
    }
  }

  async function loadAddressList() {
    try {
      isAddressListsLoading = true;
      const response = await addressListAPI.getAddresses(user._id);
      addressLists = response.data || [];
      console.log('Address lists loaded:', addressList);
    } catch (error) {
      console.error('Error fetching address lists:', error);
      return []; // Return empty array instead of failing completely
    } finally {
      isAddressListsLoading = false;
    }
  }
  
  async function loadPastOrders() {
    try {
      isOrdersLoading = true;
      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const result = await response.json();
      pastOrders = result.data || [];
      console.log('Orders loaded:', pastOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      return []; // Return empty array instead of failing completely
    } finally {
      isOrdersLoading = false;
    }
  }
  
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

  // Shopping list functions
  async function createNewAddress() {
    
    try {
      isCreatingAddress = true;
      
      const response = await addressListAPI.createAddress({ 
        userId: user._id,
        streetAddress: newStreetAddress,
        apartment: newApartment,
        city: newCity,
        state: newCountryState,
        postalCode: newPostalCode,
        country: newCountry,
        phoneNumber: newPhoneNumber,
        isDefaultAddress: isDefaultAddress,
        deliveryInstructions: deliveryInstructions,
      });
      
      // Add new list to existing lists
      addressLists = [...addressLists, response.data];
      
      // Reset form
      newListName = '';
      showNewAddressForm = false;
    } catch (error) {
      console.error('Error creating address:', error);
      errorMessage = error.message || 'Failed to create address';
    } finally {
      isCreatingAddress = false;
    }
  }

  async function editAddress() {
    
    try {
      isEditingAddress = true;
      
      const response = await addressListAPI.updateAddress(addressIdToEdit, { 
        streetAddress: editedStreetAddress,
        apartment: editedApartment,
        city: editedCity,
        state: editedCountryState,
        postalCode: editedPostalCode,
        country: editedCountry,
        phoneNumber: editedPhoneNumber,
        isDefaultAddress: editedDefaultAddress,
        deliveryInstructions: editedDeliveryInstructions,
      });
      
      // Update the address in the list
      addressLists = addressLists.map(list => list._id === addressIdToEdit ? response.data : list);
      
      // Reset form
      showEditAddressForm = false;
    } catch (error) {
      console.error('Error editing address:', error);
      errorMessage = error.message || 'Failed to edit address';
    } finally {
      isEditingAddress = false;
    }
  }

  async function deleteAddress(id) {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }
    
    try {
      await addressListAPI.deleteAddress(id);
      // Remove deleted list from array
      addressLists = addressLists.filter(list => list._id !== id);
    } catch (error) {
      console.error('Error deleting address:', error);
      errorMessage = error.message || 'Failed to delete address';
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
  
  // Clear error message
  function clearError() {
    errorMessage = '';
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
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
        <span>{errorMessage}</span>
        <button on:click={clearError} class="text-red-700 hover:text-red-900" aria-label="Clear error message">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    {/if}
    
    {#if isLoading && $authStore.isLoading}
      <div class="flex justify-center items-center py-10">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        <p class="ml-2 text-gray-600">Loading your dashboard...</p>
      </div>
    {:else if !isAuthenticated}
      <div class="bg-amber-100 p-4 rounded-lg">
        <p>Please <a href="/account" class="text-pink-500 hover:underline">log in</a> to view your dashboard.</p>
      </div>
    {:else}
      <!-- Welcome section -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <div class="flex items-center justify-between gap-16 mb-4">
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
          <button 
          class={`py-2 px-4 font-medium ${activeTab === 'address-list' ? 'border-b-2 border-pink-400 text-pink-500' : 'text-gray-500 hover:text-gray-700'}`}
          on:click={() => activeTab = 'address-list'}
        >
          Address Management
        </button>
        </div>
      </div>
      
      <!-- Orders Tab Content -->
      <div class={activeTab === 'orders' ? '' : 'hidden'}>
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="border-b p-4 bg-pink-50 flex justify-between items-center">
            <h2 class="text-xl font-semibold">My Orders</h2>
          </div>
          
          {#if isOrdersLoading}
            <div class="p-6 text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-2"></div>
              <p class="text-gray-500">Loading orders...</p>
            </div>
          {:else if pastOrders.length === 0}
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
                      <h3 class="font-medium">Order #{order._id.substring(0, 8)}...</h3>
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
          
          {#if isListsLoading}
            <div class="p-6 text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-2"></div>
              <p class="text-gray-500">Loading addresses...</p>
            </div>
          {:else if shoppingLists.length === 0}
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

      <!-- Address Manager -->
      <div class={activeTab === 'address-list' ? '' : 'hidden'}>
        <div class="bg-white rounded-lg shadow-md overflow-hidden">
          <div class="border-b p-4 bg-pink-50 flex justify-between items-center">
            <h2 class="text-xl font-semibold">My Addresses</h2>
            <button 
              on:click={() => showNewAddressForm = !showNewAddressForm}
              class="px-3 py-1 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors text-sm flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Address
            </button>
          </div>
          
          {#if showNewAddressForm}
            <div class="p-4 border-b bg-gray-50">
              <form on:submit|preventDefault={createNewAddress} class="flex-col items-center space-x-2">
                <input 
                  type="text" 
                  bind:value={newStreetAddress}
                  label="Street Address"
                  placeholder="Enter Street Address"
                  required
                  class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                />
                <input 
                  type="text" 
                  bind:value={newApartment}
                  label="Apartment"
                  placeholder="Enter Apartment"
                  required
                  class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                />
                <input 
                  type="text" 
                  bind:value={newCity}
                  label="City"
                  placeholder="Enter City"
                  required
                  class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                />
                <input 
                  type="text" 
                  bind:value={newCountryState}
                  label="State"
                  placeholder="Enter State"
                  required
                  class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                />
                <input 
                  type="text" 
                  bind:value={newPostalCode}
                  label="Postal Code"
                  placeholder="Enter Postal Code"
                  required
                  class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                />
                <input 
                  type="text" 
                  bind:value={newCountry}
                  label="Country"
                  placeholder="Enter Country"
                  required
                  class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                />
                <input 
                  type="text" 
                  bind:value={newPhoneNumber}
                  label="Phone Number"
                  placeholder="Enter Phone Number"
                  required
                  class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                />
                <!-- checkbox for default -->
                 <span class="mr-2">Default Address?</span>
                <input 
                  type="checkbox" 
                  label="Default Address?"
                  bind:checked={isDefaultAddress}
                  class="mr-2"
                />
                <!-- delivery instructions -->
                <input 
                  type="text" 
                  bind:value={deliveryInstructions}
                  label="Delivery Instructions"
                  placeholder="Enter Delivery Instructions"
                  class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                />
                <button 
                  type="submit"
                  disabled={isCreatingAddress}
                  class="px-4 py-2 bg-pink-400 text-white rounded hover:bg-pink-500 disabled:opacity-50"
                >
                  {isCreatingAddress ? 'Adding...' : 'Add'}
                </button>
                <button 
                  type="button"
                  on:click={() => showNewAddressForm = false}
                  class="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancel
                </button>
              </form>
            </div>
          {/if}
          
          {#if isAddressListsLoading}
            <div class="p-6 text-center">
              <div class="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pink-500 mb-2"></div>
              <p class="text-gray-500">Loading lists...</p>
            </div>
          {:else if addressLists.length === 0}
            <div class="p-6 text-center text-gray-500">
              <p>You don't have any addresses yet.</p>
              <button 
                on:click={() => showNewAddressForm = true}
                class="text-pink-500 inline-block mt-2 hover:underline"
              >
                Add your first address
              </button>
            </div>
          {:else}
            <div class="divide-y">
              {#each addressLists as list}
                <div class="p-4 hover:bg-gray-50 transition-colors">
                  <div class="flex justify-between items-start">
                    {#if showEditAddressForm && addressIdToEdit === list._id}
                      <form on:submit|preventDefault={editAddress} class="flex-col items-center space-x-2">
                        <input 
                          type="text" 
                          bind:value={editedStreetAddress}
                          label="Street Address"
                          placeholder="Enter Street Address"
                          required
                          class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                        />
                        <input 
                          type="text" 
                          bind:value={editedApartment}
                          label="Apartment"
                          placeholder="Enter Apartment"
                          required
                          class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                        />
                        <input 
                          type="text" 
                          bind:value={editedCity}
                          label="City"
                          placeholder="Enter City"
                          required
                          class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                        />
                        <input 
                          type="text" 
                          bind:value={editedCountryState}
                          label="State"
                          placeholder="Enter State"
                          required
                          class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                        />
                        <input 
                          type="text" 
                          bind:value={editedPostalCode}
                          label="Postal Code"
                          placeholder="Enter Postal Code"
                          required
                          class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                        />
                        <input 
                          type="text" 
                          bind:value={editedCountry}
                          label="Country"
                          placeholder="Enter Country"
                          required
                          class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                        />
                        <input 
                          type="text" 
                          bind:value={editedPhoneNumber}
                          label="Phone Number"
                          placeholder="Enter Phone Number"
                          required
                          class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                        />
                        <!-- checkbox for default -->
                        <span class="mr-2">Default Address?</span>
                        <input 
                            type="checkbox" 
                            label="Default Address?"
                            bind:checked={editedDefaultAddress}
                            class="mr-2"
                        />
                        <!-- delivery instructions -->
                        <input 
                            type="text" 
                            bind:value=
                            {editedDeliveryInstructions}
                            label="Delivery Instructions"
                            placeholder="Enter Delivery Instructions"
                            class="flex-1 p-2 rounded border focus:ring-pink-400 focus:border-pink-400"
                        />
                        <button 
                          type="submit"
                          disabled={isEditingAddress}
                          class="px-4 py-2 bg-pink-400 text-white rounded hover:bg-pink-500 disabled:opacity-50"
                        >
                          {isEditingAddress ? 'Editing...' : 'Save'}
                        </button>
                        <button 
                          type="button"
                          on:click={() => showEditAddressForm = false}
                          class="px-4 py-2 border rounded hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </form>
                    {/if}
                    {#if !showEditAddressForm || addressIdToEdit !== list._id}
                    <div>
                      <h3 class="font-medium">{list.streetAddress}</h3>
                      {#if list.city}
                        <p class="text-sm text-gray-600">{list.city}</p>
                      {/if}
                      {#if list.state}
                      <p class="text-sm text-gray-600">{list.state}</p>
                    {/if}
                    {#if list.postalCode}
                      <p class="text-sm text-gray-600">{list.postalCode}</p>
                    {/if}
                    {#if list.country}
                      <p class="text-sm text-gray-600">{list.country}</p>
                    {/if}
                    {#if list.phoneNumber}
                      <p class="text-sm text-gray-600">{list.phoneNumber}</p>
                    {/if}
                    {#if list.deliveryInstructions}
                      <p class="text-sm text-gray-600">{list.deliveryInstructions}</p>
                    {/if}
                    {#if list.isDefault}
                      <p class="text-sm text-gray-600">Default Address</p>
                    {/if}
                  </div>
                    <div class="flex space-x-2">
                      <button 
                        on:click={() => {
                          addressIdToEdit = list._id;
                          editedStreetAddress = list.streetAddress;
                          editedApartment = list.apartment;
                          editedCity = list.city;
                          editedCountryState = list.state;
                          editedPostalCode = list.postalCode;
                          editedCountry = list.country;
                          editedPhoneNumber = list.phoneNumber;
                          editedDefaultAddress = list.isDefault;
                          editedDeliveryInstructions = list.deliveryInstructions;
                          showEditAddressForm = true;
                        }}
                        class="px-3 py-1 bg-pink-400 text-white rounded hover:bg-pink-500 text-sm"
                      >
                        Edit
                      </button>
                      <button 
                        on:click={() => deleteAddress(list._id)}
                        class="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                    {/if}
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
      <img 
      src="/images/logo/logo.png" 
      alt="Hot Fridge Logo" 
      class="h-12 w-12 rounded-md"
      />
    </div>
  </footer>
</div>