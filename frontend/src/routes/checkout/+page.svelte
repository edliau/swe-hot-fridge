<script>
    import { onMount, onDestroy } from 'svelte';
    import { goto } from '$app/navigation';
    import { cartStore, cartTotal } from '$lib/stores/cart';
    import { authStore } from '$lib/stores/auth';
    import { orderAPI, paymentAPI } from '$lib/api';
    import stripeService from '$lib/services/stripeService';
    
    // State variables
    let isLoading = true;
    let errorMessage = '';
    let successMessage = '';
    let selectedAddress = null;
    let selectedPaymentMethod = null;
    let addresses = [];
    let paymentMethods = [];
    let showAddressForm = false;
    let showPaymentForm = false;
    let isProcessingPayment = false;
    let stage = 'shipping'; // shipping, payment, review
    let cardElementError = '';
    let deliveryDate = '';
    let deliveryTimeSlot = 'morning';
    let specialInstructions = '';
    let tax = 0;
    
    // Form data
    let addressForm = {
      streetAddress: '',
      apartment: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Singapore',
      phoneNumber: '',
      isDefault: false
    };
    
    // Payment form data
    let paymentForm = {
      cardholderName: '',
      saveCard: false
    };
    
    // Subscribe to cart and auth stores
    $: items = $cartStore.items.filter(item => item.selected);
    $: subtotal = $cartTotal.totalAmount;
    $: total = subtotal + tax;
    $: isAuthenticated = $authStore.isAuthenticated;
    $: user = $authStore.user;
    
    onMount(async () => {
      try {
        isLoading = true;
        
        // Load cart items if not already loaded
        if (items.length === 0) {
          await cartStore.fetchItems();
        }
        
        // If cart is empty after fetching, redirect to cart page
        if ($cartStore.items.filter(item => item.selected).length === 0) {
          goto('/cart');
          return;
        }
        
        // Calculate tax (5% of subtotal)
        tax = Math.round(subtotal * 0.05 * 100) / 100;
        
        // If user is authenticated, fetch addresses and payment methods
        if (isAuthenticated && user) {
          await loadUserData();
        }
        
        // Set default delivery date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        deliveryDate = tomorrow.toISOString().split('T')[0];
        
        // Initialize Stripe if we're on the client side
        if (typeof window !== 'undefined') {
          await initializeStripe();
        }
      } catch (error) {
        console.error('Error loading checkout data:', error);
        errorMessage = error.message || 'Failed to load checkout data';
      } finally {
        isLoading = false;
      }
    });

    onDestroy(() => {
  // Clean up Stripe resources when component is destroyed
  if (stripeService.cardElement) {
    try {
      stripeService.cardElement.unmount();
      stripeService.cardElement = null;
    } catch (e) {
      console.log("Error unmounting card element:", e);
    }
  }
});
    
    async function loadUserData() {
    try {
        console.log("Loading user data, user:", user);
        
        // Fetch user data with populated addresses
        const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
        });
        
        if (!response.ok) {
        throw new Error('Failed to fetch user data');
        }
        
        const result = await response.json();
        console.log("User data received:", result);
        
        // If user has addresses, populate the addresses array
        if (result.data.addresses && result.data.addresses.length > 0) {
        addresses = result.data.addresses;
        console.log("Addresses loaded:", addresses);
        
        // Select default address if exists
        const defaultAddress = addresses.find(addr => addr.isDefault);
        selectedAddress = defaultAddress || addresses[0];
        } else {
        console.log("No addresses found for user");
        }
        
        // Fetch payment methods
        if (user.paymentMethods && user.paymentMethods.length > 0) {
          paymentMethods = user.paymentMethods;
          // Select default payment method if exists
          const defaultPayment = paymentMethods.find(pm => pm.isDefault);
          selectedPaymentMethod = defaultPayment || paymentMethods[0];
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    }
    
    async function initializeStripe() {
      try {
        // Initialize the Stripe service with publishable key from environment
        await stripeService.initialize(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
        
        // Create card element if we're at the payment stage
        if (stage === 'payment') {
          setupCardElement();
        }
      } catch (error) {
        console.error('Error initializing Stripe:', error);
        errorMessage = 'Failed to initialize payment system. Please try again later.';
      }
    }
    
    function setupCardElement() {
    try {
        console.log("Setting up card element...");
        
        // Make sure div exists before trying to mount
        const cardElement = document.getElementById('card-element');
        if (!cardElement) {
        console.error("Card element container not found in DOM");
        return;
        }
        
        // If Stripe is initialized, create the card element
        if (stripeService.isInitialized) {
        // Create card element and handle errors
        const element = stripeService.createCardElement('card-element');
        
        // Listen for card element errors
        element.on('change', (event) => {
            cardElementError = event.error ? event.error.message : '';
        });
        
        console.log("Card element setup complete");
        } else {
        console.error("Stripe not initialized");
        errorMessage = "Payment system not ready yet";
        }
    } catch (error) {
        console.error('Error setting up card element:', error);
        errorMessage = 'Failed to set up payment form: ' + error.message;
    }
    }
    
    async function handleAddressSubmit() {
    if (!addressForm.streetAddress || !addressForm.city || !addressForm.state || 
        !addressForm.postalCode || !addressForm.phoneNumber) {
        errorMessage = 'Please fill in all required fields';
        return;
    }
    
    try {
        // Add user ID to address form
        const addressData = {
        ...addressForm,
        userId: $authStore.user._id
        };
        
        // Call API to save address
        const response = await fetch(`${import.meta.env.VITE_API_URL}/addresses`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(addressData)
        });
        
        const result = await response.json();
        
        if (!result.success) {
        throw new Error(result.message || 'Failed to save address');
        }
        
        console.log('Address saved successfully:', result.data);
        
        // Add the new address to the user's addresses in the database
        const updateUserResponse = await fetch(`${import.meta.env.VITE_API_URL}/users/address`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(addressData)
        });
        
        const updateUserResult = await updateUserResponse.json();
        
        if (!updateUserResult.success) {
        console.warn('Address created but not added to user profile:', updateUserResult.message);
        }
        
        // Add the new address to the local addresses array
        addresses = [...addresses, result.data];
        selectedAddress = result.data;
        
        // Close the form
        showAddressForm = false;
        
        // Reset form
        addressForm = {
        streetAddress: '',
        apartment: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Singapore',
        phoneNumber: '',
        isDefault: false
        };
        
        successMessage = 'Address saved successfully';
        setTimeout(() => {
        successMessage = '';
        }, 3000);
    } catch (error) {
        console.error('Error saving address:', error);
        errorMessage = error.message || 'Failed to save address';
    }
    }
    
    function selectAddress(address) {
      selectedAddress = address;
    }
    
    function selectPaymentMethod(method) {
      selectedPaymentMethod = method;
    }
    
    function goToStage(newStage) {
    // If moving away from payment stage, clean up card element
    if (stage === 'payment' && newStage !== 'payment') {
        if (stripeService.cardElement) {
        try {
            stripeService.cardElement.unmount();
            stripeService.cardElement = null;
        } catch (e) {
            console.log("Error unmounting card element:", e);
        }
        }
    }
        
    if (newStage === 'review') {
        if (!selectedPaymentMethod && !showPaymentForm) {
        errorMessage = 'Please select a payment method';
        return;
        }
        
        // Check for card element errors if using a new card
        if (showPaymentForm && cardElementError) {
        errorMessage = 'Please fix the issues with your card information: ' + cardElementError;
        return;
        }
    }
    
    // Clear any error messages
    errorMessage = '';
    
    // If moving away from payment stage to review, validate payment form
    if (stage === 'payment' && newStage === 'review' && showPaymentForm) {
        if (!paymentForm.cardholderName) {
        errorMessage = 'Please enter the cardholder name';
        return;
        }
    }

    // If going to payment stage
  if (newStage === 'payment' && showPaymentForm) {
    setTimeout(() => {
      setupCardElement();
    }, 100);
  }
    
    // Update the stage
    stage = newStage;
    
    // If going to payment stage, initialize Stripe elements
    if (newStage === 'payment') {
        // Only set up card element if showing payment form
        if (showPaymentForm) {
        setupCardElement();
        }
    }
    }
    
    async function placeOrder() {
      try {
        isProcessingPayment = true;
        errorMessage = '';
        
        // Make sure we have all required information
        if (!selectedAddress) {
          errorMessage = 'Please select a shipping address';
          isProcessingPayment = false;
          return;
        }
        
        if (!selectedPaymentMethod && !showPaymentForm) {
          errorMessage = 'Please select a payment method';
          isProcessingPayment = false;
          return;
        }
        
        // Check for card element errors
        if (showPaymentForm && cardElementError) {
          errorMessage = cardElementError;
          isProcessingPayment = false;
          return;
        }
        
        // Prepare order data
        const orderData = {
          orderItems: items.map(item => ({
            productId: item.productId._id,
            quantity: item.quantity
          })),
          addressId: selectedAddress._id,
          paymentMethodId: selectedPaymentMethod ? selectedPaymentMethod._id : null,
          tax,
          deliveryDate,
          deliveryTimeSlot,
          specialInstructions
        };
        
        // Create order
        const createOrderResponse = await orderAPI.createOrder(orderData);
        
        if (!createOrderResponse.success) {
          throw new Error(createOrderResponse.message || 'Failed to create order');
        }
        
        const order = createOrderResponse.data;
        
        // If using new card, create payment intent and confirm with card element
        if (showPaymentForm) {
          // Create payment intent
          const paymentIntentResponse = await paymentAPI.createPaymentIntent({
            orderId: order._id,
            savePaymentMethod: paymentForm.saveCard
          });
          
          if (!paymentIntentResponse.success) {
            throw new Error(paymentIntentResponse.message || 'Failed to create payment intent');
          }
          
          // Confirm payment with card element
          const { error, paymentIntent } = await stripeService.confirmCardPayment(
            paymentIntentResponse.clientSecret,
            {
              payment_method: {
                card: stripeService.cardElement,
                billing_details: {
                  name: paymentForm.cardholderName || `${user?.firstName || ''} ${user?.lastName || 'Guest'}`
                }
              }
            }
          );
          
          if (error) {
            throw new Error(error.message || 'Payment failed');
          }
          
          if (paymentIntent.status !== 'succeeded') {
            throw new Error('Payment processing failed');
          }
        } else if (selectedPaymentMethod) {
          // Use existing payment method
          const paymentIntentResponse = await paymentAPI.createPaymentIntent({
            orderId: order._id,
            paymentMethodId: selectedPaymentMethod._id
          });
          
          if (!paymentIntentResponse.success) {
            throw new Error(paymentIntentResponse.message || 'Failed to process payment');
          }
          
          // If the payment intent requires confirmation
          if (paymentIntentResponse.status === 'requires_confirmation') {
            const { error, paymentIntent } = await stripeService.confirmPaymentWithExistingMethod(
              paymentIntentResponse.clientSecret,
              selectedPaymentMethod.stripePaymentMethodId
            );
            
            if (error) {
              throw new Error(error.message || 'Payment confirmation failed');
            }
            
            if (paymentIntent.status !== 'succeeded') {
              throw new Error('Payment processing failed');
            }
          }
        }
        
        // Clean up Stripe resources
        stripeService.cleanup();
        
        // Clear cart after successful order
        await cartStore.clearCart();

        // Refresh user data to get updated addresses
        await authStore.refreshUserData();
        
        // Go to order confirmation page
        goto(`/order/confirmation/${order._id}`);
      } catch (error) {
        console.error('Error placing order:', error);
        errorMessage = error.message || 'Failed to place order';
        isProcessingPayment = false;
      }
    }
    
    // Add new payment method button handler
    function togglePaymentForm() {
    // If we're already showing the form, clean up first
    if (showPaymentForm) {
        if (stripeService.cardElement) {
        try {
            stripeService.cardElement.unmount();
            stripeService.cardElement = null;
        } catch (e) {
            console.log("Error unmounting card element:", e);
        }
        }
    }
    
    // Toggle the form visibility
    showPaymentForm = !showPaymentForm;
    
    // If we're now showing the form, set up the card element after a small delay
    if (showPaymentForm) {
        setTimeout(() => {
        setupCardElement();
        }, 100);
    }
    }

    function cancelCheckout() {
      goto('/cart');
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
      <div class="bg-pink-200 text-lg font-semibold py-2 px-4 rounded-full inline-block shadow-md mb-3">
        Checkout
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
      
      {#if isLoading}
        <div class="flex justify-center items-center py-10">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
        </div>
      {:else}
        <!-- Checkout steps -->
        <div class="grid grid-cols-3 gap-1 mb-6">
          <div class={`p-3 text-center rounded-l-lg ${stage === 'shipping' ? 'bg-pink-400 text-white' : 'bg-gray-200'}`}>
            <span class="font-bold">1.</span> Shipping
          </div>
          <div class={`p-3 text-center ${stage === 'payment' ? 'bg-pink-400 text-white' : 'bg-gray-200'}`}>
            <span class="font-bold">2.</span> Payment
          </div>
          <div class={`p-3 text-center rounded-r-lg ${stage === 'review' ? 'bg-pink-400 text-white' : 'bg-gray-200'}`}>
            <span class="font-bold">3.</span> Review Order
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <!-- Left column: Order details -->
          <div class="md:col-span-2">
            <!-- Shipping section -->
            <div class={stage !== 'shipping' ? 'hidden' : ''}>
              <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                <h2 class="text-lg font-bold mb-4">Delivery Address</h2>
                
                {#if !isAuthenticated}
                  <div class="bg-amber-100 p-3 rounded-lg mb-4">
                    <p>Already have an account? <a href="/account" class="text-pink-500 font-medium">Log in</a> to access your saved addresses.</p>
                  </div>
                {/if}
                
                {#if addresses.length > 0}
                  <div class="grid grid-cols-1 gap-3 mb-4">
                    {#each addresses as address}
                      <div 
                        class={`border rounded-lg p-3 cursor-pointer ${selectedAddress && selectedAddress._id === address._id ? 'border-pink-400 bg-pink-50' : 'border-gray-200'}`}
                        on:click={() => selectAddress(address)}
                        on:keydown={(e) => e.key === 'Enter' && selectAddress(address)}
                        role="button"
                        tabindex="0"
                      >
                        <div class="flex justify-between">
                          <span class="font-medium">{address.streetAddress}</span>
                          {#if address.isDefault}
                            <span class="text-xs bg-pink-200 text-pink-800 px-2 py-1 rounded-full">Default</span>
                          {/if}
                        </div>
                        {#if address.apartment}
                          <div>{address.apartment}</div>
                        {/if}
                        <div>{address.city}, {address.state} {address.postalCode}</div>
                        <div>{address.country}</div>
                        <div>Phone: {address.phoneNumber}</div>
                      </div>
                    {/each}
                  </div>
                {/if}
                
                <!-- Add new address button -->
                <button 
                  on:click={() => showAddressForm = !showAddressForm}
                  class="text-pink-500 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add new address
                </button>
                
                <!-- New address form -->
                {#if showAddressForm}
                  <div class="mt-4 border-t pt-4">
                    <h3 class="font-medium mb-2">New Address</h3>
                    
                    <form class="space-y-3" on:submit|preventDefault={handleAddressSubmit}>
                      <div>
                        <label for="streetAddress" class="block text-sm mb-1">Street Address *</label>
                        <input 
                          type="text" 
                          id="streetAddress" 
                          bind:value={addressForm.streetAddress} 
                          required
                          class="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-pink-400"
                        />
                      </div>
                      
                      <div>
                        <label for="apartment" class="block text-sm mb-1">Apartment, Suite, etc. (optional)</label>
                        <input 
                          type="text" 
                          id="apartment" 
                          bind:value={addressForm.apartment} 
                          class="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-pink-400"
                        />
                      </div>
                      
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label for="city" class="block text-sm mb-1">City *</label>
                          <input 
                            type="text" 
                            id="city" 
                            bind:value={addressForm.city} 
                            required
                            class="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-pink-400"
                          />
                        </div>
                        
                        <div>
                          <label for="state" class="block text-sm mb-1">State/Province *</label>
                          <input 
                            type="text" 
                            id="state" 
                            bind:value={addressForm.state} 
                            required
                            class="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-pink-400"
                          />
                        </div>
                      </div>
                      
                      <div class="grid grid-cols-2 gap-3">
                        <div>
                          <label for="postalCode" class="block text-sm mb-1">Postal Code *</label>
                          <input 
                            type="text" 
                            id="postalCode" 
                            bind:value={addressForm.postalCode} 
                            required
                            class="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-pink-400"
                          />
                        </div>
                        
                        <div>
                          <label for="country" class="block text-sm mb-1">Country *</label>
                          <select 
                            id="country" 
                            bind:value={addressForm.country} 
                            required
                            class="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-pink-400"
                          >
                            <option value="Singapore">Singapore</option>
                            <option value="Malaysia">Malaysia</option>
                            <option value="Indonesia">Indonesia</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label for="phoneNumber" class="block text-sm mb-1">Phone Number *</label>
                        <input 
                          type="tel" 
                          id="phoneNumber" 
                          bind:value={addressForm.phoneNumber} 
                          required
                          class="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-pink-400"
                        />
                      </div>
                      
                      {#if isAuthenticated}
                        <div class="flex items-center">
                          <input 
                            type="checkbox" 
                            id="isDefault" 
                            bind:checked={addressForm.isDefault}
                            class="h-4 w-4 text-pink-500 focus:ring-pink-400 border-gray-300 rounded"
                          />
                          <label for="isDefault" class="ml-2 text-sm">Set as default address</label>
                        </div>
                      {/if}
                      
                      <div class="flex justify-end space-x-2">
                        <button 
                          type="button" 
                          on:click={() => showAddressForm = false}
                          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          class="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500"
                        >
                          Save Address
                        </button>
                      </div>
                    </form>
                  </div>
                {/if}
                
                <!-- Delivery information -->
                <div class="mt-6">
                  <h2 class="text-lg font-bold mb-4">Delivery Information</h2>
                  
                  <div class="space-y-4">
                    <div>
                      <label for="deliveryDate" class="block text-sm mb-1">Delivery Date *</label>
                      <input 
                        type="date" 
                        id="deliveryDate" 
                        bind:value={deliveryDate} 
                        required
                        min={new Date().toISOString().split('T')[0]}
                        class="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-pink-400"
                      />
                    </div>
                    
                    <div>
                      <label for="deliveryTimeSlot" class="block text-sm mb-1">Delivery Time Slot *</label>
                      <select 
                        id="deliveryTimeSlot" 
                        bind:value={deliveryTimeSlot} 
                        required
                        class="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-pink-400"
                      >
                        <option value="morning">Morning (8:00 AM - 12:00 PM)</option>
                        <option value="afternoon">Afternoon (12:00 PM - 4:00 PM)</option>
                        <option value="evening">Evening (4:00 PM - 8:00 PM)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label for="specialInstructions" class="block text-sm mb-1">Special Instructions (optional)</label>
                      <textarea 
                        id="specialInstructions" 
                        bind:value={specialInstructions} 
                        rows="3"
                        class="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-pink-400"
                        placeholder="Add any special delivery instructions here..."
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Continue to payment button -->
              <div class="flex justify-between mt-4">
                <button 
                  on:click={cancelCheckout}
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Cart
                </button>
                
                <button 
                  on:click={() => goToStage('payment')}
                  class="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 flex items-center"
                  disabled={!selectedAddress && addresses.length > 0}
                >
                  Continue to Payment
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Payment section -->
            <div class={stage !== 'payment' ? 'hidden' : ''}>
              <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                <h2 class="text-lg font-bold mb-4">Payment Method</h2>
                
                {#if !isAuthenticated}
                  <div class="bg-amber-100 p-3 rounded-lg mb-4">
                    <p>Already have an account? <a href="/account" class="text-pink-500 font-medium">Log in</a> to access your saved payment methods.</p>
                  </div>
                {/if}
                
                {#if paymentMethods.length > 0}
                  <div class="grid grid-cols-1 gap-3 mb-4">
                    {#each paymentMethods as method}
                      <div 
                        class={`border rounded-lg p-3 cursor-pointer ${selectedPaymentMethod && selectedPaymentMethod._id === method._id ? 'border-pink-400 bg-pink-50' : 'border-gray-200'}`}
                        on:click={() => selectPaymentMethod(method)}
                        on:keydown={(e) => e.key === 'Enter' && selectPaymentMethod(method)}
                        role="button"
                        tabindex="0"
                      >
                        <div class="flex justify-between">
                          <div class="flex items-center">
                            {#if method.brand === 'visa'}
                              <span class="mr-2 font-bold text-blue-800">Visa</span>
                            {:else if method.brand === 'mastercard'}
                              <span class="mr-2 font-bold text-red-600">Mastercard</span>
                            {:else if method.brand === 'amex'}
                              <span class="mr-2 font-bold text-blue-500">American Express</span>
                            {:else}
                              <span class="mr-2 font-bold">{method.brand}</span>
                            {/if}
                            <span>•••• {method.last4}</span>
                          </div>
                          {#if method.isDefault}
                            <span class="text-xs bg-pink-200 text-pink-800 px-2 py-1 rounded-full">Default</span>
                          {/if}
                        </div>
                        <div class="text-sm text-gray-600">
                          Expires {method.expMonth}/{method.expYear}
                        </div>
                        {#if method.cardHolderName}
                          <div class="text-sm">{method.cardHolderName}</div>
                        {/if}
                      </div>
                    {/each}
                  </div>
                {/if}
                
                <!-- Add new payment method button -->
                <button on:click={togglePaymentForm} class="text-pink-500 flex items-center">
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add new card
                </button>
                
                <!-- New payment method form -->
                {#if showPaymentForm}
                  <div class="mt-4 border-t pt-4">
                    <h3 class="font-medium mb-2">New Payment Method</h3>
                    
                    <form class="space-y-3">
                      <div>
                        <label for="cardholderName" class="block text-sm mb-1">Cardholder Name *</label>
                        <input 
                          type="text" 
                          id="cardholderName" 
                          bind:value={paymentForm.cardholderName} 
                          required
                          class="w-full p-2 border rounded focus:outline-none focus:ring-1 focus:ring-pink-400"
                        />
                      </div>
                      
                      <div>
                        <label for="card-element" class="block text-sm mb-1">Card Information *</label>
                        <div 
                          id="card-element" 
                          class="p-2 border rounded min-h-[40px] bg-white focus:outline-none focus:ring-1 focus:ring-pink-400"
                        >
                          <!-- Stripe Card Element will be inserted here -->
                          {#if !stripeService.isInitialized}
                          <div class="text-gray-500 text-sm p-1">Loading payment form...</div>
                          {/if}
                        </div>
                        <div id="card-errors" class="text-red-500 text-sm mt-1"></div>
                      </div>
                      
                      {#if isAuthenticated}
                        <div class="flex items-center">
                          <input 
                            type="checkbox" 
                            id="saveCard" 
                            bind:checked={paymentForm.saveCard}
                            class="h-4 w-4 text-pink-500 focus:ring-pink-400 border-gray-300 rounded"
                          />
                          <label for="saveCard" class="ml-2 text-sm">Save card for future payments</label>
                        </div>
                      {/if}
                    </form>
                  </div>
                {/if}
              </div>
              
              <!-- Continue buttons -->
              <div class="flex justify-between mt-4">
                <button 
                  on:click={() => goToStage('shipping')}
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Shipping
                </button>
                
                <button 
                  on:click={() => goToStage('review')}
                  class="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 flex items-center"
                  disabled={!selectedPaymentMethod && !showPaymentForm}
                >
                  Continue to Review
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Review section -->
            <div class={stage !== 'review' ? 'hidden' : ''}>
              <div class="bg-white rounded-lg shadow-md p-4 mb-4">
                <h2 class="text-lg font-bold mb-4">Order Summary</h2>
                
                <!-- Order items -->
                <div class="border-b pb-4 mb-4">
                  <h3 class="font-medium mb-2">Items ({items.length})</h3>
                  
                  <div class="space-y-3">
                    {#each items as item}
                      <div class="flex items-center">
                        <div class="h-16 w-16 bg-gray-200 rounded flex items-center justify-center mr-3">
                          {#if item.productId.image}
                            <img src={item.productId.image} alt={item.productId.name} class="h-16 w-16 object-contain">
                          {:else}
                            <span class="text-xs text-gray-600 font-medium">{item.productId.name}</span>
                          {/if}
                        </div>
                        <div class="flex-1">
                          <div class="font-medium">{item.productId.name}</div>
                          <div class="text-sm text-gray-600">Quantity: {item.quantity}</div>
                        </div>
                        <div class="text-right">
                          {#if item.productId.isOnSale && item.productId.discountPrice}
                            <div class="line-through text-gray-500">${(item.productId.price * item.quantity).toFixed(2)}</div>
                            <div class="font-bold">${(item.productId.discountPrice * item.quantity).toFixed(2)}</div>
                          {:else}
                            <div class="font-bold">${(item.productId.price * item.quantity).toFixed(2)}</div>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>
                
                <!-- Shipping information -->
                <div class="border-b pb-4 mb-4">
                  <div class="flex justify-between mb-2">
                    <h3 class="font-medium">Shipping Address</h3>
                    <button 
                      on:click={() => goToStage('shipping')}
                      class="text-pink-500 text-sm"
                    >
                      Change
                    </button>
                  </div>
                  
                  {#if selectedAddress}
                    <div>
                      <div>{selectedAddress.streetAddress}</div>
                      {#if selectedAddress.apartment}
                        <div>{selectedAddress.apartment}</div>
                      {/if}
                      <div>{selectedAddress.city}, {selectedAddress.state} {selectedAddress.postalCode}</div>
                      <div>{selectedAddress.country}</div>
                      <div>Phone: {selectedAddress.phoneNumber}</div>
                    </div>
                  {/if}
                  
                  <div class="mt-4">
                    <div><span class="font-medium">Delivery Date:</span> {new Date(deliveryDate).toLocaleDateString()}</div>
                    <div>
                      <span class="font-medium">Time Slot:</span> 
                      {#if deliveryTimeSlot === 'morning'}
                        Morning (8:00 AM - 12:00 PM)
                      {:else if deliveryTimeSlot === 'afternoon'}
                        Afternoon (12:00 PM - 4:00 PM)
                      {:else}
                        Evening (4:00 PM - 8:00 PM)
                      {/if}
                    </div>
                    {#if specialInstructions}
                      <div class="mt-2">
                        <span class="font-medium">Special Instructions:</span><br>
                        {specialInstructions}
                      </div>
                    {/if}
                  </div>
                </div>
                
                <!-- Payment information -->
                <div class="border-b pb-4 mb-4">
                  <div class="flex justify-between mb-2">
                    <h3 class="font-medium">Payment Method</h3>
                    <button 
                      on:click={() => goToStage('payment')}
                      class="text-pink-500 text-sm"
                    >
                      Change
                    </button>
                  </div>
                  
                  {#if selectedPaymentMethod}
                    <div class="flex items-center">
                      {#if selectedPaymentMethod.brand === 'visa'}
                        <span class="mr-2 font-bold text-blue-800">Visa</span>
                      {:else if selectedPaymentMethod.brand === 'mastercard'}
                        <span class="mr-2 font-bold text-red-600">Mastercard</span>
                      {:else if selectedPaymentMethod.brand === 'amex'}
                        <span class="mr-2 font-bold text-blue-500">American Express</span>
                      {:else}
                        <span class="mr-2 font-bold">{selectedPaymentMethod.brand}</span>
                      {/if}
                      <span>•••• {selectedPaymentMethod.last4}</span>
                    </div>
                  {:else if showPaymentForm}
                    <div>New credit/debit card</div>
                  {/if}
                </div>
              </div>
              
              <!-- Place order button -->
              <div class="flex justify-between mt-4">
                <button 
                  on:click={() => goToStage('payment')}
                  class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Payment
                </button>
                
                <button 
                  on:click={placeOrder}
                  class="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 flex items-center"
                  disabled={isProcessingPayment}
                >
                  {#if isProcessingPayment}
                    <div class="flex items-center">
                      <div class="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Place Order
                  {/if}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Right column: Order summary -->
          <div class="md:col-span-1">
            <div class="bg-white rounded-lg shadow-md p-4 sticky top-4">
              <h2 class="text-lg font-bold mb-4">Order Summary</h2>
              
              <div class="space-y-2 mb-4">
                <div class="flex justify-between">
                  <span>Subtotal ({items.length} items)</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                  <span>Tax (5%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div class="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
              </div>
              
              <div class="border-t pt-2">
                <div class="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
              
              <!-- Order items preview -->
              <div class="mt-4 pt-4 border-t">
                <div class="flex justify-between mb-2">
                  <h3 class="font-medium">Items in cart</h3>
                  <a href="/cart" class="text-pink-500 text-sm">Edit</a>
                </div>
                
                <div class="max-h-64 overflow-y-auto space-y-3">
                  {#each items as item}
                    <div class="flex items-center">
                      <div class="h-12 w-12 bg-gray-200 rounded flex items-center justify-center mr-2">
                        {#if item.productId.image}
                          <img src={item.productId.image} alt={item.productId.name} class="h-12 w-12 object-contain">
                        {:else}
                          <span class="text-xs text-gray-600 font-medium">{item.productId.name}</span>
                        {/if}
                      </div>
                      <div class="flex-1">
                        <div class="text-sm font-medium truncate">{item.productId.name}</div>
                        <div class="text-xs text-gray-500">Qty: {item.quantity}</div>
                      </div>
                      <div class="text-sm font-medium">
                        ${(item.productId.isOnSale && item.productId.discountPrice 
                          ? item.productId.discountPrice * item.quantity 
                          : item.productId.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </div>
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
            <h3 class="font-bold mb-2">Security</h3>
            <p class="text-sm">All transactions are secure and encrypted</p>
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
  
  <style>
    /* Make sure the order summary stays visible when scrolling */
    .sticky {
      position: sticky;
      top: 1rem;
    }
  </style>