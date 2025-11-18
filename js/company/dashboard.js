// ===== TrainUp - Company Dashboard JavaScript =====

let dashboardRetryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and is a company
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

    // Load user info
    loadCompanyInfo(userData);

    // Load dashboard data
    await loadDashboardData();
});

/**
 * Load company info in sidebar
 */
function loadCompanyInfo(userData) {
    const profile = userData.profile;
    
    if (profile) {
        const companyName = profile.companyName;
        const initials = companyName.substring(0, 2).toUpperCase();
        
        document.getElementById('companyName').textContent = companyName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
        document.getElementById('welcomeName').textContent = companyName;
    }
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    let hasError = false;
    let errorMessage = '';
    
    try {
        // Load dashboard stats, internships, and applications in parallel
        // Use Promise.allSettled to handle partial failures gracefully
        const [dashboardResult, internshipsResult, applicationsResult] = await Promise.allSettled([
            apiRequest(API_ENDPOINTS.DASHBOARD.COMPANY, { method: 'GET' }),
            getMyInternships(),
            getCompanyApplications()
        ]);

        // Handle dashboard stats
        if (dashboardResult.status === 'fulfilled' && dashboardResult.value.success && dashboardResult.value.data) {
            const stats = dashboardResult.value.data;
            
            if (stats.internships) {
                document.getElementById('totalInternships').textContent = stats.internships.totalInternships || 0;
                document.getElementById('activeInternships').textContent = stats.internships.activeInternships || 0;
            }
            
            if (stats.applications) {
                document.getElementById('totalApplications').textContent = stats.applications.totalApplications || 0;
                document.getElementById('pendingApplications').textContent = stats.applications.pendingReview || 0;
            }
        } else {
            // If dashboard API fails, try to get stats from internships and applications
            console.warn('Dashboard API failed, calculating stats from individual endpoints');
            hasError = true;
            
            // Calculate stats from internships if available
            if (internshipsResult.status === 'fulfilled' && internshipsResult.value.success) {
                const internships = internshipsResult.value.data || [];
                document.getElementById('totalInternships').textContent = internships.length;
                document.getElementById('activeInternships').textContent = internships.filter(i => i.status === 'ACTIVE').length;
            }
            
            // Calculate stats from applications if available
            if (applicationsResult.status === 'fulfilled' && applicationsResult.value.success) {
                const applications = applicationsResult.value.data || [];
                document.getElementById('totalApplications').textContent = applications.length;
                document.getElementById('pendingApplications').textContent = applications.filter(app => 
                    app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW'
                ).length;
            }
        }

        // Display recent internships
        if (internshipsResult.status === 'fulfilled' && internshipsResult.value.success) {
            const internships = internshipsResult.value.data || [];
            displayActiveInternships(internships.filter(i => i.status === 'ACTIVE').slice(0, 3));
        } else if (internshipsResult.status === 'rejected') {
            console.error('Failed to load internships:', internshipsResult.reason);
            hasError = true;
            const container = document.getElementById('activeInternshipsList');
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Error Loading Internships</h3>
                        <p>Please refresh the page to try again</p>
                    </div>
                `;
            }
        }

        // Display recent applications
        if (applicationsResult.status === 'fulfilled' && applicationsResult.value.success) {
            const applications = applicationsResult.value.data || [];
            displayRecentApplications(applications.slice(0, 5));
        } else if (applicationsResult.status === 'rejected') {
            console.error('Failed to load applications:', applicationsResult.reason);
            hasError = true;
            const container = document.getElementById('recentApplications');
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Error Loading Applications</h3>
                        <p>Please refresh the page to try again</p>
                    </div>
                `;
            }
        }
        
        // Check for 401 errors
        const allErrors = [dashboardResult, internshipsResult, applicationsResult]
            .filter(r => r.status === 'rejected')
            .map(r => r.reason);
        
        const has401 = allErrors.some(err => err.status === 401 || (err.message && err.message.includes('401')));
        if (has401) {
            showAlert('Your session has expired. Redirecting to login...', 'error');
            setTimeout(() => {
                logout();
            }, 2000);
            return;
        }
        
        // If we have partial success, don't show error
        if (!hasError || (internshipsResult.status === 'fulfilled' || applicationsResult.status === 'fulfilled')) {
            dashboardRetryCount = 0;
            if (hasError) {
                // Show a warning but not an error since we have some data
                showAlert('Some data could not be loaded. Please refresh if needed.', 'warning');
            }
            return;
        }
        
        // All requests failed
        throw new Error('All dashboard requests failed');
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        
        // Handle 401 errors - redirect to login
        if (error.message && error.message.includes('401') || error.status === 401) {
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
            showAlert('Failed to load dashboard data after multiple attempts. Please check your connection and refresh the page.', 'error');
            dashboardRetryCount = 0;
        }
    }
}


