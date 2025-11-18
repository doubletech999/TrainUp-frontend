// ===== TrainUp - Student Dashboard JavaScript =====

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
    if (userData.userType !== 'STUDENT') {
        showAlert('Access denied. Students only.', 'error');
        setTimeout(() => logout(), 2000);
        return;
    }

    // Load student info
    loadStudentInfo(userData);

    // Check profile completion
    checkProfileCompletion(userData);

    // Load dashboard data
    await loadDashboardData();
    
    // ❌ DISABLED: Notifications (backend endpoints not ready)
    // checkNotifications();
    // setInterval(checkNotifications, 60000);
});

/**
 * Load student info
 */
function loadStudentInfo(userData) {
    const profile = userData.profile;
    
    if (profile) {
        const fullName = `${profile.firstName} ${profile.lastName}`;
        const initials = getInitials(profile.firstName, profile.lastName);
        
        document.getElementById('studentName').textContent = fullName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
        document.getElementById('welcomeName').textContent = profile.firstName;
    }
}

/**
 * Check profile completion
 */
function checkProfileCompletion(userData) {
    const profile = userData.profile;
    
    if (!profile) return;

    const requiredFields = {
        'firstName': 'First Name',
        'lastName': 'Last Name',
        'studentId': 'Student ID',
        'university': 'University',
        'major': 'Major',
        'yearOfStudy': 'Year of Study',
        'phoneNumber': 'Phone Number',
        'bio': 'Bio/Description',
        'skills': 'Skills',
        'cvUrl': 'CV/Resume'
    };

    let completedFields = 0;
    const missingFields = [];

    for (const [field, label] of Object.entries(requiredFields)) {
        if (profile[field] && 
            (Array.isArray(profile[field]) ? profile[field].length > 0 : true)) {
            completedFields++;
        } else {
            missingFields.push(label);
        }
    }

    const completionPercent = Math.round((completedFields / Object.keys(requiredFields).length) * 100);

    if (completionPercent < 100) {
        document.getElementById('profileCompletionSection').style.display = 'block';
        document.getElementById('profilePercent').textContent = completionPercent;
        document.getElementById('profileProgress').style.width = completionPercent + '%';
        
        if (missingFields.length > 0) {
            document.getElementById('missingFields').innerHTML = `
                <div style="opacity: 0.9;">Missing fields:</div>
                ${missingFields.map(field => `
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <i class="fas fa-circle" style="font-size: 6px;"></i>
                        <span>${field}</span>
                    </div>
                `).join('')}
            `;
        }

        // Show profile alert
        if (completionPercent < 50) {
            document.getElementById('profileAlert').innerHTML = `
                <div class="alert warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <div>
                        <strong>Complete Your Profile</strong>
                        <p>Your profile is only ${completionPercent}% complete. Complete it to increase your chances!</p>
                    </div>
                    <a href="edit-profile.html" class="btn btn-sm btn-outline">
                        Complete Now
                    </a>
                </div>
            `;
            document.getElementById('profileAlert').style.display = 'block';
        }
    }
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    console.log('🔍 Loading dashboard data...');
    console.log('Token exists:', !!localStorage.getItem('token'));
    
    try {
        // Load all data in parallel
        console.log('📡 Fetching applications...');
        const [applicationsResponse, internshipsResponse] = await Promise.all([
            getMyApplications(),
            getAvailableInternships()
        ]);

        console.log('Applications response:', applicationsResponse);
        console.log('Internships response:', internshipsResponse);

        // Update stats
        if (applicationsResponse && applicationsResponse.success) {
            const applications = applicationsResponse.data || [];
            console.log('✅ Applications loaded:', applications.length);
            updateApplicationStats(applications);
            displayRecentApplications(applications.slice(0, 3));
        } else {
            console.warn('⚠️ Applications response not successful');
        }

        if (internshipsResponse && internshipsResponse.success) {
            const internships = internshipsResponse.data || [];
            console.log('✅ Internships loaded:', internships.length);
            // ✅ Filter only ACTIVE internships on frontend
            const activeInternships = internships.filter(i => i.status === 'ACTIVE');
            document.getElementById('availableInternships').textContent = activeInternships.length;
            displayRecommendedInternships(activeInternships.slice(0, 3));
        } else {
            console.warn('⚠️ Internships response not successful');
        }
        
        // Reset retry count on success
        dashboardRetryCount = 0;

    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack
        });
        
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
            let errorMessage = 'Failed to load dashboard data after multiple attempts. ';
            if (error.message.includes('Failed to fetch')) {
                errorMessage += 'Backend server may not be running. Please check if it\'s running on http://localhost:8080';
            } else {
                errorMessage += 'Please check your connection and try again.';
            }
            
            showAlert(errorMessage, 'error');
            
            // Reset retry count after showing final error
            dashboardRetryCount = 0;
        }
    }
}

/**
 * Get my applications
 */
async function getMyApplications() {
    return await apiRequest('/applications/my-applications', {
        method: 'GET'
    });
}

/**
 * Get available internships - ✅ FIXED ENDPOINT
 */
async function getAvailableInternships() {
    return await apiRequest('/internships', {  // Changed from /internships/active
        method: 'GET'
    });
}

/**
 * Update application stats - ✅ FIXED STATUS MAPPING
 */
