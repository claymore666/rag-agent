// public/js/modules/state.js - Application state management

// Application state
export let state = {
  conversations: {},
  openTabs: new Set(),
  activeConversationId: null
};

// Initialize application state
export function initState() {
  state.conversations = {};
  state.openTabs = new Set();
  state.activeConversationId = null;
}

// State update functions
export function addConversation(conversation) {
  state.conversations[conversation.id.toString()] = conversation;
}

export function removeConversation(conversationId) {
  delete state.conversations[conversationId];
}

export function addOpenTab(conversationId) {
  state.openTabs.add(conversationId);
}

export function removeOpenTab(conversationId) {
  state.openTabs.delete(conversationId);
}

export function setActiveConversation(conversationId) {
  state.activeConversationId = conversationId.toString();
}
