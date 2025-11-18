// ===== TrainUp - Admin Dashboard JavaScript =====

let dashboardRetryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '../../pages/auth/login.html';
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
        // Load dashboard stats from single endpoint
        const response = await apiRequest(API_ENDPOINTS.DASHBOARD.ADMIN, {
            method: 'GET'
        });

        if (response.success && response.data) {
            const stats = response.data;

            // Update users stats
            if (stats.users) {
                document.getElementById('totalUsers').textContent = stats.users.totalUsers || 0;
                document.getElementById('totalStudents').textContent = stats.users.totalStudents || 0;
                document.getElementById('totalCompanies').textContent = stats.users.totalCompanies || 0;
                document.getElementById('totalSupervisors').textContent = stats.users.totalSupervisors || 0;
            }

            // Update internships stats
            if (stats.internships) {
                document.getElementById('totalInternships').textContent = stats.internships.totalInternships || 0;
                document.getElementById('pendingInternships').textContent = stats.internships.pendingReview || 0;
                document.getElementById('activeInternships').textContent = stats.internships.activeInternships || 0;
            }

            // Update applications stats
            if (stats.applications) {
                document.getElementById('totalApplications').textContent = stats.applications.totalApplications || 0;
            }
        } else {
            throw new Error(response.message || 'Failed to load dashboard data');
        }
        
        // Reset retry count on success
        dashboardRetryCount = 0;

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        
        // Handle 401 errors - redirect to login
        if (error.message.includes('401') || error.status === 401) {
            showAlert('Your session has expired. Redirecting to login...', 'error');
            setTimeout(() => {
                logout();
            }, 2000);
            return;
        }
        
        // Retry logic
        if (dashboardRetryCount < MAX_RETRIES) {
            dashboardRetryCount++;
            const retryMessage = `Failed to load dashboard data. Retrying... (${dashboardRetryCount}/${MAX_RETRIES})`;
            showAlert(retryMessage, 'warning');
            
            // Retry after delay
            setTimeout(() => {
                loadDashboardData();
            }, RETRY_DELAY);
        } else {
            // Max retries reached
            showAlert('Failed to load dashboard data after multiple attempts. Please check your connection.', 'error');
            dashboardRetryCount = 0;
        }
    }
}


/**
 * Load recent activities
 */
async function loadActivities() {
    const container = document.getElementById('recentActivities');

    try {
        // Get activities from dashboard stats
        const response = await apiRequest(API_ENDPOINTS.DASHBOARD.ADMIN, {
            method: 'GET'
        });

        if (response.success && response.data) {
            const stats = response.data;
            
            // Create activities from stats
            const activities = [];
            
            if (stats.users) {
                if (stats.users.totalUsers > 0) {
                    activities.push({
                        type: 'USER_REGISTERED',
                        title: 'Total Users',
                        description: `${stats.users.totalUsers} total users in the system`,
                        createdAt: new Date().toISOString()
                    });
                }
                if (stats.users.pendingVerification > 0) {
                    activities.push({
                        type: 'USER_VERIFIED',
                        title: 'Pending Verifications',
                        description: `${stats.users.pendingVerification} companies pending verification`,
                        createdAt: new Date().toISOString()
                    });
                }
            }
            
            if (stats.internships) {
                if (stats.internships.pendingReview > 0) {
                    activities.push({
                        type: 'INTERNSHIP_POSTED',
                        title: 'Pending Internships',
                        description: `${stats.internships.pendingReview} internships pending review`,
                        createdAt: new Date().toISOString()
                    });
                }
                if (stats.internships.activeInternships > 0) {
                    activities.push({
                        type: 'INTERNSHIP_APPROVED',
                        title: 'Active Internships',
                        description: `${stats.internships.activeInternships} active internships`,
                        createdAt: new Date().toISOString()
                    });
                }
            }
            
            if (stats.applications) {
                if (stats.applications.totalApplications > 0) {
                    activities.push({
                        type: 'APPLICATION_SUBMITTED',
                        title: 'Total Applications',
                        description: `${stats.applications.totalApplications} total applications`,
                        createdAt: new Date().toISOString()
                    });
                }
            }

            if (activities.length > 0) {
                displayActivities(activities);
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>No Recent Activities</h3>
                        <p>System activities will appear here</p>
                    </div>
                `;
            }
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
        // Get pending actions from dashboard stats
        const response = await apiRequest(API_ENDPOINTS.DASHBOARD.ADMIN, {
            method: 'GET'
        });

        if (response.success && response.data) {
            const stats = response.data;
            const pendingActions = [];
            
            // Check for pending company verifications
            if (stats.users && stats.users.pendingVerification > 0) {
                pendingActions.push({
                    id: 'pending-companies',
                    type: 'COMPANY_VERIFICATION',
                    title: 'Companies Pending Verification',
                    description: `${stats.users.pendingVerification} companies are waiting for verification`
                });
            }
            
            // Check for pending internships
            if (stats.internships && stats.internships.pendingReview > 0) {
                pendingActions.push({
                    id: 'pending-internships',
                    type: 'INTERNSHIP_REVIEW',
                    title: 'Internships Pending Review',
                    description: `${stats.internships.pendingReview} internships are waiting for review`
                });
            }

            if (pendingActions.length > 0) {
                displayPendingActions(pendingActions);
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <h3>All Caught Up!</h3>
                        <p>No pending actions at the moment</p>
                    </div>
                `;
            }
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
async function refreshAdminDashboard() {
    const button = document.getElementById('adminRefreshBtn');
    const originalLabel = button ? button.innerHTML : null;

    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
    }

    showAlert('Refreshing dashboard...', 'info');

    try {
        await Promise.all([
            loadDashboardData(),
            loadActivities(),
            loadPendingActions()
        ]);

        showAlert('Dashboard refreshed successfully!', 'success');
    } catch (error) {
        console.error('Error refreshing admin dashboard:', error);
        showAlert('Unable to refresh dashboard. Please try again.', 'error');
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalLabel || '<i class="fas fa-sync-alt"></i> Refresh';
        }
    }
}

window.refreshAdminDashboard = refreshAdminDashboard;

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

