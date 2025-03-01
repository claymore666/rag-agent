// Fixed chat.js - Replace your existing chat.js with this file
document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const newChatBtn = document.getElementById('new-chat-btn');
  const conversationList = document.getElementById('conversation-list');
  const tabsContainer = document.getElementById('tabs-container');
  const chatWindows = document.getElementById('chat-windows');
  
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
    // Create conversation item directly without using template
    const container = document.createElement('div');
    container.className = 'conversation-item px-4 py-2 hover:bg-gray-100 cursor-pointer';
    container.dataset.id = conversation.id;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'flex justify-between items-center';
    
    const title = document.createElement('div');
    title.className = 'conversation-title text-gray-800 truncate font-medium';
    title.textContent = conversation.title;
    
    const deleteBtn = document.createElement('span');
    deleteBtn.className = 'delete-conversation-btn text-gray-400 hover:text-red-500 px-1 cursor-pointer';
    deleteBtn.title = 'Delete conversation';
    deleteBtn.textContent = '×';
    
    const dateDiv = document.createElement('div');
    dateDiv.className = 'text-xs text-gray-500 conversation-date';
    const date = new Date(conversation.created_at);
    dateDiv.textContent = date.toLocaleDateString();
    
    contentDiv.appendChild(title);
    contentDiv.appendChild(deleteBtn);
    container.appendChild(contentDiv);
    container.appendChild(dateDiv);
    
    // Add click event for opening the conversation
    container.addEventListener('click', (e) => {
      // Only open if we didn't click the delete button
      if (!e.target.closest('.delete-conversation-btn')) {
        openConversation(conversation.id);
      }
    });
    
    // Add event listener for delete button
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent opening the conversation
      deleteConversation(conversation.id);
    });
    
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
    
    // Create tab directly
    const tab = document.createElement('button');
    tab.className = 'chat-tab px-4 py-2 text-sm rounded-md hover:bg-gray-100 flex items-center space-x-2';
    tab.dataset.id = conversationId;
    
    const tabTitle = document.createElement('span');
    tabTitle.className = 'tab-title';
    tabTitle.textContent = conversation.title.length > 15 
      ? conversation.title.substring(0, 15) + '...' 
      : conversation.title;
    
    const closeBtn = document.createElement('span');
    closeBtn.className = 'close-tab ml-2 text-gray-400 hover:text-gray-600';
    closeBtn.textContent = '×';
    
    tab.appendChild(tabTitle);
    tab.appendChild(closeBtn);
    
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(conversationId);
    });
    
    tab.addEventListener('click', () => {
      activateTab(conversationId);
    });
    
    // Clear tabs placeholder if it exists
    const tabsPlaceholder = tabsContainer.querySelector('.text-gray-500');
    if (tabsPlaceholder) {
      tabsPlaceholder.remove();
    }
    
    tabsContainer.appendChild(tab);
    
    // Create chat window directly (no templates)
    const chatWindow = document.createElement('div');
    chatWindow.className = 'h-full bg-white';
    chatWindow.style.display = 'flex';
    chatWindow.style.flexDirection = 'column';
    chatWindow.dataset.id = conversationId;
    
    // Create messages container
    const messagesContainer = document.createElement('div');
    messagesContainer.className = 'flex-1 overflow-y-auto p-4 space-y-4 messages-container';
    messagesContainer.style.backgroundColor = 'white';
    
    // Add welcome message
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'flex justify-start';
    welcomeMessage.innerHTML = `
      <div class="bg-white shadow-sm border border-gray-200 rounded-lg py-2 px-4 max-w-md">
        <div class="message-content prose">
          Hi there! How can I assist you today?
        </div>
      </div>
    `;
    messagesContainer.appendChild(welcomeMessage);
    
    // Create message form area
    const formArea = document.createElement('div');
    formArea.className = 'border-t border-gray-200 p-4 bg-white';
    
    const messageForm = document.createElement('form');
    messageForm.className = 'message-form flex items-end';
    
    const inputContainer = document.createElement('div');
    inputContainer.className = 'flex-1 bg-white rounded-lg shadow-sm overflow-hidden border border-gray-300';
    
    const textarea = document.createElement('textarea');
    textarea.className = 'message-input w-full p-3 focus:outline-none resize-none';
    textarea.rows = 1;
    textarea.placeholder = 'Type your message...';
    
    const sendButton = document.createElement('button');
    sendButton.type = 'submit';
    sendButton.className = 'ml-2 bg-indigo-600 text-white rounded-lg p-3 hover:bg-indigo-700';
    sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
    
    // Assemble the form
    inputContainer.appendChild(textarea);
    messageForm.appendChild(inputContainer);
    messageForm.appendChild(sendButton);
    formArea.appendChild(messageForm);
    
    // Assemble the chat window
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(formArea);
    
    // Add to chat windows container
    chatWindows.appendChild(chatWindow);
    
    // Set up form submit handler
    messageForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const message = textarea.value.trim();
      
      if (message) {
        sendMessage(conversationId, message);
        textarea.value = '';
        textarea.style.height = 'auto';
      }
    });
    
    // Auto-resize textarea
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
    
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
    
    // Focus the textarea
    setTimeout(() => {
      textarea.focus();
    }, 100);
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
    
    // Show active chat window, hide others
    const windows = chatWindows.querySelectorAll('div[data-id]');
    windows.forEach(window => {
      if (window.dataset.id === conversationId) {
        window.style.display = 'flex';
      } else {
        window.style.display = 'none';
      }
    });
    
    // Focus input in active window
    const activeWindow = chatWindows.querySelector(`div[data-id="${conversationId}"]`);
    if (activeWindow) {
      const input = activeWindow.querySelector('.message-input');
      if (input) {
        setTimeout(() => input.focus(), 0);
      }
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
    const chatWindow = chatWindows.querySelector(`div[data-id="${conversationId}"]`);
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
        
        // Add placeholder to tabs container if empty
        if (tabsContainer.children.length === 0) {
          tabsContainer.innerHTML = `
            <div class="px-4 py-2 text-gray-500 text-center flex-1">
              <p>Create or select a conversation to start chatting</p>
            </div>
          `;
        }
      }
    }
  }
  
  async function fetchMessages(conversationId) {
    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      
      const messages = await response.json();
      
      // Get messages container for this conversation
      const chatWindow = chatWindows.querySelector(`div[data-id="${conversationId}"]`);
      if (!chatWindow) {
        console.error('Chat window not found for conversation:', conversationId);
        return;
      }
      
      const messagesContainer = chatWindow.querySelector('.messages-container');
      if (!messagesContainer) {
        console.error('Messages container not found in chat window');
        return;
      }
      
      // Only replace if there are actual messages from the server
      if (messages.length > 0) {
        // Clear existing messages
        messagesContainer.innerHTML = '';
        
        // Add messages
        messages.forEach(message => {
          addMessageToUI(messagesContainer, message.content, message.is_user);
        });
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }
  
  async function sendMessage(conversationId, content) {
    try {
      // Get messages container for this conversation
      const chatWindow = chatWindows.querySelector(`div[data-id="${conversationId}"]`);
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
      const loadingIndicator = document.createElement('div');
      loadingIndicator.id = loadingId;
      loadingIndicator.className = 'flex justify-start';
      loadingIndicator.innerHTML = `
        <div class="bg-white shadow-sm border border-gray-200 rounded-lg py-2 px-4 max-w-md">
          <div class="message-content prose">
            <div class="flex items-center">
              <div class="dot-flashing mr-2"></div>
              Thinking...
            </div>
          </div>
        </div>
      `;
      messagesContainer.appendChild(loadingIndicator);
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
    // Create message elements directly instead of using templates
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'flex justify-end' : 'flex justify-start';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = isUser 
      ? 'bg-indigo-600 text-white rounded-lg py-2 px-4 max-w-md' 
      : 'bg-white shadow-sm border border-gray-200 rounded-lg py-2 px-4 max-w-md';
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content' + (isUser ? '' : ' prose');
    
    if (isUser) {
      contentDiv.textContent = content;
    } else {
      // Use marked.js to render markdown for bot messages
      contentDiv.innerHTML = marked.parse(content);
      
      // Apply syntax highlighting to code blocks
      const codeBlocks = contentDiv.querySelectorAll('pre code');
      codeBlocks.forEach(block => {
        hljs.highlightElement(block);
      });
    }
    
    bubbleDiv.appendChild(contentDiv);
    messageDiv.appendChild(bubbleDiv);
    container.appendChild(messageDiv);
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
