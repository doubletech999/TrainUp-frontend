// ===== TrainUp - Global Notifications Handler =====
// This script handles notifications across all authenticated pages

/**
 * Global notification state
 */
let notificationCheckInterval = null;
let lastNotificationCount = 0;

/**
 * Initialize notifications system
 * Call this function on every authenticated page
 */
function initializeNotifications() {
    // Check if user is logged in
    if (!isLoggedIn()) {
        return;
    }

    // Initial check
    checkNotifications();

    // Set up periodic checks (every 30 seconds)
    if (notificationCheckInterval) {
        clearInterval(notificationCheckInterval);
    }
    notificationCheckInterval = setInterval(checkNotifications, 30000);

    // Add CSS animations
    addNotificationStyles();

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (notificationCheckInterval) {
            clearInterval(notificationCheckInterval);
        }
    });
}

/**
 * Check for new notifications
 */
async function checkNotifications() {
    try {
        const response = await apiRequest('/notifications/unread-count', {
            method: 'GET'
        });

        if (response.success && response.data) {
            const count = response.data.count || 0;

            // Check if there are new notifications since last check
            if (count > lastNotificationCount && lastNotificationCount > 0) {
                // Fetch the new notifications
                fetchNewNotifications();
            }

            lastNotificationCount = count;
            updateNotificationBadge(count);

            // If there are notifications, fetch recent ones
            if (count > 0) {
                await fetchRecentNotifications();
            }
        } else {
            updateNotificationBadge(0);
        }
    } catch (error) {
        // Silent fail for notifications check
        console.log('Could not check notifications');
    }
}

/**
 * Fetch new notifications for toast display
 */
async function fetchNewNotifications() {
    try {
        const response = await apiRequest('/notifications/recent?limit=1', {
            method: 'GET'
        });

        if (response.success && response.data && response.data.length > 0) {
            const notification = response.data[0];
            if (!notification.read) {
                showNotificationToast(notification);
            }
        }
    } catch (error) {
        console.log('Could not fetch new notifications');
    }
}

/**
 * Fetch recent notifications for preview
 */
async function fetchRecentNotifications() {
    try {
        const response = await apiRequest('/notifications/recent?limit=5', {
            method: 'GET'
        });

        if (response.success && response.data && response.data.length > 0) {
            showNotificationPreview(response.data);
        }
    } catch (error) {
        console.log('Could not fetch recent notifications');
    }
}

/**
 * Show notification preview (can be displayed in a dropdown)
 */
function showNotificationPreview(notifications) {
    // Store in session for dropdown access
    sessionStorage.setItem('recentNotifications', JSON.stringify(notifications));

    // Trigger custom event for notification dropdown
    const event = new CustomEvent('notificationsUpdated', {
        detail: { notifications }
    });
    window.dispatchEvent(event);
}

/**
 * Update notification badge in UI
 */
function updateNotificationBadge(count) {
    // Update sidebar notification badge (for dashboard pages)
    updateSidebarBadge(count);

    // Update header notification badge (if exists)
    updateHeaderBadge(count);

    // Update page title with notification count
    updatePageTitle(count);
}

/**
 * Update sidebar notification badge
 */
function updateSidebarBadge(count) {
    const notificationLink = document.querySelector('a[href*="notifications.html"]');

    if (notificationLink) {
        let badge = notificationLink.querySelector('.notification-badge');

        if (!badge && count > 0) {
            badge = document.createElement('span');
            badge.className = 'notification-badge';
            badge.style.cssText = `
                position: absolute;
                top: 50%;
                right: 1rem;
                transform: translateY(-50%);
                background: var(--danger-color, #ef4444);
                color: white;
                font-size: 0.75rem;
                font-weight: 700;
                padding: 0.125rem 0.5rem;
                border-radius: 999px;
                min-width: 20px;
                text-align: center;
                animation: pulse 2s infinite;
            `;
            notificationLink.style.position = 'relative';
            notificationLink.appendChild(badge);
        }

        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'block';
                badge.style.animation = 'pulse 2s infinite';
            } else {
                badge.style.display = 'none';
            }
        }
    }
}

/**
 * Update header notification badge
 */
