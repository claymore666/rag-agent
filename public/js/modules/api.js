// public/js/modules/api.js - API calls to server endpoints

// Get all conversations from the server
export async function getConversations() {
  try {
    const response = await fetch('/api/conversations');
    if (!response.ok) throw new Error('Failed to fetch conversations');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching conversations:', error);
    throw error;
  }
}

// Create a new conversation on the server
export async function createConversation(title = 'New Conversation') {
  try {
    const response = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    
    if (!response.ok) throw new Error('Failed to create conversation');
    
    return await response.json();
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
}

// Get messages for a conversation
export async function getMessages(conversationId) {
  try {
    const response = await fetch(`/api/conversations/${conversationId}/messages`);
    if (!response.ok) throw new Error('Failed to fetch messages');
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

// Send a new message
export async function sendMessage(conversationId, content) {
  try {
    const response = await fetch(`/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    
    if (!response.ok) throw new Error('Failed to send message');
    
    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Delete a conversation
export async function deleteConversation(conversationId) {
  try {
    const response = await fetch(`/api/conversations/${conversationId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) throw new Error('Failed to delete conversation');
    
    return await response.json();
  } catch (error) {
    console.error('Error deleting conversation:', error);
    throw error;
  }
}
