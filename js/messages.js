// ===== TrainUp - Messages JavaScript =====

let conversations = [];
let currentConversation = null;
let messages = [];
let messageCheckInterval = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) {
        window.location.href = '../../login.html';
        return;
    }

    const userData = getUserData();
    loadUserInfo(userData);

    await loadConversations();

    // Auto-refresh messages every 10 seconds
    messageCheckInterval = setInterval(async () => {
        if (currentConversation) {
            await loadMessages(currentConversation.id, false);
        }
    }, 10000);

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (messageCheckInterval) {
            clearInterval(messageCheckInterval);
        }
    });
});

function loadUserInfo(userData) {
    const profile = userData.profile;

    if (profile) {
        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        const initials = getInitials(profile.firstName, profile.lastName);

        document.getElementById('userName').textContent = fullName || 'User';
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

async function loadConversations() {
    try {
        const response = await apiRequest('/messages/conversations', {
            method: 'GET'
        });

        if (response.success) {
            conversations = response.data || [];
            displayConversations();
        } else {
            throw new Error('Failed to load conversations');
        }

    } catch (error) {
        console.error('Error loading conversations:', error);
        document.getElementById('conversationsList').innerHTML = `
            <div class="empty-state" style="padding: 2rem;">
                <i class="fas fa-inbox"></i>
                <h3>No Conversations</h3>
                <p>You don't have any messages yet</p>
            </div>
        `;
    }
}

function displayConversations() {
    const container = document.getElementById('conversationsList');

    if (conversations.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 2rem;">
                <i class="fas fa-inbox"></i>
                <h3>No Conversations</h3>
                <p>You don't have any messages yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = conversations.map(conv => {
        const otherParty = conv.otherParty || {};
        const initials = getInitials(otherParty.firstName, otherParty.lastName);
        const name = `${otherParty.firstName || ''} ${otherParty.lastName || ''}`.trim() || 'User';

        return `
            <div class="conversation-item ${currentConversation?.id === conv.id ? 'active' : ''}"
                 onclick="selectConversation('${conv.id}')">
                <div class="conversation-avatar">
                    ${initials}
                </div>
                <div class="conversation-info">
                    <div class="conversation-name">
                        <strong>${name}</strong>
                        ${conv.unreadCount > 0 ? `
                            <span class="unread-badge">${conv.unreadCount}</span>
                        ` : ''}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="conversation-preview">
                            ${conv.lastMessage || 'No messages yet'}
                        </div>
                        <div class="conversation-time">
                            ${conv.lastMessageTime ? formatTimeAgo(conv.lastMessageTime) : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function selectConversation(conversationId) {
    currentConversation = conversations.find(c => c.id === conversationId);

    if (!currentConversation) return;

    displayConversations(); // Update active state
    await loadMessages(conversationId);
}

async function loadMessages(conversationId, showLoading = true) {
    try {
        if (showLoading) {
            document.getElementById('chatArea').innerHTML = `
                <div class="empty-chat">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Loading messages...</p>
                </div>
            `;
        }

        const response = await apiRequest(`/messages/conversations/${conversationId}`, {
            method: 'GET'
        });

        if (response.success) {
            messages = response.data || [];
            displayChat();

            // Mark as read
            await markAsRead(conversationId);
        } else {
            throw new Error('Failed to load messages');
        }

    } catch (error) {
        console.error('Error loading messages:', error);
        if (showLoading) {
            document.getElementById('chatArea').innerHTML = `
                <div class="empty-chat">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error Loading Messages</h3>
                    <p>Please try again</p>
                </div>
            `;
        }
    }
}

function displayChat() {
    const otherParty = currentConversation.otherParty || {};
    const initials = getInitials(otherParty.firstName, otherParty.lastName);
    const name = `${otherParty.firstName || ''} ${otherParty.lastName || ''}`.trim() || 'User';
    const userData = getUserData();

    document.getElementById('chatArea').innerHTML = `
        <div class="chat-header">
            <div class="conversation-avatar">
                ${initials}
            </div>
            <div>
                <strong>${name}</strong>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">
                    ${otherParty.email || ''}
                </div>
            </div>
        </div>

        <div class="chat-messages" id="chatMessages">
            ${messages.length === 0 ? `
                <div class="empty-chat">
                    <i class="fas fa-comments"></i>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            ` : messages.map(msg => {
                const isSent = msg.senderId === userData.id;
                const senderInitials = isSent ?
                    getInitials(userData.profile?.firstName, userData.profile?.lastName) :
                    initials;

                return `
                    <div class="message ${isSent ? 'sent' : 'received'}">
                        <div class="message-avatar">
                            ${senderInitials}
                        </div>
                        <div class="message-content">
                            <div class="message-text">${msg.content}</div>
                            <div class="message-time">${formatTimeAgo(msg.createdAt)}</div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>

        <div class="chat-input-area">
            <div class="chat-input-container">
                <textarea
                    id="messageInput"
                    class="chat-input"
                    placeholder="Type your message..."
                    rows="1"
                    onkeypress="handleMessageKeyPress(event)"
                ></textarea>
                <button class="send-btn" onclick="sendMessage()">
                    <i class="fas fa-paper-plane"></i>
                    Send
                </button>
            </div>
        </div>
    `;

    // Scroll to bottom
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Auto-resize textarea
    const input = document.getElementById('messageInput');
    if (input) {
        input.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 120) + 'px';
        });
    }
}

function handleMessageKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

async function sendMessage() {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content || !currentConversation) return;

    try {
        const response = await apiRequest('/messages', {
            method: 'POST',
            body: JSON.stringify({
                conversationId: currentConversation.id,
                recipientId: currentConversation.otherParty.id,
                content: content
            })
        });

        if (response.success) {
            input.value = '';
            input.style.height = 'auto';

            // Reload messages
            await loadMessages(currentConversation.id, false);
            await loadConversations();
        } else {
            showAlert(response.message || 'Failed to send message', 'error');
        }

    } catch (error) {
        console.error('Error sending message:', error);
        showAlert('Failed to send message. Please try again.', 'error');
    }
}

async function markAsRead(conversationId) {
    try {
        await apiRequest(`/messages/conversations/${conversationId}/read`, {
            method: 'PUT'
        });

        // Update conversation list
        await loadConversations();

    } catch (error) {
        console.error('Error marking as read:', error);
    }
}

function formatTimeAgo(dateString) {
    if (!dateString) return '';

    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
}