function updateHeaderBadge(count) {
    const headerBadge = document.getElementById('notificationBadge');
    
    if (headerBadge) {
        if (count > 0) {
            headerBadge.textContent = count > 99 ? '99+' : count;
            headerBadge.classList.remove('hidden');
        } else {
            headerBadge.classList.add('hidden');
        }
    }
    
    // Also update old selector if exists
    const headerNotificationIcon = document.querySelector('.header-notifications, .notification-icon, [data-notification-icon]');

    if (headerNotificationIcon) {
        let headerBadgeOld = headerNotificationIcon.querySelector('.notification-count');

        if (!headerBadgeOld && count > 0) {
            headerBadgeOld = document.createElement('span');
            headerBadgeOld.className = 'notification-count';
            headerBadgeOld.style.cssText = `
                position: absolute;
                top: -5px;
                right: -5px;
                background: var(--danger-color, #ef4444);
                color: white;
                font-size: 0.65rem;
                font-weight: 700;
                padding: 0.125rem 0.375rem;
                border-radius: 999px;
                min-width: 18px;
                text-align: center;
                z-index: 10;
            `;
            headerNotificationIcon.style.position = 'relative';
            headerNotificationIcon.appendChild(headerBadgeOld);
        }

        if (headerBadgeOld) {
            if (count > 0) {
                headerBadgeOld.textContent = count > 99 ? '99+' : count;
                headerBadgeOld.style.display = 'block';
            } else {
                headerBadgeOld.style.display = 'none';
            }
        }
    }
}

/**
 * Update page title with notification count
 */
function updatePageTitle(count) {
    const originalTitle = document.title.replace(/^\(\d+\)\s*/, '');

    if (count > 0) {
        document.title = `(${count}) ${originalTitle}`;
    } else {
        document.title = originalTitle;
    }
}

/**
 * Display notification toast
 */
function showNotificationToast(notification) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        padding: 1rem 1.5rem;
        min-width: 320px;
        max-width: 420px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        border-left: 4px solid var(--primary-color, #3b82f6);
        cursor: pointer;
    `;

    // Determine notification icon based on type
    const notificationIcon = getNotificationIcon(notification.type);
    const notificationColor = getNotificationColor(notification.type);

    toast.innerHTML = `
        <div style="display: flex; align-items: start; gap: 1rem;">
            <i class="${notificationIcon}" style="color: ${notificationColor}; margin-top: 0.25rem; font-size: 1.25rem;"></i>
            <div style="flex: 1;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; color: var(--text-primary, #1f2937);">
                    ${notification.title || 'New Notification'}
                </h4>
                <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary, #6b7280); line-height: 1.5;">
                    ${notification.message}
                </p>
                ${notification.createdAt ? `
                    <span style="font-size: 0.75rem; color: var(--text-muted, #9ca3af); margin-top: 0.5rem; display: block;">
                        ${formatTimeAgo(notification.createdAt)}
                    </span>
                ` : ''}
            </div>
            <button onclick="this.parentElement.parentElement.remove()"
                    style="background: none; border: none; cursor: pointer; color: var(--text-secondary, #6b7280); font-size: 1.25rem; padding: 0; line-height: 1;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    // Click to navigate to notification
    toast.addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            window.location.href = 'notifications.html';
        }
    });

    document.body.appendChild(toast);

    // Auto-remove after 6 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 6000);

    // Play notification sound (optional)
    playNotificationSound();
}

/**
 * Get notification icon based on type
 */
function getNotificationIcon(type) {
    const icons = {
        'APPLICATION_UPDATE': 'fas fa-file-alt',
        'APPLICATION_ACCEPTED': 'fas fa-check-circle',
        'APPLICATION_REJECTED': 'fas fa-times-circle',
        'NEW_MESSAGE': 'fas fa-envelope',
        'INTERNSHIP_POSTED': 'fas fa-briefcase',
        'EVALUATION_REQUEST': 'fas fa-star',
        'DEADLINE_REMINDER': 'fas fa-clock',
        'SYSTEM': 'fas fa-info-circle'
    };
    return icons[type] || 'fas fa-bell';
}

/**
 * Get notification color based on type
 */
function getNotificationColor(type) {
    const colors = {
        'APPLICATION_ACCEPTED': '#10b981',
        'APPLICATION_REJECTED': '#ef4444',
        'NEW_MESSAGE': '#3b82f6',
        'DEADLINE_REMINDER': '#f59e0b',
        'EVALUATION_REQUEST': '#8b5cf6'
    };
    return colors[type] || 'var(--primary-color, #3b82f6)';
}

