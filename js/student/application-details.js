// ===== TrainUp - Application Details JavaScript =====

let currentApplication = null;

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

    // Get application ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const applicationId = urlParams.get('id');

    if (!applicationId) {
        showAlert('Invalid application ID', 'error');
        setTimeout(() => window.location.href = 'my-applications.html', 2000);
        return;
    }

    // Load application details
    await loadApplicationDetails(applicationId);
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
    }
}

/**
 * Load application details
 */
async function loadApplicationDetails(applicationId) {
    try {
        // Get all applications and find the one with matching ID
        const response = await getMyApplications();

        if (response.success && response.data) {
            const applications = Array.isArray(response.data) ? response.data : [];
            currentApplication = applications.find(app => app.id === applicationId);

            if (!currentApplication) {
                throw new Error('Application not found');
            }

            // Display application
            displayApplication(currentApplication);
            
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('applicationDetails').style.display = 'block';
        } else {
            throw new Error(response.message || 'Failed to load application');
        }

    } catch (error) {
        console.error('Error loading application:', error);
        document.getElementById('loadingState').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Application</h3>
                <p>${error.message}</p>
                <a href="my-applications.html" class="btn btn-primary">
                    Back to Applications
                </a>
            </div>
        `;
    }
}

/**
 * Display application details
 */
function displayApplication(application) {
    const internship = application.internship || {};
    const company = internship.company || {};
    const status = application.status || 'SUBMITTED';
    const statusClass = status.toLowerCase().replace('_', '-');
    
    const statusColors = {
        'submitted': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', icon: 'fa-paper-plane' },
        'under-review': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', icon: 'fa-clock' },
        'shortlisted': { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', icon: 'fa-star' },
        'accepted': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', icon: 'fa-check-circle' },
        'rejected': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', icon: 'fa-times-circle' },
        'withdrawn': { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', icon: 'fa-ban' }
    };
    
    const statusInfo = statusColors[statusClass] || statusColors['submitted'];
    
    const html = `
        <div class="content-section">
            <!-- Application Header -->
            <div style="background: var(--primary-gradient-elegant); color: white; padding: 2rem; border-radius: var(--radius-lg); margin-bottom: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
                    <div>
                        <h2 style="color: white; margin-bottom: 0.5rem;">${internship.title || 'Internship'}</h2>
                        <p style="font-size: 1.125rem; opacity: 0.95; margin-bottom: 0.5rem;">
                            <i class="fas fa-building"></i> ${company.name || 'Company'}
                        </p>
                        <p style="opacity: 0.9; font-size: 0.9375rem;">
                            <i class="fas fa-calendar"></i> Applied on ${formatDate(application.appliedAt || application.appliedDate)}
                        </p>
                    </div>
                    <div style="background: rgba(255, 255, 255, 0.2); padding: 1rem 1.5rem; border-radius: var(--radius-md);">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <i class="fas ${statusInfo.icon}" style="font-size: 1.5rem;"></i>
                            <div>
                                <div style="font-size: 0.875rem; opacity: 0.9;">Status</div>
                                <div style="font-size: 1.25rem; font-weight: 700;">${formatStatus(status)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Application Status Card -->
            <div class="content-section" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1.5rem;">
                    <i class="fas fa-info-circle" style="color: var(--primary-color);"></i>
                    Application Status
                </h3>
                <div style="display: grid; gap: 1rem;">
                    <div style="display: flex; justify-content: space-between; padding: 1rem; background: ${statusInfo.bg}; border-left: 4px solid ${statusInfo.color}; border-radius: var(--radius-md);">
                        <div>
                            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">Current Status</div>
                            <div style="color: ${statusInfo.color}; font-weight: 600;">${formatStatus(status)}</div>
                        </div>
                        <i class="fas ${statusInfo.icon}" style="font-size: 2rem; color: ${statusInfo.color};"></i>
                    </div>
                    
                    ${application.companyNotes ? `
                        <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.5rem;">
                                <i class="fas fa-comment"></i> Company Notes
                            </div>
                            <p style="color: var(--text-secondary); line-height: 1.6;">${application.companyNotes}</p>
                        </div>
                    ` : ''}
                    
                    ${application.rejectionReason ? `
                        <div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border-left: 4px solid var(--danger-color); border-radius: var(--radius-md);">
                            <div style="font-weight: 600; color: var(--danger-color); margin-bottom: 0.5rem;">
                                <i class="fas fa-exclamation-triangle"></i> Rejection Reason
                            </div>
                            <p style="color: var(--text-secondary); line-height: 1.6;">${application.rejectionReason}</p>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Internship Details -->
            <div class="content-section" style="margin-bottom: 2rem;">
                <h3 style="margin-bottom: 1.5rem;">
                    <i class="fas fa-briefcase" style="color: var(--primary-color);"></i>
                    Internship Details
                </h3>
                <div style="display: grid; gap: 1.5rem;">
                    ${internship.description ? `
                        <div>
                            <h4 style="margin-bottom: 0.75rem; color: var(--text-primary);">Description</h4>
                            <p style="color: var(--text-secondary); line-height: 1.8;">${internship.description}</p>
                        </div>
                    ` : ''}
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                        ${internship.startDate ? `
                            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                                <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                                    <i class="fas fa-calendar-alt"></i> Start Date
                                </div>
                                <div style="font-weight: 600; color: var(--text-primary);">
                                    ${formatDate(internship.startDate)}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${internship.duration ? `
                            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                                <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                                    <i class="fas fa-clock"></i> Duration
                                </div>
                                <div style="font-weight: 600; color: var(--text-primary);">
                                    ${internship.duration} months
                                </div>
                            </div>
                        ` : ''}
                        
                        ${internship.location ? `
                            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                                <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                                    <i class="fas fa-map-marker-alt"></i> Location
                                </div>
                                <div style="font-weight: 600; color: var(--text-primary);">
                                    ${internship.location}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${internship.type ? `
                            <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                                <div style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 0.5rem;">
                                    <i class="fas fa-briefcase"></i> Type
                                </div>
                                <div style="font-weight: 600; color: var(--text-primary);">
                                    ${internship.type}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    
                    ${internship.skills && internship.skills.length > 0 ? `
                        <div>
                            <h4 style="margin-bottom: 0.75rem; color: var(--text-primary);">Required Skills</h4>
                            <div class="internship-tags">
                                ${internship.skills.map(skill => `<span class="tag">${skill}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            <!-- Application Actions -->
            <div class="content-section">
                <h3 style="margin-bottom: 1.5rem;">
                    <i class="fas fa-cog" style="color: var(--primary-color);"></i>
                    Actions
                </h3>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    ${application.cvUrl ? `
                        <a href="${application.cvUrl}" target="_blank" class="btn btn-outline">
                            <i class="fas fa-file-pdf"></i>
                            View Your CV
                        </a>
                    ` : ''}
                    
                    <a href="internship-details.html?id=${internship.id}" class="btn btn-outline">
                        <i class="fas fa-eye"></i>
                        View Internship Details
                    </a>
                    
                    ${canWithdraw(status) ? `
                        <button class="btn btn-outline" onclick="withdrawApplication('${application.id}')" style="border-color: var(--danger-color); color: var(--danger-color);">
                            <i class="fas fa-times"></i>
                            Withdraw Application
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('applicationDetails').innerHTML = html;
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
 * Format date
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * Check if application can be withdrawn
 */
function canWithdraw(status) {
    return status === 'SUBMITTED' || status === 'UNDER_REVIEW' || status === 'SHORTLISTED';
}

/**
 * Withdraw application
 */
async function withdrawApplication(applicationId) {
    if (!confirm('Are you sure you want to withdraw this application? This action cannot be undone.')) {
        return;
    }
    
    try {
        showAlert('Withdrawing application...', 'info');
        
        const response = await apiRequest(`/applications/${applicationId}/withdraw`, {
            method: 'PUT'
        });
        
        if (response.success) {
            showAlert('Application withdrawn successfully', 'success');
            setTimeout(() => {
                window.location.href = 'my-applications.html';
            }, 2000);
        } else {
            showAlert(response.message || 'Failed to withdraw application', 'error');
        }
    } catch (error) {
        console.error('Error withdrawing application:', error);
        showAlert(error.message || 'Failed to withdraw application. Please try again.', 'error');
    }
}

// Make functions globally available
window.withdrawApplication = withdrawApplication;

