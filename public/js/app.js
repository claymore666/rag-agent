// public/js/app.js - Main application entry point
import { initDOMElements } from './modules/dom-elements.js';
import { initState } from './modules/state.js';
import { fetchConversations, createNewConversation, openConversation } from './modules/conversation.js';
import { setupEventListeners } from './modules/ui.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Initialize DOM references
  initDOMElements();
  
  // Initialize application state
  initState();
  
  // Setup event listeners
  setupEventListeners();
  
  // Fetch existing conversations on load
  fetchConversations();
});