/**
 * Play notification sound (optional)
 */
function playNotificationSound() {
    // Check if sound is enabled in user preferences
    const soundEnabled = localStorage.getItem('notificationSound') !== 'false';

    if (soundEnabled) {
        try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZijcIF2m98OScTgwOUaft4qhjHAU2kdj0zn0vBSR4yPDjlUQLEl+16uyqVhMJR6Hh9cFuJAUqgdDy2Yw4CBdqvfDlnU8MEFKo7OOrZBwGN5PY9c5/MAUkeMnw5ZhFDBNgtertrFgUCUeh4vbBbyYGK4HR89qOOQgYa77y5p5RDBBTqe/krGYcBjiU2fbPhzEGJXnL8OmdSA0UYbbq7q5aFgpIouP2wXInByx/0vPajzoIGWu+8+ufUg0RVKnw5a5oHAY5ltr3z4kzBSV6zPDqnkkNFWS36++wWhYKSaPk+MJzKAbNYc+/T0eBiAZv85WGbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZijcIF2m98OScTgwOUaft4qhjHAU2kdj0zn0vBSR4yPDjlUQLEl+16uyqVhMJR6Hh9cFuJAUqgdDy2Yw4CBdqvfDlnU8MEFKo7OOrZBwGN5PY9c5/MAUkeMnw5ZhFDBNgtertrFgUCUeh4vbBbyYGK4HR89qOOQgYa77y5p5RDBBTqe/krGYcBjiU2fbPhzEGJXnL8OmdSA0UYbbq7q5aFgpIouP2wXInByx/0vPajzoIGWu+8+ufUg0RVKnw5a5oHAY5ltr3z4kzBSV6zPDqnkkNFWS36++wWhYKSaPk+MJzKAbNYc+/T0eBiAZv85WGbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZijcIF2m98OScTgwOUaft4qhjHAU2kdj0zn0vBSR4yPDjlUQLEl+16uyqVhMJR6Hh9cFuJAUqgdDy2Yw4CBdqvfDlnU8MEFKo7OOrZBwGN5PY9c5/MAUkeMnw5ZhFDBNgtertrFgUCUeh4vbBbyYGK4HR89qOOQgYa77y5p5RDBBTqe/krGYcBjiU2fbPhzEGJXnL8OmdSA0UYbbq7q5aFgpIouP2wXInByx/0vPajzoIGWu+8+ufUg0RVKnw5a5oHAY5ltr3z4kzBSV6zPDqnkkNFWS36++wWhYKSaPk+MJzKAbNYc==');
            audio.volume = 0.3;
            audio.play().catch(() => {
                // Ignore play errors (browser might block autoplay)
            });
        } catch (error) {
            // Ignore sound errors
        }
    }
}

/**
 * Format time ago
 */
