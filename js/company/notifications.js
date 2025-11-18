// ===== TrainUp - Company Notifications JavaScript =====

let allNotifications = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) {
        window.location.href = '../../pages/auth/login.html';
        return;
    }

    const userData = getUserData();
    
    if (userData.userType !== 'COMPANY') {
        showAlert('Access denied. Companies only.', 'error');
        setTimeout(() => logout(), 2000);
        return;
    }

    loadUserInfo(userData);
    await loadNotifications();
    
    // Set up auto-refresh every 30 seconds
    setInterval(loadNotifications, 30000);
});

function loadUserInfo(userData) {
    const profile = userData.profile;
    
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) userNameEl.textContent = profile?.companyName || 'Company';
    if (userEmailEl) userEmailEl.textContent = userData.email;
    if (userAvatarEl) userAvatarEl.textContent = (profile?.companyName || 'C').charAt(0).toUpperCase();
}

async function loadNotifications() {
    const container = document.getElementById('notificationsList');
    
    // Show loading state
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading notifications...</p>
            </div>
        `;
    }
    
    try {
        const response = await apiRequest(API_ENDPOINTS.NOTIFICATIONS.GET_ALL, {
            method: 'GET'
        });

        if (response.success && response.data) {
            // Map backend response to frontend format
            allNotifications = (response.data || []).map(notif => ({
                id: notif.id,
                type: notif.type || 'SYSTEM',
                title: notif.title || 'Notification',
                message: notif.message || '',
                isRead: notif.isRead === true || String(notif.isRead).toLowerCase() === 'true',
                createdAt: notif.createdAt || new Date().toISOString(),
                actionUrl: notif.actionUrl || null,
                metadata: notif.metadata || null
            }));
            
            updateNotificationStats();
            // Apply current filter
            filterNotifications(currentFilter);
        } else {
            throw new Error(response.message || 'Failed to load notifications');
        }

    } catch (error) {
        console.error('Error loading notifications:', error);
        
        // Try to use mock data as fallback
        try {
            allNotifications = getMockNotifications();
            updateNotificationStats();
            // Apply current filter
            filterNotifications(currentFilter);
        } catch (mockError) {
            console.error('Error displaying mock notifications:', mockError);
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Error Loading Notifications</h3>
                        <p>${error.message || 'Failed to load notifications. Please try again later.'}</p>
                    </div>
                `;
            }
        }
    }
}

function getMockNotifications() {
    return [
        {
            id: '1',
            type: 'APPLICATION_UPDATE',
            title: 'New Application Received',
            message: 'John Doe has applied for the internship: Software Developer Intern',
            isRead: false,
            createdAt: new Date().toISOString(),
            actionUrl: 'applications.html',
            metadata: {
                applicationId: 'app1',
                studentName: 'John Doe'
            }
        },
        {
            id: '2',
            type: 'COMPANY_VERIFIED',
            title: 'Company Verified ✅',
            message: 'Congratulations! Your company "TechCorp" has been verified by the supervisor.',
            isRead: false,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
            actionUrl: 'profile.html'
        },
        {
            id: '3',
            type: 'APPLICATION_UPDATE',
            title: 'Internship Approved ✅',
            message: 'Your internship "Frontend Developer Intern" has been approved and is now active!',
            isRead: true,
            createdAt: new Date(Date.now() - 7200000).toISOString(),
            actionUrl: 'internships.html'
        }
    ];
}

function updateNotificationStats() {
    const unreadCount = allNotifications.filter(n => !n.isRead).length;
    
    const totalEl = document.getElementById('totalNotifications');
    const unreadEl = document.getElementById('unreadCount');
    
    if (totalEl) totalEl.textContent = allNotifications.length;
    if (unreadEl) unreadEl.textContent = unreadCount;
    
    // Update badge
    updateNotificationBadge();
}

function filterNotifications(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-filter="${filter}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    let filtered = allNotifications;
    
    if (filter === 'unread') {
        filtered = allNotifications.filter(n => !n.isRead);
    } else if (filter !== 'all') {
        // Map filter names to notification types
        const filterTypeMap = {
            'APPLICATION': ['APPLICATION_UPDATE', 'APPLICATION_ACCEPTED', 'APPLICATION_REJECTED', 'APPLICATION_SHORTLISTED'],
            'INTERNSHIP': ['NEW_INTERNSHIP_MATCH'],
            'EVALUATION': ['EVALUATION_REQUEST', 'EVALUATION_RECEIVED'],
            'SYSTEM': ['SYSTEM_ANNOUNCEMENT', 'PROFILE_INCOMPLETE', 'DEADLINE_REMINDER', 'COMPANY_VERIFIED']
        };
        
        const typesToFilter = filterTypeMap[filter] || [filter];
        filtered = allNotifications.filter(n => typesToFilter.includes(n.type));
    }
    
    displayNotifications(filtered);
}

function displayNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    
    if (!container) {
        console.error('Notifications container not found');
        return;
    }

    if (!notifications || notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <h3>No Notifications</h3>
                <p>${currentFilter === 'unread' ? 'You\'re all caught up!' : 'You don\'t have any notifications yet'}</p>
            </div>
        `;
        return;
    }

    try {
        container.innerHTML = notifications.map(notification => {
            // Ensure all required fields exist
            const notifId = notification.id || Math.random().toString(36).substr(2, 9);
            const notifType = notification.type || 'SYSTEM';
            const notifTitle = notification.title || 'Notification';
            const notifMessage = notification.message || '';
            const isRead = notification.isRead === true || notification.isRead === 'true';
            const createdAt = notification.createdAt || new Date().toISOString();
            const actionUrl = notification.actionUrl || null;
            
            const icon = getNotificationIcon(notifType);
            const timeAgo = getTimeAgo(createdAt);
            
            // Escape HTML to prevent XSS
            const escapeHtml = (text) => {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            };
            
            return `
                <div class="notification-item ${isRead ? '' : 'unread'}" onclick="openNotification('${notifId}')">
                    <div class="notification-icon ${icon.class}">
                        <i class="${icon.icon}"></i>
                    </div>
                    
                    <div class="notification-content">
                        <div class="notification-title">${escapeHtml(notifTitle)}</div>
                        <div class="notification-message">${escapeHtml(notifMessage)}</div>
                        <div class="notification-time">
                            <i class="fas fa-clock"></i>
                            <span>${timeAgo}</span>
                        </div>
                        
                        ${actionUrl ? `
                            <div class="notification-actions">
                                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); navigateToAction('${escapeHtml(actionUrl)}', '${notifId}')">
                                    <i class="fas fa-arrow-right"></i>
                                    View
                                </button>
                                ${!isRead ? `
                                    <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); markAsRead('${notifId}')">
                                        <i class="fas fa-check"></i>
                                        Mark as Read
                                    </button>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                    
                    ${isRead ? '' : '<div class="unread-badge"></div>'}
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error rendering notifications:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Displaying Notifications</h3>
                <p>An error occurred while displaying notifications. Please refresh the page.</p>
            </div>
        `;
    }
}

function getNotificationIcon(type) {
    const icons = {
        'APPLICATION_UPDATE': { icon: 'fas fa-file-alt', class: 'application' },
        'APPLICATION_ACCEPTED': { icon: 'fas fa-check-circle', class: 'success' },
        'APPLICATION_REJECTED': { icon: 'fas fa-times-circle', class: 'danger' },
        'APPLICATION_SHORTLISTED': { icon: 'fas fa-star', class: 'warning' },
        'NEW_INTERNSHIP_MATCH': { icon: 'fas fa-briefcase', class: 'info' },
        'EVALUATION_REQUEST': { icon: 'fas fa-star', class: 'warning' },
        'EVALUATION_RECEIVED': { icon: 'fas fa-star', class: 'warning' },
        'DEADLINE_REMINDER': { icon: 'fas fa-clock', class: 'warning' },
        'SYSTEM_ANNOUNCEMENT': { icon: 'fas fa-info-circle', class: 'info' },
        'COMPANY_VERIFIED': { icon: 'fas fa-check-circle', class: 'success' },
        'PROFILE_INCOMPLETE': { icon: 'fas fa-exclamation-triangle', class: 'warning' }
    };
    
    return icons[type] || { icon: 'fas fa-bell', class: 'info' };
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Just now';
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
        return formatDate(dateString);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function openNotification(notificationId) {
    const notification = allNotifications.find(n => n.id === notificationId);
    
    if (!notification) return;
    
    // Mark as read
    if (!notification.isRead) {
        markAsRead(notificationId);
    }
    
    const icon = getNotificationIcon(notification.type);
    const modal = document.getElementById('notificationModal');
    const details = document.getElementById('notificationDetails');
    
    if (!modal || !details) return;
    
    details.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <div class="notification-icon ${icon.class}" style="width: 80px; height: 80px; font-size: 2rem; margin: 0 auto 1rem;">
                <i class="${icon.icon}"></i>
            </div>
            <h3 style="margin-bottom: 0.5rem;">${notification.title}</h3>
            <p style="color: var(--text-secondary); font-size: 0.875rem;">
                ${getTimeAgo(notification.createdAt)}
            </p>
        </div>

        <div style="line-height: 1.8; color: var(--text-secondary); margin-bottom: 1.5rem;">
            ${notification.message}
        </div>

        ${notification.metadata ? `
            <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md);">
                <strong style="display: block; margin-bottom: 0.5rem;">Additional Details:</strong>
                <div style="display: grid; gap: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
                    ${Object.entries(notification.metadata).map(([key, value]) => `
                        <div><strong>${formatKey(key)}:</strong> ${value}</div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;
    
    const actionBtn = document.getElementById('notificationAction');
    if (notification.actionUrl && actionBtn) {
        actionBtn.style.display = 'block';
        actionBtn.onclick = () => {
            closeNotificationModal();
            navigateToAction(notification.actionUrl, notificationId);
        };
    } else if (actionBtn) {
        actionBtn.style.display = 'none';
    }
    
    modal.classList.add('active');
}

function closeNotificationModal() {
    const modal = document.getElementById('notificationModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function formatKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

async function markAsRead(notificationId) {
    try {
        // Update UI immediately
        const notification = allNotifications.find(n => n.id === notificationId);
        if (notification) {
            notification.isRead = true;
            updateNotificationStats();
            filterNotifications(currentFilter);
        }
        
        // Call API
        await apiRequest(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(notificationId), {
            method: 'PUT'
        });
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

async function markAllAsRead() {
    const unreadNotifications = allNotifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) {
        showAlert('All notifications are already read', 'info');
        return;
    }
    
    try {
        // Update UI immediately
        allNotifications.forEach(n => n.isRead = true);
        updateNotificationStats();
        filterNotifications(currentFilter);
        
        // Call API
        await apiRequest(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {
            method: 'PUT'
        });
        
        showAlert('All notifications marked as read', 'success');
        
    } catch (error) {
        console.error('Error marking all as read:', error);
        showAlert('Failed to mark all as read', 'error');
    }
}

async function clearAllNotifications() {
    if (allNotifications.length === 0) {
        showAlert('No notifications to clear', 'info');
        return;
    }
    
    if (!confirm('Are you sure you want to clear all notifications? This action cannot be undone.')) {
        return;
    }
    
    try {
        // Update UI immediately
        allNotifications = [];
        updateNotificationStats();
        displayNotifications(allNotifications);
        
        // Call API
        await apiRequest(API_ENDPOINTS.NOTIFICATIONS.CLEAR_ALL, {
            method: 'DELETE'
        });
        
        showAlert('All notifications cleared', 'success');
        
    } catch (error) {
        console.error('Error clearing notifications:', error);
        showAlert('Failed to clear notifications', 'error');
    }
}

function resolveNotificationActionUrl(rawUrl) {
    if (!rawUrl) return null;

    const url = rawUrl.trim();

    // Absolute URLs stay as-is
    if (/^https?:\/\//i.test(url)) {
        return url;
    }

    // Build base path for /trainup-frontend
    const origin = window.location.origin;
    const currentPath = window.location.pathname;
    let frontendBase = '/trainup-frontend/';

    const baseIndex = currentPath.indexOf('/trainup-frontend/');
    if (baseIndex !== -1) {
        frontendBase = currentPath.substring(0, baseIndex + '/trainup-frontend/'.length);
    }

    const normalize = (path) => path.replace(/^\/+/, '');

    // If URL starts with /pages/, prepend frontend base
    if (url.startsWith('/pages/')) {
        return frontendBase + normalize(url);
    }

    // If URL starts with pages/, prepend frontend base
    if (url.startsWith('pages/')) {
        return frontendBase + url;
    }

    // Relative URL (like 'my-applications.html') - resolve relative to current page
    if (!url.startsWith('/')) {
        const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
        return currentDir + '/' + url;
    }

    // Absolute path from root - prepend frontend base
    return frontendBase + normalize(url);
}

function navigateToAction(url, notificationId) {
    if (!url) return;
    
    markAsRead(notificationId);
    
    const resolvedUrl = resolveNotificationActionUrl(url);
    if (resolvedUrl) {
        window.location.href = resolvedUrl;
    }
}

// Update notification badge in navbar
function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
        const unreadCount = allNotifications.filter(n => !n.isRead).length;
        badge.textContent = unreadCount;
        badge.classList.toggle('hidden', unreadCount === 0);
    }
}

// Make functions available globally
window.filterNotifications = filterNotifications;
window.openNotification = openNotification;
window.closeNotificationModal = closeNotificationModal;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.clearAllNotifications = clearAllNotifications;
window.navigateToAction = navigateToAction;