function updateApplicationStats(applications) {
    const total = applications.length;
    // Changed from PENDING to SUBMITTED and UNDER_REVIEW
    const pending = applications.filter(app => 
        app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW'
    ).length;
    const accepted = applications.filter(app => app.status === 'ACCEPTED').length;

    document.getElementById('totalApplications').textContent = total;
    document.getElementById('pendingApplications').textContent = pending;
    document.getElementById('acceptedApplications').textContent = accepted;
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
                <p>Start applying to internships to see them here</p>
                <a href="internships.html" class="btn btn-primary">
                    <i class="fas fa-search"></i>
                    Browse Internships
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = applications.map(application => {
        const internship = application.internship || {};
        const company = internship.company || {};
        const companyInitials = company.name ? company.name.substring(0, 2).toUpperCase() : 'C';

        return `
            <div class="internship-card">
                <div class="internship-header">
                    <div class="company-logo">${companyInitials}</div>
                    <div class="internship-title">
                        <h3>${internship.title || 'Internship'}</h3>
                        <p class="company-name">${company.name || 'Company'}</p>
                    </div>
                    <span class="status-badge ${application.status.toLowerCase()}">
                        ${formatStatus(application.status)}
                    </span>
                </div>

                <div class="internship-meta">
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>Applied ${formatDate(application.appliedDate)}</span>
                    </div>
                    ${application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW' ? `
                        <div class="meta-item">
                            <i class="fas fa-clock"></i>
                            <span>Under Review</span>
                        </div>
                    ` : ''}
                    ${application.status === 'ACCEPTED' ? `
                        <div class="meta-item">
                            <i class="fas fa-check-circle"></i>
                            <span>Congratulations!</span>
                        </div>
                    ` : ''}
                </div>

                <div class="internship-footer">
                    <a href="application-details.html?id=${application.id}" class="btn btn-outline btn-sm">
                        <i class="fas fa-eye"></i>
                        View Details
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Display recommended internships
 */
function displayRecommendedInternships(internships) {
    const container = document.getElementById('recommendedInternships');

    if (internships.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-briefcase"></i>
                <h3>No Internships Available</h3>
                <p>Check back later for new opportunities</p>
            </div>
        `;
        return;
    }

    container.innerHTML = internships.map(internship => {
        const company = internship.company || {};
        const companyInitials = company.name ? company.name.substring(0, 2).toUpperCase() : 'C';

        return `
            <div class="internship-card">
                <div class="internship-header">
                    <div class="company-logo">${companyInitials}</div>
                    <div class="internship-title">
                        <h3>${internship.title}</h3>
                        <p class="company-name">${company.name || 'Company'}</p>
                    </div>
                </div>

                <p style="margin: 1rem 0; color: var(--text-secondary); line-height: 1.6;">
                    ${internship.description.substring(0, 150)}${internship.description.length > 150 ? '...' : ''}
                </p>

                <div class="internship-meta">
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${internship.location}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-clock"></i>
                        <span>${internship.duration} months</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>Deadline: ${formatDate(internship.applicationDeadline)}</span>
                    </div>
                </div>

                ${internship.skills && internship.skills.length > 0 ? `
                    <div class="internship-tags">
                        ${internship.skills.slice(0, 4).map(skill =>
                            `<span class="tag">${skill}</span>`
                        ).join('')}
                    </div>
                ` : ''}

                <div class="internship-footer">
                    <div class="internship-actions">
                        <a href="internship-details.html?id=${internship.id}" class="btn btn-outline btn-sm">
                            <i class="fas fa-eye"></i>
                            View Details
                        </a>
                        <button class="btn btn-primary btn-sm" onclick="quickApply('${internship.id}')">
                            <i class="fas fa-paper-plane"></i>
                            Quick Apply
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Quick apply to internship
 */
async function quickApply(internshipId) {
    window.location.href = `internship-details.html?id=${internshipId}&apply=true`;
}

/**
 * Format application status
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
 * Check for new notifications - ❌ DISABLED (No backend support yet)
 */
async function checkNotifications() {
    // Temporarily disabled - backend notification endpoints not implemented
    console.log('Notifications feature disabled - waiting for backend implementation');
    updateNotificationBadge(0);
    return;
}

/**
 * Update notification badge in UI
 */
function updateNotificationBadge(count) {
    const notificationLink = document.querySelector('a[href="notifications.html"]');

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
                background: var(--danger-color);
                color: white;
                font-size: 0.75rem;
                font-weight: 700;
                padding: 0.125rem 0.5rem;
                border-radius: 999px;
                min-width: 20px;
                text-align: center;
            `;
            notificationLink.style.position = 'relative';
            notificationLink.appendChild(badge);
        }

        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    if (count > 0) {
        document.title = `(${count}) Dashboard - TrainUp`;
    } else {
        document.title = 'Dashboard - TrainUp';
    }
}

/**
 * Manual dashboard refresh
 */
async function refreshStudentDashboard() {
    const button = document.getElementById('studentRefreshBtn');
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
        console.error('Error refreshing student dashboard:', error);
        showAlert('Unable to refresh dashboard. Please try again.', 'error');
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalLabel || '<i class="fas fa-sync-alt"></i> Refresh';
        }
    }
}

window.refreshStudentDashboard = refreshStudentDashboard;
