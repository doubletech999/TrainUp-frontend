// ===== TrainUp - Admin Dashboard JavaScript =====

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '../../login.html';
        return;
    }

    const userData = getUserData();
    if (userData.userType !== 'ADMIN') {
        showAlert('Access denied. Administrators only.', 'error');
        setTimeout(() => logout(), 2000);
        return;
    }

    // Load admin info
    loadAdminInfo(userData);

    // Load dashboard data
    await loadDashboardData();

    // Load activities
    await loadActivities();

    // Load pending actions
    await loadPendingActions();
});

/**
 * Load admin info
 */
function loadAdminInfo(userData) {
    const profile = userData.profile;

    if (profile) {
        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Administrator';
        const initials = getInitials(profile.firstName || 'A', profile.lastName || 'D');

        document.getElementById('userName').textContent = fullName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

/**
 * Get initials from name
 */
function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'AD';
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        // Load stats in parallel
        const [usersStats, internshipsStats, applicationsStats] = await Promise.all([
            getUsersStats(),
            getInternshipsStats(),
            getApplicationsStats()
        ]);

        // Update users stats
        if (usersStats.success) {
            const data = usersStats.data || {};
            document.getElementById('totalUsers').textContent = data.total || 0;
            document.getElementById('totalStudents').textContent = data.students || 0;
            document.getElementById('totalCompanies').textContent = data.companies || 0;
            document.getElementById('totalSupervisors').textContent = data.supervisors || 0;
        }

        // Update internships stats
        if (internshipsStats.success) {
            const data = internshipsStats.data || {};
            document.getElementById('totalInternships').textContent = data.total || 0;
            document.getElementById('pendingInternships').textContent = data.pending || 0;
            document.getElementById('activeInternships').textContent = data.active || 0;
        }

        // Update applications stats
        if (applicationsStats.success) {
            const data = applicationsStats.data || {};
            document.getElementById('totalApplications').textContent = data.total || 0;
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Failed to load dashboard data. Please refresh the page.', 'error');
    }
}

/**
 * Get users statistics
 */
async function getUsersStats() {
    return await apiRequest('/admin/stats/users', {
        method: 'GET'
    });
}

/**
 * Get internships statistics
 */
async function getInternshipsStats() {
    return await apiRequest('/admin/stats/internships', {
        method: 'GET'
    });
}

/**
 * Get applications statistics
 */
async function getApplicationsStats() {
    return await apiRequest('/admin/stats/applications', {
        method: 'GET'
    });
}

/**
 * Load recent activities
 */
async function loadActivities() {
    const container = document.getElementById('recentActivities');

    try {
        const response = await apiRequest('/admin/activities/recent?limit=10', {
            method: 'GET'
        });

        if (response.success && response.data && response.data.length > 0) {
            displayActivities(response.data);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No Recent Activities</h3>
                    <p>System activities will appear here</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading activities:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load activities</p>
            </div>
        `;
    }
}

/**
 * Display activities
 */
function displayActivities(activities) {
    const container = document.getElementById('recentActivities');

    container.innerHTML = activities.map(activity => {
        const icon = getActivityIcon(activity.type);
        const color = getActivityColor(activity.type);

        return `
            <div class="activity-item">
                <div class="activity-icon" style="background: ${color};">
                    <i class="${icon}" style="color: white;"></i>
                </div>
                <div class="activity-content">
                    <strong>${activity.title || 'Activity'}</strong>
                    <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">
                        ${activity.description || ''}
                    </p>
                    <div class="activity-time">
                        ${formatDate(activity.createdAt)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Get activity icon
 */
function getActivityIcon(type) {
    const icons = {
        'USER_REGISTERED': 'fas fa-user-plus',
        'COMPANY_REGISTERED': 'fas fa-building',
        'INTERNSHIP_POSTED': 'fas fa-briefcase',
        'APPLICATION_SUBMITTED': 'fas fa-file-alt',
        'INTERNSHIP_APPROVED': 'fas fa-check-circle',
        'USER_VERIFIED': 'fas fa-user-check',
        'SYSTEM': 'fas fa-cog'
    };
    return icons[type] || 'fas fa-info-circle';
}

/**
 * Get activity color
 */
function getActivityColor(type) {
    const colors = {
        'USER_REGISTERED': '#3b82f6',
        'COMPANY_REGISTERED': '#8b5cf6',
        'INTERNSHIP_POSTED': '#10b981',
        'APPLICATION_SUBMITTED': '#f59e0b',
        'INTERNSHIP_APPROVED': '#22c55e',
        'USER_VERIFIED': '#06b6d4',
        'SYSTEM': '#6b7280'
    };
    return colors[type] || '#6b7280';
}

/**
 * Load pending actions
 */
async function loadPendingActions() {
    const container = document.getElementById('pendingActions');

    try {
        const response = await apiRequest('/admin/pending-actions', {
            method: 'GET'
        });

        if (response.success && response.data && response.data.length > 0) {
            displayPendingActions(response.data);
        } else {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <h3>All Caught Up!</h3>
                    <p>No pending actions at the moment</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading pending actions:', error);
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Failed to load pending actions</p>
            </div>
        `;
    }
}

/**
 * Display pending actions
 */
function displayPendingActions(actions) {
    const container = document.getElementById('pendingActions');

    container.innerHTML = actions.map(action => {
        return `
            <div class="pending-item">
                <div class="pending-info">
                    <strong>${action.title}</strong>
                    <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">
                        ${action.description}
                    </p>
                </div>
                <div class="pending-actions">
                    <button class="btn btn-sm btn-primary" onclick="handlePendingAction('${action.id}', '${action.type}')">
                        <i class="fas fa-eye"></i>
                        Review
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Handle pending action
 */
function handlePendingAction(id, type) {
    // Redirect based on action type
    const routes = {
        'COMPANY_VERIFICATION': 'companies.html',
        'INTERNSHIP_REVIEW': 'internships.html',
        'USER_VERIFICATION': 'users.html'
    };

    const route = routes[type] || 'users.html';
    window.location.href = `${route}?action=${id}`;
}

/**
 * Refresh dashboard
 */
async function refreshDashboard() {
    showAlert('Refreshing dashboard...', 'info');

    await Promise.all([
        loadDashboardData(),
        loadActivities(),
        loadPendingActions()
    ]);

    showAlert('Dashboard refreshed successfully!', 'success');
}

/**
 * Format date
 */
function formatDate(date) {
    if (!date) return '';

    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    // Less than 1 minute
    if (diff < 60000) {
        return 'Just now';
    }

    // Less than 1 hour
    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }

    // Less than 24 hours
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }

    // Less than 7 days
    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // Format as date
    return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
