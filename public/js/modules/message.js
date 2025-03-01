// public/js/modules/message.js - Message handling functionality
import { elements } from './dom-elements.js';
import { getMessages, sendMessage as apiSendMessage } from './api.js';
import { marked } from 'https://cdnjs.cloudflare.com/ajax/libs/marked/4.0.2/marked.esm.js';

// Fetch messages for a conversation
export async function fetchMessages(conversationId) {
  try {
    const messages = await getMessages(conversationId);
    
    // Get messages container for this conversation
    const chatWindow = elements.chatWindows.querySelector(`.chat-window[data-id="${conversationId}"]`);
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
    
    // If no messages, add a welcome message (for new conversations)
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
    
    // Ensure the messages container is visible
    messagesContainer.style.display = 'block';
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (error) {
    console.error('Error fetching messages:', error);
  }
}

// Send a message
export async function sendMessage(conversationId, content) {
  try {
    // Get messages container for this conversation
    const chatWindow = elements.chatWindows.querySelector(`.chat-window[data-id="${conversationId}"]`);
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
    const botMessage = await apiSendMessage(conversationId, content);
    
    // Remove loading indicator
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) {
      loadingElement.remove();
    }
    
    // Add bot message to UI
    addMessageToUI(messagesContainer, botMessage.content, false);
    
    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message. Please try again.');
  }
}

// Add a message to the UI
export function addMessageToUI(container, content, isUser) {
  const template = isUser ? 
    elements.templates.userMessageTemplate : 
    elements.templates.botMessageTemplate;
    
  const clone = template.content.cloneNode(true);
  const messageContent = clone.querySelector('.message-content');
  
  if (isUser) {
    messageContent.textContent = content;
  } else {
    // Use marked.js to render markdown for bot messages
    messageContent.innerHTML = marked.parse(content);
    
    // Apply syntax highlighting to code blocks
    const codeBlocks = messageContent.querySelectorAll('pre code');
    if (window.hljs) {
      codeBlocks.forEach(block => {
        window.hljs.highlightElement(block);
      });
    }
  }
  
  container.appendChild(clone);
}
