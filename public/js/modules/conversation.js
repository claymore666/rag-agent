// public/js/modules/conversation.js - Conversation management functions
import { elements } from './dom-elements.js';
import { state, addConversation, removeConversation, addOpenTab, removeOpenTab, setActiveConversation } from './state.js';
import { getConversations, createConversation, deleteConversation as apiDeleteConversation } from './api.js';
import { activateTab, closeTab, renderConversationItem } from './ui.js';
import { fetchMessages } from './message.js';

// Fetch existing conversations 
export async function fetchConversations() {
  try {
    const data = await getConversations();
    
    if (data.length === 0) {
      return;
    }
    
    // Clear placeholder
    elements.conversationList.innerHTML = '';
    
    // Populate conversation list
    data.forEach(conversation => {
      addConversation(conversation);
      renderConversationItem(conversation);
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
  }
}

// Create a new conversation
export async function createNewConversation() {
  try {
    console.log('Creating new conversation...');
    const conversation = await createConversation('New Conversation');
    console.log('Conversation created:', conversation);
    addConversation(conversation);
    
    // Clear the "no conversations" placeholder if it exists
    if (elements.conversationList.querySelector('.text-center')) {
      elements.conversationList.innerHTML = '';
    }
    
    renderConversationItem(conversation);
    openConversation(conversation.id);
  } catch (error) {
    console.error('Error creating conversation:', error);
    alert('Failed to create a new conversation. Please try again.');
  }
}

// Open a conversation
export function openConversation(conversationId) {
  console.log('DEBUG: openConversation called');
  console.log('Conversation ID:', conversationId);
  console.log('State:', state);
  // Ensure conversationId is treated as a string
  const conversationIdString = conversationId.toString();
  
  console.log('Opening conversation (stringified):', conversationIdString);
  console.log('Current state:', {
    conversations: state.conversations,
    openTabs: state.openTabs,
    activeConversationId: state.activeConversationId
  });

  // If conversation is already open, just activate that tab
  if (state.openTabs.has(conversationId)) {
    activateTab(conversationId);
    return;
  }
  
  const conversation = state.conversations[conversationIdString];
  if (!conversation) {
    console.error('Conversation not found:', conversationId);
    return;
  }
  
  // Clear the welcome screen if it exists
  if (elements.chatWindows.querySelector('.text-center')) {
    elements.chatWindows.innerHTML = '';
  }
  
  // Create new tab
  const tabClone = elements.templates.tabTemplate.content.cloneNode(true);
  const tab = tabClone.querySelector('.chat-tab');
  
  tab.dataset.id = conversationId;
  tab.querySelector('.tab-title').textContent = conversation.title.length > 15 
    ? conversation.title.substring(0, 15) + '...' 
    : conversation.title;
  
  tab.querySelector('.close-tab').addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(conversationId);
  });
  
  tab.addEventListener('click', () => {
    activateTab(conversationId);
  });
  
  elements.tabsContainer.appendChild(tab);
  
  // Create chat window
  const windowClone = elements.templates.chatWindowTemplate.content.cloneNode(true);
  const chatWindow = windowClone.querySelector('.chat-window');
  
  chatWindow.dataset.id = conversationId;
  
  // Make sure chat window is visible and properly displayed as flex
  chatWindow.style.display = 'flex';
  
  // Add submit handler to the form
  const messageForm = chatWindow.querySelector('.message-form');
  if (messageForm) {
    messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = chatWindow.querySelector('.message-input');
      const message = input.value.trim();
      
      if (message) {
        import('./message.js').then(module => {
          module.sendMessage(conversationId, message);
        });
        input.value = '';
        // Reset textarea height
        input.style.height = 'auto';
      }
    });
    
    // Auto-resize textarea
    const textarea = chatWindow.querySelector('.message-input');
    if (textarea) {
      textarea.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
      });
      
      // Focus the textarea
      setTimeout(() => textarea.focus(), 100);
    } else {
      console.error('Textarea element not found in the chat window');
    }
  } else {
    console.error('Message form not found in the chat window');
  }
  
  // Make sure to actually append the chat window to the DOM
  elements.chatWindows.appendChild(chatWindow);
  
  // Double-check that the messages container and form are properly visible
  const messagesContainer = chatWindow.querySelector('.messages-container');
  if (messagesContainer) {
    messagesContainer.style.display = 'block';
  }
  
  const formContainer = chatWindow.querySelector('.message-form').closest('div');
  if (formContainer) {
    formContainer.style.display = 'block';
  }
  
  // Mark as open
  addOpenTab(conversationId);
  
  // Load messages - for existing conversations
  fetchMessages(conversationId);
  
  // Activate this tab
  activateTab(conversationId);
  
  // Mark conversation as active in sidebar
  const conversationItems = elements.conversationList.querySelectorAll('.conversation-item');
  conversationItems.forEach(item => {
    if (item.dataset.id === conversationId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

// Delete a conversation
export async function deleteConversation(conversationId) {
  // Show confirmation dialog
  if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
    return;
  }
  
  try {
    console.log('Deleting conversation:', conversationId);
    await apiDeleteConversation(conversationId);
    
    // Remove from conversations object
    removeConversation(conversationId);
    
    // Remove from the UI
    const conversationItem = elements.conversationList.querySelector(`.conversation-item[data-id="${conversationId}"]`);
    if (conversationItem) {
      conversationItem.remove();
    }
    
    // If this conversation was open, close the tab
    if (state.openTabs.has(conversationId)) {
      closeTab(conversationId);
    }
    
    // Show empty state if no conversations left
    if (Object.keys(state.conversations).length === 0) {
      elements.conversationList.innerHTML = `
        <div class="px-4 py-2 text-gray-500 text-center mt-8">
          <i class="fas fa-comments text-3xl mb-2"></i>
          <p>No conversations yet</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error deleting conversation:', error);
    alert('Failed to delete conversation. Please try again.');
  }
}

// Debugging utility for conversation initialization and opening
export function debugConversationInitialization() {
  console.log('Conversation Initialization Debug');
  
  // Check DOM element references
  console.log('DOM Elements:', {
    newChatBtn: document.getElementById('new-chat-btn'),
    conversationList: document.getElementById('conversation-list'),
    tabsContainer: document.getElementById('tabs-container'),
    chatWindows: document.getElementById('chat-windows')
  });

  // Check templates
  const templates = [
    'chat-window-template',
    'user-message-template', 
    'bot-message-template', 
    'tab-template', 
    'conversation-item-template'
  ];
  
  console.log('Template Availability:', 
    templates.reduce((acc, templateId) => {
      acc[templateId] = !!document.getElementById(templateId);
      return acc;
    }, {})
  );

  // Enhanced conversation list debug
  const conversationItems = document.querySelectorAll('.conversation-item');
  console.log('Conversation Items:', {
    count: conversationItems.length,
    details: Array.from(conversationItems).map(item => ({
      id: item.dataset.id,
      title: item.querySelector('.conversation-title')?.textContent,
      date: item.querySelector('.conversation-date')?.textContent
    }))
  });

  // Event listener debugging
  const listenerCheck = {
    newChatBtn: !!window.debugNewChatBtnListeners,
    conversationItems: Array.from(conversationItems).map(item => 
      item.getAttribute('data-debug-listeners') || 'No debug info'
    )
  };
  console.log('Event Listener Debug:', listenerCheck);
}

// Enhance event listeners with debugging
export function enhanceEventListenersWithDebugging() {
  const newChatBtn = document.getElementById('new-chat-btn');
  const conversationList = document.getElementById('conversation-list');

  if (newChatBtn) {
    window.debugNewChatBtnListeners = true;
    newChatBtn.addEventListener('click', (e) => {
      console.log('New Chat Button Clicked', e);
    });
  }

  if (conversationList) {
    conversationList.addEventListener('click', (e) => {
      const conversationItem = e.target.closest('.conversation-item');
      if (conversationItem) {
        console.log('Conversation Item Clicked', {
          conversationId: conversationItem.dataset.id,
          title: conversationItem.querySelector('.conversation-title')?.textContent,
          event: e
        });
        
        // Add a debug attribute
        conversationItem.setAttribute('data-debug-listeners', 'Listener triggered');
      }
    });
  }
}

// Run diagnostics on initialization
export function runConversationDiagnostics() {
  debugConversationInitialization();
  enhanceEventListenersWithDebugging();
}

// Call diagnostics when DOM is ready
document.addEventListener('DOMContentLoaded', runConversationDiagnostics);
