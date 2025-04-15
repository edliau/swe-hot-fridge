// frontend/src/lib/services/stripeService.js - Fixed version

import { browser } from '$app/environment';

/**
 * Utility class for interacting with Stripe
 */
class StripeService {
  constructor() {
    this.stripe = null;
    this.elements = null;
    this.cardElement = null;
    this.isInitialized = false;
    this.hasCreatedElement = false; // Track if we've already created an element
  }

  /**
   * Load Stripe.js script and initialize Stripe
   * @param {string} publishableKey - Stripe publishable key
   * @returns {Promise<void>}
   */
  async initialize(publishableKey) {
    if (!browser) return;
    
    if (this.isInitialized) return;
    
    return new Promise((resolve, reject) => {
      try {
        // Check if Stripe is already loaded
        if (window.Stripe) {
          this.stripe = window.Stripe(publishableKey);
          this.isInitialized = true;
          resolve();
          return;
        }
        
        // Load Stripe.js script
        const script = document.createElement('script');
        script.src = 'https://js.stripe.com/v3/';
        script.async = true;
        
        script.onload = () => {
          this.stripe = window.Stripe(publishableKey);
          this.isInitialized = true;
          resolve();
        };
        
        script.onerror = (error) => {
          reject(new Error('Failed to load Stripe.js'));
        };
        
        document.body.appendChild(script);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create a card element
   * @param {string} elementId - DOM element ID where to mount the card
   * @param {Object} options - Card element options
   * @returns {Object} - Stripe card element
   */
  createCardElement(elementId, options = {}) {
    if (!this.isInitialized || !this.stripe) {
      throw new Error('Stripe not initialized');
    }
    
    // Clean up any existing card element first
    this.cleanup();
    
    // Initialize elements if not already done
    if (!this.elements) {
      this.elements = this.stripe.elements();
    }
    
    // Default styles for the card element
    const defaultOptions = {
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
    };
    
    // Merge default options with provided options
    const cardOptions = { ...defaultOptions, ...options };
    
    try {
      // Create the card element
      console.log('Creating new card element');
      this.cardElement = this.elements.create('card', cardOptions);
      this.hasCreatedElement = true;
      
      // Mount the card element to the DOM
      const domElement = document.getElementById(elementId);
      if (domElement) {
        this.cardElement.mount(`#${elementId}`);
        console.log('Card element mounted successfully');
      } else {
        console.error(`Element with ID "${elementId}" not found`);
      }
      
      return this.cardElement;
    } catch (error) {
      console.error('Error creating card element:', error);
      // If we get the "can only create one Element" error, we need to destroy and recreate elements
      if (error.message && error.message.includes('Can only create one Element')) {
        console.log('Attempting to recover from "Can only create one Element" error');
        this.destroyElements();
        // Now try again with fresh elements
        this.elements = this.stripe.elements();
        this.cardElement = this.elements.create('card', cardOptions);
        this.hasCreatedElement = true;
        
        const domElement = document.getElementById(elementId);
        if (domElement) {
          this.cardElement.mount(`#${elementId}`);
          console.log('Card element mounted successfully after recovery');
        }
        return this.cardElement;
      }
      throw error;
    }
  }

  /**
   * Completely destroy and reset elements
   */
  destroyElements() {
    this.cleanup();
    // Force elements to be recreated
    this.elements = null;
    this.hasCreatedElement = false;
  }

  /**
   * Confirm a card payment
   * @param {string} clientSecret - The client secret from the PaymentIntent
   * @param {Object} paymentData - Additional payment data
   * @returns {Promise<Object>} - Result of the payment confirmation
   */
  async confirmCardPayment(clientSecret, paymentData = {}) {
    if (!this.isInitialized || !this.stripe) {
      throw new Error('Stripe not initialized');
    }
    
    if (!this.cardElement && !paymentData.payment_method) {
      throw new Error('Card element or payment method ID not provided');
    }
    
    // Default payment data
    const defaultData = {};
    
    // Only add card if not already provided in paymentData
    if (!paymentData.payment_method && this.cardElement) {
      defaultData.payment_method = {
        card: this.cardElement,
        billing_details: {}
      };
    }
    
    // Merge default data with provided data
    const data = { ...defaultData, ...paymentData };
    
    console.log('Confirming card payment with:', {
      clientSecret: clientSecret ? '...present...' : 'missing',
      paymentMethod: data.payment_method ? 'present' : 'missing',
      setupFutureUsage: data.setup_future_usage || 'not specified'
    });
    
    // Confirm the payment
    return await this.stripe.confirmCardPayment(clientSecret, data);
  }

  /**
   * Confirm payment with an existing payment method
   * @param {string} clientSecret - The client secret from the PaymentIntent
   * @param {string} paymentMethodId - ID of the payment method to use
   * @returns {Promise<Object>} - Result of the payment confirmation
   */
  async confirmPaymentWithExistingMethod(clientSecret, paymentMethodId) {
    if (!this.isInitialized || !this.stripe) {
      throw new Error('Stripe not initialized');
    }
    
    if (!paymentMethodId) {
      throw new Error('Payment method ID is required');
    }
    
    console.log(`Confirming payment with existing method: ${paymentMethodId}`);
    return await this.stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethodId
    });
  }

  /**
   * Get card element errors in real-time
   * @param {Function} callback - Callback function to handle errors
   */
  listenForCardElementErrors(callback) {
    if (!this.cardElement) {
      console.warn('Card element not initialized, cannot listen for errors');
      return;
    }
    
    this.cardElement.on('change', (event) => {
      callback(event.error ? event.error.message : '');
    });
  }

  /**
   * Clean up resources
   */
  cleanup() {
    console.log('Cleaning up Stripe resources');
    if (this.cardElement) {
      try {
        this.cardElement.unmount();
        console.log('Card element unmounted successfully');
      } catch (e) {
        console.log('Error unmounting card element:', e);
      }
      this.cardElement = null;
      // Don't set hasCreatedElement to false here, as we need to remember 
      // that we've created an element for error recovery purposes
    }
  }
  
  /**
   * Create a payment method directly
   * @param {Object} cardData - Card details and billing information
   * @returns {Promise<Object>} - The created payment method
   */
  async createPaymentMethod(cardData) {
    if (!this.isInitialized || !this.stripe) {
      throw new Error('Stripe not initialized');
    }
    
    if (!this.cardElement && !cardData.card) {
      throw new Error('Card element or card data is required');
    }
    
    const paymentMethodData = {
      type: 'card',
      card: this.cardElement || cardData.card
    };
    
    if (cardData.billing_details) {
      paymentMethodData.billing_details = cardData.billing_details;
    }
    
    console.log('Creating payment method with:', {
      type: paymentMethodData.type,
      hasCard: !!paymentMethodData.card,
      hasBillingDetails: !!paymentMethodData.billing_details
    });
    
    return await this.stripe.createPaymentMethod(paymentMethodData);
  }
}

// Export a singleton instance
export default new StripeService();