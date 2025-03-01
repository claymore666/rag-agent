document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const newChatBtn = document.getElementById('new-chat-btn');
  const conversationList = document.getElementById('conversation-list');
  const tabsContainer = document.getElementById('tabs-container');
  const chatWindows = document.getElementById('chat-windows');
  
  // Templates
  const chatWindowTemplate = document.getElementById('chat-window-template');
  const userMessageTemplate = document.getElementById('user-message-template');
  const botMessageTemplate = document.getElementById('bot-message-template');
  const tabTemplate = document.getElementById('tab-template');
  const conversationItemTemplate = document.getElementById('conversation-item-template');
  
  // State
  const conversations = {};
  const openTabs = new Set();
  let activeConversationId = null;
  
  // Fetch existing conversations on load
  fetchConversations();
  
  // Event listeners
  newChatBtn.addEventListener('click', createNewConversation);
  
  // Functions
  async function fetchConversations() {
    try {
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      
      const data = await response.json();
      
      if (data.length === 0) {
        return;
      }
      
      // Clear placeholder
      conversationList.innerHTML = '';
      
      // Populate conversation list
      data.forEach(conversation => {
        conversations[conversation.id] = conversation;
        addConversationToList(conversation);
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  }
  
  function addConversationToList(conversation) {
    const clone = conversationItemTemplate.content.cloneNode(true);
    const container = clone.querySelector('.conversation-item');
    
    container.dataset.id = conversation.id;
    container.querySelector('.conversation-title').textContent = conversation.title;
    
    const date = new Date(conversation.created_at);
    container.querySelector('.conversation-date').textContent = date.toLocaleDateString();
    
    // Add click event for opening the conversation
    container.addEventListener('click', (e) => {
      // Only open if we didn't click the delete button
      if (!e.target.closest('.delete-conversation-btn')) {
        openConversation(conversation.id);
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
    
    conversationList.prepend(container);
  }
  
  async function createNewConversation() {
    try {
      console.log('Creating new conversation...');
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Conversation' }),
      });
      
      if (!response.ok) throw new Error('Failed to create conversation');
      
      const conversation = await response.json();
      console.log('Conversation created:', conversation);
      conversations[conversation.id] = conversation;
      
      // Clear the "no conversations" placeholder if it exists
      if (conversationList.querySelector('.text-center')) {
        conversationList.innerHTML = '';
      }
      
      addConversationToList(conversation);
      openConversation(conversation.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create a new conversation. Please try again.');
    }
  }
  
function openConversation(conversationId) {
  console.log('Opening conversation:', conversationId);
  // If conversation is already open, just activate that tab
  if (openTabs.has(conversationId)) {
    activateTab(conversationId);
    return;
  }
  
  const conversation = conversations[conversationId];
  if (!conversation) {
    console.error('Conversation not found:', conversationId);
    return;
  }
  
  // Clear the welcome screen if it exists
  if (chatWindows.querySelector('.text-center')) {
    chatWindows.innerHTML = '';
  }
  
  // Create new tab
  const tabClone = tabTemplate.content.cloneNode(true);
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
  
  tabsContainer.appendChild(tab);
  
  // Create chat window
  const windowClone = chatWindowTemplate.content.cloneNode(true);
  const chatWindow = windowClone.querySelector('.chat-window');
  
  chatWindow.dataset.id = conversationId;
  
  // Make sure chat window is visible
  chatWindow.style.display = 'flex';
  
  // Add submit handler to the form
  const messageForm = chatWindow.querySelector('.message-form');
  if (messageForm) {
    messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = chatWindow.querySelector('.message-input');
      const message = input.value.trim();
      
      if (message) {
        sendMessage(conversationId, message);
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
  
  chatWindows.appendChild(chatWindow);
  
  // Mark as open
  openTabs.add(conversationId);
  
  // Load messages - for existing conversations
  fetchMessages(conversationId);
  
  // Activate this tab
  activateTab(conversationId);
  
  // Mark conversation as active in sidebar
  const conversationItems = conversationList.querySelectorAll('.conversation-item');
  conversationItems.forEach(item => {
    if (item.dataset.id === conversationId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}
function activateTab(conversationId) {
  console.log('Activating tab for conversation:', conversationId);
  
  // Update active tab state
  activeConversationId = conversationId;
  
  // Update tab styling
  const tabs = tabsContainer.querySelectorAll('.chat-tab');
  tabs.forEach(tab => {
    if (tab.dataset.id === conversationId) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
  
  // Clear the welcome screen if it exists
  const welcomeScreen = chatWindows.querySelector('.text-center')?.closest('.h-full');
  if (welcomeScreen) {
    welcomeScreen.remove();
  }
  
  // Show active chat window, hide others
  const windows = chatWindows.querySelectorAll('.chat-window');
  windows.forEach(window => {
    if (window.dataset.id === conversationId) {
      window.style.display = 'flex';
      console.log('Showing chat window for conversation:', conversationId);
    } else {
      window.style.display = 'none';
    }
  });
  
  // Focus input in active window
  const activeWindow = chatWindows.querySelector(`.chat-window[data-id="${conversationId}"]`);
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
  const conversationItems = conversationList.querySelectorAll('.conversation-item');
  conversationItems.forEach(item => {
    if (item.dataset.id === conversationId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}
  function closeTab(conversationId) {
    // Remove tab
    const tab = tabsContainer.querySelector(`.chat-tab[data-id="${conversationId}"]`);
    if (tab) tab.remove();
    
    // Remove chat window
    const chatWindow = chatWindows.querySelector(`.chat-window[data-id="${conversationId}"]`);
    if (chatWindow) chatWindow.remove();
    
    // Update state
    openTabs.delete(conversationId);
    
    // If this was the active tab, activate another one if available
    if (activeConversationId === conversationId) {
      if (openTabs.size > 0) {
        activateTab(openTabs.values().next().value);
      } else {
        activeConversationId = null;
        // Show empty state
        chatWindows.innerHTML = `
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
  
  async function fetchMessages(conversationId) {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const messages = await response.json();
      
      // Get messages container for this conversation
      const chatWindow = chatWindows.querySelector(`.chat-window[data-id="${conversationId}"]`);
      if (!chatWindow) {
        console.error('Chat window not found for conversation:', conversationId);
        return;
      }
      
      const messagesContainer = chatWindow.querySelector('.messages-container');
      if (!messagesContainer) {
        console.error('Messages container not found in chat window');
        return;
      }
      
      // Clear existing messages
      messagesContainer.innerHTML = '';
      
      // If no messages, add a welcome message
      if (messages.length === 0) {
        const welcomeHtml = `
          <div class="flex justify-start">
            <div class="bg-white shadow-sm border border-gray-200 rounded-lg py-2 px-4 max-w-md">
              <div class="message-content prose">
                Hi there! How can I assist you today?
              </div>
            </div>
          </div>
        `;
        messagesContainer.innerHTML = welcomeHtml;
      } else {
        // Add messages
        messages.forEach(message => {
          addMessageToUI(messagesContainer, message.content, message.is_user);
        });
      }
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }
  
  async function sendMessage(conversationId, content) {
    try {
      // Get messages container for this conversation
      const chatWindow = chatWindows.querySelector(`.chat-window[data-id="${conversationId}"]`);
      if (!chatWindow) {
        console.error('Chat window not found for conversation:', conversationId);
        return;
      }
      
      const messagesContainer = chatWindow.querySelector('.messages-container');
      if (!messagesContainer) {
        console.error('Messages container not found in chat window');
        return;
      }
      
      // Add user message to UI
      addMessageToUI(messagesContainer, content, true);
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Add loading indicator
      const loadingId = 'loading-' + Date.now();
      const loadingHtml = `
        <div id="${loadingId}" class="flex justify-start">
          <div class="bg-white shadow-sm border border-gray-200 rounded-lg py-2 px-4 max-w-md">
            <div class="message-content prose">
              <div class="flex items-center">
                <div class="dot-flashing mr-2"></div>
                Thinking...
              </div>
            </div>
          </div>
        </div>
      `;
      messagesContainer.insertAdjacentHTML('beforeend', loadingHtml);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      // Send message to server
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      
      // Remove loading indicator
      const loadingElement = document.getElementById(loadingId);
      if (loadingElement) {
        loadingElement.remove();
      }
      
      if (!response.ok) throw new Error('Failed to send message');
      
      const botMessage = await response.json();
      
      // Add bot message to UI
      addMessageToUI(messagesContainer, botMessage.content, false);
      
      // Scroll to bottom
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  }
  
  function addMessageToUI(container, content, isUser) {
    const template = isUser ? userMessageTemplate : botMessageTemplate;
    const clone = template.content.cloneNode(true);
    
    const messageContent = clone.querySelector('.message-content');
    
    if (isUser) {
      messageContent.textContent = content;
    } else {
      // Use marked.js to render markdown for bot messages
      messageContent.innerHTML = marked.parse(content);
      
      // Apply syntax highlighting to code blocks
      const codeBlocks = messageContent.querySelectorAll('pre code');
      codeBlocks.forEach(block => {
        hljs.highlightElement(block);
      });
    }
    
    container.appendChild(clone);
  }
  
  // Delete conversation functionality
  async function deleteConversation(conversationId) {
    // Show confirmation dialog
    if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
      return;
    }
    
    try {
      console.log('Deleting conversation:', conversationId);
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete conversation');
      
      // Remove from conversations object
      delete conversations[conversationId];
      
      // Remove from the UI
      const conversationItem = conversationList.querySelector(`.conversation-item[data-id="${conversationId}"]`);
      if (conversationItem) {
        conversationItem.remove();
      }
      
      // If this conversation was open, close the tab
      if (openTabs.has(conversationId)) {
        closeTab(conversationId);
      }
      
      // Show empty state if no conversations left
      if (Object.keys(conversations).length === 0) {
        conversationList.innerHTML = `
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
});
