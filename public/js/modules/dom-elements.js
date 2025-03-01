// public/js/modules/dom-elements.js - DOM references and templates

// DOM element references
export let elements = {
  newChatBtn: null,
  conversationList: null,
  tabsContainer: null,
  chatWindows: null,
  templates: {}
};

// Initialize and store DOM references
export function initDOMElements() {
  console.log('Initializing DOM elements - START');
  
  elements.newChatBtn = document.getElementById('new-chat-btn');
  elements.conversationList = document.getElementById('conversation-list');
  elements.tabsContainer = document.getElementById('tabs-container');
  elements.chatWindows = document.getElementById('chat-windows');
  
  console.log('DOM Elements:', {
    newChatBtn: elements.newChatBtn,
    conversationList: elements.conversationList,
    tabsContainer: elements.tabsContainer,
    chatWindows: elements.chatWindows
  });
  
  // Templates
  elements.templates.chatWindowTemplate = document.getElementById('chat-window-template');
  elements.templates.userMessageTemplate = document.getElementById('user-message-template');
  elements.templates.botMessageTemplate = document.getElementById('bot-message-template');
  elements.templates.tabTemplate = document.getElementById('tab-template');
  elements.templates.conversationItemTemplate = document.getElementById('conversation-item-template');
  
  console.log('Templates:', elements.templates);
  console.log('Initializing DOM elements - END');

}
