// ===== TrainUp - Student Dashboard JavaScript =====

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '../../login.html';
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
    
    // Start notification checks
    checkNotifications();
    setInterval(checkNotifications, 60000); // Check every minute
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
    try {
        // Load all data in parallel
        const [applicationsResponse, internshipsResponse] = await Promise.all([
            getMyApplications(),
            getAvailableInternships()
        ]);

        // Update stats
        if (applicationsResponse.success) {
            const applications = applicationsResponse.data || [];
            updateApplicationStats(applications);
            displayRecentApplications(applications.slice(0, 3));
        }

        if (internshipsResponse.success) {
            const internships = internshipsResponse.data || [];
            document.getElementById('availableInternships').textContent = internships.length;
            displayRecommendedInternships(internships.slice(0, 3));
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Failed to load dashboard data. Please refresh the page.', 'error');
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
 * Get available internships
 */
async function getAvailableInternships() {
    return await apiRequest('/internships/active', {
        method: 'GET'
    });
}

/**
 * Update application stats
 */
function updateApplicationStats(applications) {
    const total = applications.length;
    const pending = applications.filter(app => app.status === 'PENDING').length;
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
                        <span>Applied ${formatDate(application.appliedAt)}</span>
                    </div>
                    ${application.status === 'PENDING' ? `
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
                    ${internship.featured ? `
                        <span class="badge featured">
                            <i class="fas fa-star"></i>
                            Featured
                        </span>
                    ` : ''}
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
    // Redirect to internship details page to apply
    window.location.href = `internship-details.html?id=${internshipId}&apply=true`;
}

/**
 * Format application status
 */
function formatStatus(status) {
    const statusMap = {
        'PENDING': 'Pending',
        'UNDER_REVIEW': 'Under Review',
        'ACCEPTED': 'Accepted',
        'REJECTED': 'Rejected',
        'WITHDRAWN': 'Withdrawn'
    };
    return statusMap[status] || status;
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
            updateNotificationBadge(count);

            // If there are new notifications, fetch recent ones for preview
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
 * Show notification preview (optional - can be displayed in a dropdown)
 */
function showNotificationPreview(notifications) {
    // This function can be used to display notifications in a dropdown menu
    // Implementation depends on your UI design
    console.log('Recent notifications:', notifications);
}

/**
 * Update notification badge in UI
 */
function updateNotificationBadge(count) {
    // Update sidebar notification badge
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
                animation: pulse 2s infinite;
            `;
            notificationLink.style.position = 'relative';
            notificationLink.appendChild(badge);
        }

        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'block';
                // Add pulse animation for new notifications
                badge.style.animation = 'pulse 2s infinite';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Update header notification icon if exists
    const headerNotificationIcon = document.querySelector('.header-notifications');
    if (headerNotificationIcon) {
        updateHeaderNotificationBadge(headerNotificationIcon, count);
    }

    // Update page title with notification count
    if (count > 0) {
        document.title = `(${count}) Dashboard - TrainUp`;
    } else {
        document.title = 'Dashboard - TrainUp';
    }
}

/**
 * Update header notification badge
 */
function updateHeaderNotificationBadge(headerElement, count) {
    let headerBadge = headerElement.querySelector('.notification-count');

    if (!headerBadge && count > 0) {
        headerBadge = document.createElement('span');
        headerBadge.className = 'notification-count';
        headerBadge.style.cssText = `
            position: absolute;
            top: -5px;
            right: -5px;
            background: var(--danger-color);
            color: white;
            font-size: 0.65rem;
            font-weight: 700;
            padding: 0.125rem 0.375rem;
            border-radius: 999px;
            min-width: 18px;
            text-align: center;
        `;
        headerElement.style.position = 'relative';
        headerElement.appendChild(headerBadge);
    }

    if (headerBadge) {
        if (count > 0) {
            headerBadge.textContent = count > 99 ? '99+' : count;
            headerBadge.style.display = 'block';
        } else {
            headerBadge.style.display = 'none';
        }
    }
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
            showAlert('All notifications marked as read', 'success');
        }
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        showAlert('Failed to mark notifications as read', 'error');
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
        min-width: 300px;
        max-width: 400px;
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
        border-left: 4px solid var(--primary-color);
    `;

    toast.innerHTML = `
        <div style="display: flex; align-items: start; gap: 1rem;">
            <i class="fas fa-bell" style="color: var(--primary-color); margin-top: 0.25rem;"></i>
            <div style="flex: 1;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 0.95rem; color: var(--text-primary);">
                    ${notification.title || 'New Notification'}
                </h4>
                <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5;">
                    ${notification.message}
                </p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()"
                    style="background: none; border: none; cursor: pointer; color: var(--text-secondary); font-size: 1.25rem; padding: 0;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
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
`;
document.head.appendChild(style);