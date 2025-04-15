<script>
  import { onMount, onDestroy } from 'svelte';
  import { goto } from '$app/navigation';
  import { cartStore, cartTotal } from '$lib/stores/cart';
  import { authStore } from '$lib/stores/auth';
  import { orderAPI, paymentAPI } from '$lib/api';
  import stripeService from '$lib/services/stripeService';
  import SearchBar from '$lib/components/SearchBar.svelte';
  
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
    cleanup();
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
      console.log('Initializing Stripe...');
      
      // Initialize the Stripe service with publishable key from environment
      await stripeService.initialize(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
      console.log('Stripe initialized successfully');
      
      // Create card element if we're at the payment stage and showing payment form
      if (stage === 'payment' && showPaymentForm) {
        setupCardElement();
      }
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      errorMessage = 'Failed to initialize payment system. Please try again later.';
    }
  }
  
  // In setupCardElement function
  function setupCardElement() {
    try {
      console.log("Setting up card element...");
      
      // Make sure div exists before trying to mount
      const cardElement = document.getElementById('card-element');
      if (!cardElement) {
        console.error("Card element container not found in DOM");
        return;
      }
      
      // Make sure Stripe is initialized
      if (!stripeService.isInitialized) {
        console.error("Stripe not initialized");
        errorMessage = "Payment system not ready yet";
        return;
      }

      // Force destroy existing elements to ensure a clean start
      stripeService.destroyElements();
      
      // Create a new card element
      console.log('Creating new card element');
      const element = stripeService.createCardElement('card-element', {
        style: {
          base: {
            color: '#32325d',
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: 'antialiased',
            fontSize: '16px',
            '::placeholder': {
              color: '#aab7c4'
            }
          },
          invalid: {
            color: '#fa755a',
            iconColor: '#fa755a'
          }
        }
      });
      
      // Listen for card element errors
      element.on('change', (event) => {
        cardElementError = event.error ? event.error.message : '';
      });
      
      console.log("Card element setup complete");
    } catch (error) {
      console.error('Error setting up card element:', error);
      errorMessage = 'Failed to set up payment form: ' + error.message;
    }
  }

  function cleanup() {
    console.log('Cleaning up checkout page resources');
    if (stripeService.cardElement) {
      stripeService.cleanup();
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
    // Close the payment form when selecting an existing method
    showPaymentForm = false;
  }
  
  // FIXED: Update goToStage function to properly handle stage transitions
  function goToStage(newStage) {
    console.log(`Changing stage from ${stage} to ${newStage}`);
    
    // If moving away from payment stage, clean up card element
    if (stage === 'payment' && newStage !== 'payment') {
      console.log('Cleaning up card element before leaving payment stage');
      if (stripeService.cardElement) {
        try {
          stripeService.cleanup();
        } catch (e) {
          console.log("Error cleaning up card element:", e);
        }
      }
    }
    
    // Validate before moving to review
    if (newStage === 'review') {
      if (!selectedAddress) {
        errorMessage = 'Please select a shipping address';
        return;
      }
      
      // Allow proceeding if either an existing payment method is selected
      // OR if showing payment form with valid inputs
      if (!selectedPaymentMethod && !showPaymentForm) {
        errorMessage = 'Please select a payment method';
        return;
      }
      
      // Only validate card element and payment form if we're showing the form
      if (showPaymentForm) {
        // Check for card element errors if using a new card
        if (cardElementError) {
          errorMessage = 'Please fix the issues with your card information: ' + cardElementError;
          return;
        }
        
        // Validate payment form if using a new card
        if (!paymentForm.cardholderName) {
          errorMessage = 'Please enter the cardholder name';
          return;
        }
      }
    }
    
    // Clear any error messages
    errorMessage = '';
    
    // Update the stage
    stage = newStage;
    
    // If going to payment stage, initialize Stripe elements
    if (newStage === 'payment') {
      // Only set up card element if showing payment form
      if (showPaymentForm) {
        // Use setTimeout to ensure the DOM is ready
        setTimeout(() => {
          setupCardElement();
        }, 100);
      }
    }
  }
  
  // FIXED: Helper function to create a payment method
  async function createPaymentMethod() {
    if (!paymentForm.cardholderName) {
      return { success: false, error: 'Please enter the cardholder name' };
    }
    
    if (!stripeService.cardElement) {
      return { success: false, error: 'Card element not initialized' };
    }
    
    try {
      // Create payment method
      console.log('Creating payment method from card element');
      const { error, paymentMethod } = await stripeService.createPaymentMethod({
        billing_details: {
          name: paymentForm.cardholderName || `${user?.firstName || ''} ${user?.lastName || 'Guest'}`
        }
      });
      
      if (error) {
        console.error('Error creating payment method:', error);
        return { success: false, error: error.message || 'Failed to create payment method' };
      }
      
      console.log('Payment method created successfully:', paymentMethod.id);
      
      // Save this payment method if the user wants to
      if (paymentForm.saveCard && isAuthenticated) {
        try {
          console.log('Saving payment method to user account');
          const response = await paymentAPI.savePaymentMethod({
            paymentMethodId: paymentMethod.id,
            billingDetails: {
              name: paymentForm.cardholderName
            },
            isDefault: false
          });
          
          console.log('Payment method saved successfully:', response);
          
          // Add the new payment method to local state for immediate use
          const newPaymentMethod = response.data;
          paymentMethods = [...paymentMethods, newPaymentMethod];
          selectedPaymentMethod = newPaymentMethod;
        } catch (saveError) {
          console.error('Error saving payment method:', saveError);
          // Continue anyway - we can still use the payment method for this order
        }
      } else if (!isAuthenticated) {
        // For guest users, just store the payment method ID temporarily
        // We'll create a temporary payment method object
        selectedPaymentMethod = {
          _id: paymentMethod.id,
          stripePaymentMethodId: paymentMethod.id,
          last4: paymentMethod.card.last4,
          brand: paymentMethod.card.brand,
          expMonth: paymentMethod.card.exp_month.toString(),
          expYear: paymentMethod.card.exp_year.toString(),
          cardHolderName: paymentForm.cardholderName
        };
      }
      
      return { 
        success: true, 
        paymentMethodId: isAuthenticated ? selectedPaymentMethod._id : paymentMethod.id 
      };
    } catch (error) {
      console.error('Error in payment method creation:', error);
      return { 
        success: false, 
        error: error.message || 'An error occurred while processing your card'
      };
    }
  }
  
  // FIXED: Update createPaymentMethodAndContinue to use the helper function
  async function createPaymentMethodAndContinue() {
    try {
      // Show loading state
      const saveButtonElement = document.getElementById('create-payment-method-button');
      if (saveButtonElement) {
        saveButtonElement.disabled = true;
        saveButtonElement.textContent = 'Processing...';
      }
      
      const result = await createPaymentMethod();
      
      // Reset button if we're still on this screen
      if (saveButtonElement) {
        saveButtonElement.disabled = false;
        saveButtonElement.textContent = 'Save Card & Continue to Review';
      }
      
      if (!result.success) {
        errorMessage = result.error;
        return;
      }
      
      // Hide the form since we now have a payment method
      showPaymentForm = false;
      
      // Now we can proceed to review
      goToStage('review');
    } catch (error) {
      console.error('Error in payment method creation:', error);
      errorMessage = error.message || 'An error occurred while processing your card';
      
      // Reset button
      const saveButtonElement = document.getElementById('create-payment-method-button');
      if (saveButtonElement) {
        saveButtonElement.disabled = false;
        saveButtonElement.textContent = 'Save Card & Continue to Review';
      }
    }
  }
  
  // FIXED: Updated placeOrder function to properly handle both payment methods
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
      
      console.log('Starting order creation...');
      
      // Determine payment method ID based on selection
      let paymentMethodId = null;
      
      if (selectedPaymentMethod) {
        // Using existing payment method
        paymentMethodId = selectedPaymentMethod._id;
        console.log('Using existing payment method:', paymentMethodId);
      } else if (showPaymentForm) {
        // If we're in the review stage and intended to use a new payment method,
        // we need to create it first
        try {
          console.log('Creating payment method for checkout');
          const result = await createPaymentMethod();
          if (!result.success) {
            throw new Error(result.error || 'Failed to create payment method');
          }
          paymentMethodId = result.paymentMethodId;
        } catch (error) {
          console.error('Error creating payment method:', error);
          errorMessage = error.message || 'Failed to create payment method';
          isProcessingPayment = false;
          goToStage('payment');
          return;
        }
      } else {
        // No payment method selected
        errorMessage = 'Please select a payment method or add a new card';
        isProcessingPayment = false;
        goToStage('payment');
        return;
      }
      
      // Prepare order data with payment method
      const orderData = {
        orderItems: items.map(item => ({
          productId: item.productId._id,
          quantity: item.quantity
        })),
        addressId: selectedAddress._id,
        paymentMethodId: paymentMethodId, // Include payment method ID
        tax,
        deliveryDate,
        deliveryTimeSlot,
        specialInstructions
      };
      
      console.log('Creating order with data:', orderData);
      
      // Create order
      const createOrderResponse = await orderAPI.createOrder(orderData);
      
      if (!createOrderResponse.success) {
        throw new Error(createOrderResponse.message || 'Failed to create order');
      }
      
      const order = createOrderResponse.data;
      console.log('Order created successfully:', order);
      
      // Process payment for the order
      if (paymentMethodId) {
        console.log('Processing payment with method ID:', paymentMethodId);
        
        // Create payment intent with the payment method ID
        const paymentIntentData = {
          orderId: order._id,
          paymentMethodId: paymentMethodId
        };
        
        console.log('Creating payment intent:', paymentIntentData);
        const paymentIntentResponse = await paymentAPI.createPaymentIntent(paymentIntentData);
        
        if (!paymentIntentResponse.success) {
          throw new Error(paymentIntentResponse.message || 'Failed to create payment intent');
        }
        
        console.log('Payment intent created:', paymentIntentResponse);
        
        // Check if payment needs confirmation
        if (paymentIntentResponse.status === 'requires_confirmation') {
          console.log('Payment requires confirmation');
          
          let confirmationResult;
          
          if (selectedPaymentMethod && selectedPaymentMethod.stripePaymentMethodId) {
            // Confirm using the saved payment method's stripe ID
            console.log('Confirming with existing method:', selectedPaymentMethod.stripePaymentMethodId);
            confirmationResult = await stripeService.confirmPaymentWithExistingMethod(
              paymentIntentResponse.clientSecret,
              selectedPaymentMethod.stripePaymentMethodId
            );
          } else {
            // Confirm directly with the client secret (for newly created payment methods)
            console.log('Confirming payment with client secret');
            confirmationResult = await stripeService.confirmPayment(
              paymentIntentResponse.clientSecret
            );
          }
          
          if (confirmationResult.error) {
            console.error('Payment confirmation error:', confirmationResult.error);
            throw new Error(confirmationResult.error.message || 'Payment failed');
          }
          
          console.log('Payment confirmed:', confirmationResult.paymentIntent);
        }
      }
      
      // Clean up Stripe resources
      stripeService.cleanup();
      
      // Clear cart after successful order
      await cartStore.clearCart();

      // Refresh user data to get updated addresses and payment methods
      if (isAuthenticated) {
        await authStore.refreshUserData();
      }
      
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
    console.log(`Toggling payment form. Current state: ${showPaymentForm}`);
    
    // Clean up first
    try {
      stripeService.cleanup();
    } catch (e) {
      console.log("Error cleaning up card element:", e);
    }
    
    // Toggle the form visibility
    showPaymentForm = !showPaymentForm;
    
    // Reset selected payment method if showing form
    if (showPaymentForm) {
      selectedPaymentMethod = null;
      
      // Force destroy elements to ensure we start fresh
      stripeService.destroyElements();
      
      // Use setTimeout to ensure the DOM is ready
      setTimeout(() => {
        console.log('Setting up card element after toggle');
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
                Return to Cart
              </button>
              
              <button 
                on:click={() => goToStage('payment')}
                class="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 flex items-center"
                disabled={!selectedAddress && addresses.length > 0}
              >
                Proceed to Payment
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
                <div class="flex justify-end mt-4">
                  <button 
                    on:click={() => { showPaymentForm = false; selectedPaymentMethod = null; }}
                    class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 mr-2"
                  >
                    Cancel New Card
                  </button>
                  <button 
                    id="create-payment-method-button"
                    on:click={createPaymentMethodAndContinue}
                    class="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition-colors"
                  >
                    Save Card & Continue to Review
                  </button>
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
              
              {#if selectedPaymentMethod && !showPaymentForm}
                <button 
                  on:click={() => goToStage('review')}
                  class="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 flex items-center"
                >
                  Continue with Selected Card
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              {:else if !showPaymentForm}
                <button 
                  on:click={togglePaymentForm}
                  class="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 flex items-center"
                >
                  Add Payment Method
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              {/if}
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
                  Complete Purchase
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
            <img 
            src="/images/logo/logo.png" 
            alt="Hot Fridge Logo" 
            class="h-12 w-12 rounded-md"
            />
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