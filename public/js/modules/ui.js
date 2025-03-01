// public/js/modules/ui.js - UI utilities and handlers
import { elements } from './dom-elements.js';
import { state, setActiveConversation, removeOpenTab } from './state.js';
import { createNewConversation, deleteConversation } from './conversation.js';

// Setup event listeners
export function setupEventListeners() {
  console.log('Setting up event listeners');
  console.log('New Chat Button:', elements.newChatBtn);
  
  if (elements.newChatBtn) {
    elements.newChatBtn.addEventListener('click', createNewConversation);
    console.log('New Chat Button event listener added');
  } else {
    console.error('New chat button not found');
  }
}

// Render a conversation item in the sidebar
export function renderConversationItem(conversation) {

  console.group('🔍 Render Conversation Item');
  console.log('Conversation:', conversation);
  
  const clone = elements.templates.conversationItemTemplate.content.cloneNode(true);
  const container = clone.querySelector('.conversation-item');
  
  console.log('Container before modification:', container);
  
  container.dataset.id = conversation.id.toString();
  container.querySelector('.conversation-title').textContent = conversation.title;
  
  const date = new Date(conversation.created_at);
  container.querySelector('.conversation-date').textContent = date.toLocaleDateString();
  
  console.log('Container after modification:', container);
  console.groupEnd();
  
  elements.conversationList.prepend(container);

  // Add click event for opening the conversation
  container.addEventListener('click', (e) => {
    console.log('Conversation item clicked:', conversation.id);
    
    // Only open if we didn't click the delete button
    if (!e.target.closest('.delete-conversation-btn')) {
      import('./conversation.js').then(module => {
        console.log('Attempting to open conversation:', conversation.id);
        module.openConversation(conversation.id);
      });
    }
  });
  
  // Add event listener for delete button
  const deleteBtn = container.querySelector('.delete-conversation-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent opening the conversation
      deleteConversation(conversation.id);
    });
  }
  
  elements.conversationList.prepend(container);
  console.log('Conversation item added to list');
}

// Activate a tab
-----------------------------------
export function activateTab(conversationId) {
  console.group('🔍 Activate Tab Debug');
  console.log('Conversation ID:', conversationId);
  console.log('Elements object:', elements);
  
  // Log all possible ways to find conversation items
  const itemsBySelector = document.querySelectorAll('.conversation-item');
  const itemsInConversationList = elements.conversationList 
    ? elements.conversationList.querySelectorAll('.conversation-item') 
    : [];
  
  console.log('Items by document selector:', itemsBySelector.length);
  console.log('Items in conversation list:', itemsInConversationList.length);
  
  // Log each item's details
  itemsBySelector.forEach((item, index) => {
    console.log(`Item ${index} details:`, {
      dataId: item.dataset.id,
      classList: Array.from(item.classList)
    });
  });
  
  // Verify conversationList exists and is valid
  if (!elements.conversationList) {
    console.error('conversationList is not defined!');
    return;
  }
  
  // Use multiple selection methods
  const conversationItemsBySelector = elements.conversationList.querySelectorAll('.conversation-item');
  const conversationItemsByClass = document.querySelectorAll('.conversation-item');
  
  console.log('Conversation items in conversationList:', conversationItemsBySelector.length);
  console.log('Conversation items in document:', conversationItemsByClass.length);
  
  // If no items found in conversationList, try document-wide selection
  const conversationItems = conversationItemsBySelector.length > 0 
    ? conversationItemsBySelector 
    : conversationItemsByClass;
  
  console.log('Total conversation items:', conversationItems.length);
  
  // Convert to string explicitly
  const conversationIdString = conversationId.toString();
  
  // Find ALL conversation items
  const conversationItems = elements.conversationList.querySelectorAll('.conversation-item');
  
  console.log('Total conversation items:', conversationItems.length);
  
  conversationItems.forEach(item => {
    // Detailed logging
    console.log('Item details:', {
      dataId: item.dataset.id,
      classList: Array.from(item.classList),
      matchesId: item.dataset.id === conversationIdString
    });
    
    if (item.dataset.id === conversationIdString) {
      console.log('MATCHED - Attempting to add active class');
      
      // Force add class and log result
      item.classList.add('active');
      console.log('After adding active class:', {
        classList: Array.from(item.classList),
        hasActiveClass: item.classList.contains('active')
      });
      
      // Force style application
      item.style.backgroundColor = '#eef2ff';
      item.style.borderLeft = '3px solid #4f46e5';
    } else {
      item.classList.remove('active');
      
      // Reset styles for other items
      item.style.backgroundColor = '';
      item.style.borderLeft = '';
    }
  });
}
-------------------------------------  
  // Clear the welcome screen if it exists
  const welcomeScreen = elements.chatWindows.querySelector('.text-center')?.closest('.h-full');
  if (welcomeScreen) {
    welcomeScreen.remove();
  }
  
  // Show active chat window, hide others
  const windows = elements.chatWindows.querySelectorAll('.chat-window');
  windows.forEach(window => {
    if (window.dataset.id === conversationId) {
      window.style.display = 'flex'; // Make sure it's using flex display
      console.log('Showing chat window for conversation:', conversationId);
      
      // Ensure the message container and form are visible
      const messagesContainer = window.querySelector('.messages-container');
      if (messagesContainer) {
        messagesContainer.style.display = 'block';
      }
      
      const formContainer = window.querySelector('.message-form').closest('div');
      if (formContainer) {
        formContainer.style.display = 'block';
      }
    } else {
      window.style.display = 'none';
    }
  });
  
  // Focus input in active window
  const activeWindow = elements.chatWindows.querySelector(`.chat-window[data-id="${conversationId}"]`);
  if (activeWindow) {
    const input = activeWindow.querySelector('.message-input');
    if (input) {
      setTimeout(() => input.focus(), 0);
    } else {
      console.error('Input element not found in active chat window');
    }
  } else {
    console.error('Active chat window not found:', conversationId);
  }
  
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

// Close a tab
export function closeTab(conversationId) {
  // Remove tab
  const tab = elements.tabsContainer.querySelector(`.chat-tab[data-id="${conversationId}"]`);
  if (tab) tab.remove();
  
  // Remove chat window
  const chatWindow = elements.chatWindows.querySelector(`.chat-window[data-id="${conversationId}"]`);
  if (chatWindow) chatWindow.remove();
  
  // Update state
  removeOpenTab(conversationId);
  
  // If this was the active tab, activate another one if available
  if (state.activeConversationId === conversationId) {
    if (state.openTabs.size > 0) {
      activateTab(state.openTabs.values().next().value);
    } else {
      setActiveConversation(null);
      // Show empty state
      elements.chatWindows.innerHTML = `
        <div class="h-full flex items-center justify-center text-gray-500">
          <div class="text-center p-8">
            <i class="fas fa-robot text-6xl mb-4 text-indigo-200"></i>
            <h2 class="text-xl font-semibold mb-2">Welcome to AI Assistant</h2>
            <p>Create a new chat or select an existing conversation to get started</p>
          </div>
        </div>
      `;
    }
  }
}
