// src/lib/stores/auth.js
import { writable } from 'svelte/store';
import { authAPI } from '$lib/api';
import { browser } from '$app/environment';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isGuest: true,
  guestId: null,
  isLoading: true,
  error: null,
  message: null
};

function createAuthStore() {
  const { subscribe, set, update } = writable(initialState);

  return {
    subscribe,
    
    // Initialize auth state
    init: async () => {
      if (!browser) return;

      try {
        update(state => ({ ...state, isLoading: true, error: null }));
        
        // Check for token in localStorage
        const token = localStorage.getItem('token');
        if (!token) {
          // Create or use existing guest ID
          let guestId = localStorage.getItem('guestId');
          if (!guestId) {
            guestId = generateGuestId();
            localStorage.setItem('guestId', guestId);
          }
          
          set({
            ...initialState,
            isLoading: false,
            guestId,
            isGuest: true
          });
          return;
        }
        
        // Get current user
        const { data } = await authAPI.getCurrentUser();
        
        set({
          user: data,
          isAuthenticated: true,
          isGuest: false,
          guestId: null,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Auth store initialization error:', error);
        
        // Clear bad token if authentication fails
        localStorage.removeItem('token');
        
        // Create or get guest ID
        let guestId = localStorage.getItem('guestId');
        if (!guestId) {
          guestId = generateGuestId();
          localStorage.setItem('guestId', guestId);
        }
        
        set({
          ...initialState,
          isLoading: false,
          error: error.message,
          guestId,
          isGuest: true
        });
      }
    },
    
    // Login user
    login: async (credentials) => {
      try {
        update(state => ({ ...state, isLoading: true, error: null }));
        
        const response = await authAPI.login(credentials);
        
        if (response.token) {
          localStorage.setItem('token', response.token);
          
          // Get user data
          const { data } = await authAPI.getCurrentUser();
          
          // Transfer guest cart if exists
          const guestId = localStorage.getItem('guestId');
          if (guestId) {
            try {
              await authAPI.transferGuestCart(guestId);
              localStorage.removeItem('guestId');
            } catch (err) {
              console.error('Error transferring guest cart:', err);
            }
          }
          
          set({
            user: data,
            isAuthenticated: true,
            isGuest: false,
            guestId: null,
            isLoading: false,
            error: null
          });
          
          return true;
        }
      } catch (error) {
        update(state => ({
          ...state,
          isLoading: false,
          error: error.message || 'Login failed. Please try again.'
        }));
        return false;
      }
    },
    
    // Register user
    register: async (userData) => {
      try {
        update(state => ({ ...state, isLoading: true, error: null }));
        
        const response = await authAPI.register(userData);
        
        // Handle email verification cases
        if (response.message && response.message.includes('Verification email sent')) {
          update(state => ({
            ...state,
            isLoading: false,
            message: 'Verification email sent. Please check your inbox and verify your account before logging in.'
          }));
          return true;
        }
        
        // If automatic login after registration
        if (response.token) {
          localStorage.setItem('token', response.token);
          
          // Get user data
          const { data } = await authAPI.getCurrentUser();
          
          // Transfer guest cart if exists
          const guestId = localStorage.getItem('guestId');
          if (guestId) {
            try {
              await authAPI.transferGuestCart(guestId);
              localStorage.removeItem('guestId');
            } catch (err) {
              console.error('Error transferring guest cart:', err);
            }
          }
          
          set({
            user: data,
            isAuthenticated: true,
            isGuest: false,
            guestId: null,
            isLoading: false,
            error: null
          });
        } else {
          update(state => ({
            ...state,
            isLoading: false,
            message: 'Registration successful! You may now log in.'
          }));
        }
        
        return true;
      } catch (error) {
        update(state => ({
          ...state,
          isLoading: false,
          error: error.message || 'Registration failed. Please try again.'
        }));
        return false;
      }
    },
    
    // Logout user
    logout: async () => {
      try {
        await authAPI.logout();
      } catch (error) {
        console.error('Logout error:', error);
      }
      
      // Clear token and create new guest session
      localStorage.removeItem('token');
      const guestId = generateGuestId();
      localStorage.setItem('guestId', guestId);
      
      set({
        ...initialState,
        isLoading: false,
        guestId,
        isGuest: true
      });
    },
    
    // Update user details
    updateProfile: async (userData) => {
      try {
        update(state => ({ ...state, isLoading: true, error: null }));
        
        const { data } = await authAPI.updateUserDetails(userData);
        
        update(state => ({
          ...state,
          user: data,
          isLoading: false
        }));
        
        return true;
      } catch (error) {
        update(state => ({
          ...state,
          isLoading: false,
          error: error.message || 'Failed to update profile'
        }));
        return false;
      }
    },
    
    // Update password
    updatePassword: async (passwordData) => {
      try {
        update(state => ({ ...state, isLoading: true, error: null }));
        
        await authAPI.updatePassword(passwordData);
        
        update(state => ({
          ...state,
          isLoading: false,
          message: 'Password updated successfully'
        }));
        
        return true;
      } catch (error) {
        update(state => ({
          ...state,
          isLoading: false,
          error: error.message || 'Failed to update password'
        }));
        return false;
      }
    },
    
    // Forgot password
    forgotPassword: async (email) => {
      try {
        update(state => ({ ...state, isLoading: true, error: null }));
        
        await authAPI.forgotPassword(email);
        
        update(state => ({
          ...state,
          isLoading: false,
          message: 'Password reset instructions sent to your email'
        }));
        
        return true;
      } catch (error) {
        update(state => ({
          ...state,
          isLoading: false,
          error: error.message || 'Failed to process password reset'
        }));
        return false;
      }
    },
    
    // Reset password
    resetPassword: async (token, password) => {
      try {
        update(state => ({ ...state, isLoading: true, error: null }));
        
        await authAPI.resetPassword(token, password);
        
        update(state => ({
          ...state,
          isLoading: false,
          message: 'Password has been reset successfully'
        }));
        
        return true;
      } catch (error) {
        update(state => ({
          ...state,
          isLoading: false,
          error: error.message || 'Failed to reset password'
        }));
        return false;
      }
    },
    
    // Refresh user data
    refreshUserData: async () => {
      try {
        update(state => ({ ...state, isLoading: true, error: null }));
        
        const { data } = await authAPI.getCurrentUser();
        
        update(state => ({
          ...state,
          user: data,
          isLoading: false
        }));
        
        return true;
      } catch (error) {
        update(state => ({
          ...state,
          isLoading: false,
          error: error.message || 'Failed to refresh user data'
        }));
        return false;
      }
    },
    
    // Clear error
    clearError: () => {
      update(state => ({ ...state, error: null }));
    },
    
    // Clear message
    clearMessage: () => {
      update(state => ({ ...state, message: null }));
    }
  };
}

// Helper function to generate random guest ID
function generateGuestId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Create store instance
export const authStore = createAuthStore();