/**
 * Display recent applications
 */
function displayRecentApplications(applications) {
    const container = document.getElementById('recentApplications');

    if (applications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No Applications Yet</h3>
                <p>Students will see your internships once you post them</p>
                <a href="create-internship.html" class="btn btn-primary">Post Your First Internship</a>
            </div>
        `;
        return;
    }

    container.innerHTML = applications.map(app => `
        <div class="internship-card">
            <div class="internship-header">
                <div class="company-logo">
                    ${app.student?.firstName ? app.student.firstName.charAt(0) : 'S'}
                </div>
                <div class="internship-title">
                    <h3>${app.student?.firstName || ''} ${app.student?.lastName || ''}</h3>
                    <p class="company-name">${app.student?.university || 'University'} - ${app.student?.major || 'Major'}</p>
                </div>
                <span class="status-badge ${app.status.toLowerCase().replace('_', '-')}">
                    ${formatStatus(app.status)}
                </span>
            </div>

            <div class="internship-meta">
                <div class="meta-item">
                    <i class="fas fa-briefcase"></i>
                    <span>${app.internship?.title || 'Internship'}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>Applied ${formatDate(app.appliedDate)}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-id-card"></i>
                    <span>${app.student?.studentId || 'N/A'}</span>
                </div>
            </div>

            <div class="internship-footer">
                <button class="btn btn-outline btn-sm" onclick="viewApplication('${app.id}')">
                    <i class="fas fa-eye"></i>
                    Review Application
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Display active internships
 */
function displayActiveInternships(internships) {
    const container = document.getElementById('activeInternshipsList');

    if (internships.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-briefcase"></i>
                <h3>No Active Internships</h3>
                <p>Post an internship to start receiving applications</p>
                <a href="create-internship.html" class="btn btn-primary">Post Internship</a>
            </div>
        `;
        return;
    }

    container.innerHTML = internships.map(internship => `
        <div class="internship-card">
            <div class="internship-header">
                <div class="company-logo">
                    <i class="fas fa-briefcase"></i>
                </div>
                <div class="internship-title">
                    <h3>${internship.title || 'Untitled Internship'}</h3>
                    <p class="company-name">Posted ${formatDate(internship.createdAt || internship.postedDate)}</p>
                </div>
                <span class="status-badge active">Active</span>
            </div>

            <div class="internship-meta">
                <div class="meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${internship.location || 'N/A'}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${internship.duration || 0} months</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-eye"></i>
                    <span>${internship.views || 0} views</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-users"></i>
                    <span>${internship.applicationsCount || 0} applicants</span>
                </div>
            </div>

            <div class="internship-footer">
                <div class="internship-actions">
                    <button class="btn btn-outline btn-sm" onclick="editInternship('${internship.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="viewInternshipApplications('${internship.id}')">
                        <i class="fas fa-users"></i>
                        View Applications
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Format status for display
 */
function formatStatus(status) {
    const statusMap = {
        'SUBMITTED': 'Submitted',
        'UNDER_REVIEW': 'Under Review',
        'SHORTLISTED': 'Shortlisted',
        'ACCEPTED': 'Accepted',
        'REJECTED': 'Rejected',
        'WITHDRAWN': 'Withdrawn'
    };
    return statusMap[status] || status;
}

/**
 * View application details
 */
function viewApplication(applicationId) {
    window.location.href = `application-details.html?id=${applicationId}`;
}

/**
 * Edit internship
 */
function editInternship(internshipId) {
    window.location.href = `edit-internship.html?id=${internshipId}`;
}

/**
 * View internship applications
 */
function viewInternshipApplications(internshipId) {
    window.location.href = `applications.html?internshipId=${internshipId}`;
}

/**
 * Refresh dashboard manually
 */
async function refreshCompanyDashboard() {
    const button = document.getElementById('companyRefreshBtn');
    const originalLabel = button ? button.innerHTML : null;

    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
    }

    showAlert('Refreshing dashboard...', 'info');

    try {
        await loadDashboardData();
        showAlert('Dashboard updated successfully!', 'success');
    } catch (error) {
        console.error('Error refreshing company dashboard:', error);
        showAlert('Unable to refresh dashboard. Please try again.', 'error');
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalLabel || '<i class="fas fa-sync-alt"></i> Refresh';
        }
    }
}

window.refreshCompanyDashboard = refreshCompanyDashboard;