function formatTimeAgo(date) {
    const now = new Date();
    const notificationDate = new Date(date);
    const seconds = Math.floor((now - notificationDate) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return notificationDate.toLocaleDateString();
}

/**
 * Mark notification as read
 */
async function markNotificationAsRead(notificationId) {
    try {
        const response = await apiRequest(`/notifications/${notificationId}/read`, {
            method: 'PUT'
        });

        if (response.success) {
            // Refresh notification count
            await checkNotifications();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

/**
 * Mark all notifications as read
 */
async function markAllNotificationsAsRead() {
    try {
        const response = await apiRequest('/notifications/mark-all-read', {
            method: 'PUT'
        });

        if (response.success) {
            updateNotificationBadge(0);
            if (typeof showAlert === 'function') {
                showAlert('All notifications marked as read', 'success');
            }
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        if (typeof showAlert === 'function') {
            showAlert('Failed to mark notifications as read', 'error');
        }
    }
}

/**
 * Add CSS animations for notifications
 */
function addNotificationStyles() {
    // Check if styles already added
    if (document.getElementById('notification-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes pulse {
            0%, 100% {
                transform: translateY(-50%) scale(1);
                opacity: 1;
            }
            50% {
                transform: translateY(-50%) scale(1.1);
                opacity: 0.8;
            }
        }

        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }

        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }

        .notification-toast:hover {
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
            transform: translateY(-2px);
            transition: all 0.2s ease;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
            .notification-toast {
                top: 1rem !important;
                right: 1rem !important;
                left: 1rem !important;
                min-width: auto !important;
                max-width: none !important;
            }
        }
    `;
    document.head.appendChild(style);
}

/**
 * Navigate to notifications page
 */
function goToNotificationsPage() {
    // Determine the correct path based on current page
    const currentPath = window.location.pathname;
    let notificationsPath = 'notifications.html';
    
    // If we're in a subdirectory, keep the same path level
    if (currentPath.includes('/student/')) {
        notificationsPath = 'notifications.html';
    } else if (currentPath.includes('/company/')) {
        notificationsPath = 'notifications.html';
    } else if (currentPath.includes('/admin/')) {
        notificationsPath = 'notifications.html';
    } else if (currentPath.includes('/supervisor/')) {
        notificationsPath = 'notifications.html';
    }
    
    // Navigate to notifications page
    window.location.href = notificationsPath;
}

/**
 * Toggle notifications dropdown (kept for backward compatibility if needed)
 */
function toggleNotificationsDropdown() {
    const dropdown = document.getElementById('notificationsDropdown');
    if (!dropdown) return;
    
    dropdown.classList.toggle('active');
    
    // If opening, load notifications
    if (dropdown.classList.contains('active')) {
        loadNotificationsDropdown();
    }
}

/**
 * Load notifications in dropdown
 */
async function loadNotificationsDropdown() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;
    
    try {
        const response = await apiRequest('/notifications/recent?limit=10', {
            method: 'GET'
        });
        
        if (response.success && response.data && response.data.length > 0) {
            displayNotificationsInDropdown(response.data);
        } else {
            notificationsList.innerHTML = `
                <div class="notifications-empty">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        notificationsList.innerHTML = `
            <div class="notifications-empty">
                <i class="fas fa-exclamation-circle"></i>
                <p>Failed to load notifications</p>
            </div>
        `;
    }
}

/**
 * Display notifications in dropdown
 */
function displayNotificationsInDropdown(notifications) {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;
    
    notificationsList.innerHTML = notifications.map(notification => {
        const iconClass = getNotificationIconClass(notification.type);
        const isUnread = !notification.read;
        const timeAgo = formatTimeAgo(notification.createdAt);
        
        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" onclick="handleNotificationClick('${notification.id}')">
                <div class="notification-icon ${iconClass}">
                    <i class="${getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <h4>${notification.title || 'Notification'}</h4>
                    <p>${notification.message || ''}</p>
                    <span class="notification-time">${timeAgo}</span>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Get notification icon class
 */
function getNotificationIconClass(type) {
    if (type.includes('APPLICATION')) return 'application';
    if (type.includes('INTERNSHIP')) return 'internship';
    if (type.includes('EVALUATION')) return 'evaluation';
    return 'system';
}

/**
 * Handle notification click
 */
async function handleNotificationClick(notificationId) {
    // Mark as read
    await markNotificationAsRead(notificationId);
    
    // Close dropdown
    const dropdown = document.getElementById('notificationsDropdown');
    if (dropdown) {
        dropdown.classList.remove('active');
    }
    
    // Navigate to notifications page
    window.location.href = 'notifications.html';
}

/**
 * Close notifications dropdown when clicking outside
 */
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('notificationsDropdown');
    const iconWrapper = document.querySelector('.notification-icon-wrapper');
    
    if (dropdown && iconWrapper && !dropdown.contains(event.target) && !iconWrapper.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

// Listen for notifications updates
window.addEventListener('notificationsUpdated', function(event) {
    if (event.detail && event.detail.notifications) {
        const dropdown = document.getElementById('notificationsDropdown');
        if (dropdown && dropdown.classList.contains('active')) {
            displayNotificationsInDropdown(event.detail.notifications);
        }
    }
});

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNotifications);
} else {
    initializeNotifications();
}

// Make functions globally available
window.goToNotificationsPage = goToNotificationsPage;
window.toggleNotificationsDropdown = toggleNotificationsDropdown;
window.markAllNotificationsAsRead = markAllNotificationsAsRead;
window.handleNotificationClick = handleNotificationClick;
