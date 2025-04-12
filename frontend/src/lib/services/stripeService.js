// Stripe Payment Service for handling Stripe interactions
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
    if (this.cardElement) {
      try {
        this.cardElement.unmount();
      } catch (e) {
        console.log("Unmounting previous card element failed:", e);
      }
      this.cardElement = null;
    }
    
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
    
    // Create the card element
    this.cardElement = this.elements.create('card', cardOptions);
    
    // Mount the card element to the DOM
    const domElement = document.getElementById(elementId);
    if (domElement) {
      this.cardElement.mount(`#${elementId}`);
    } else {
      console.error(`Element with ID "${elementId}" not found`);
    }
    
    return this.cardElement;
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
    
    if (!this.cardElement) {
      throw new Error('Card element not initialized');
    }
    
    // Default payment data
    const defaultData = {
      payment_method: {
        card: this.cardElement,
        billing_details: {}
      }
    };
    
    // Merge default data with provided data
    const data = { ...defaultData, ...paymentData };
    
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
      throw new Error('Card element not initialized');
    }
    
    this.cardElement.on('change', (event) => {
      callback(event.error ? event.error.message : '');
    });
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.cardElement) {
      this.cardElement.unmount();
      this.cardElement = null;
    }
  }
}

// Export a singleton instance
export default new StripeService();