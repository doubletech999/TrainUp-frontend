// ===== TrainUp - My Applications JavaScript =====

let allApplications = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
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

    // Load user info
    loadUserInfo(userData);

    // Load applications
    await loadApplications();
});

/**
 * Load user info in sidebar
 */
function loadUserInfo(userData) {
    const profile = userData.profile;
    
    if (profile) {
        const fullName = `${profile.firstName} ${profile.lastName}`;
        const initials = getInitials(profile.firstName, profile.lastName);
        
        document.getElementById('userName').textContent = fullName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

/**
 * Load applications
 */
async function loadApplications() {
    try {
        const response = await getMyApplications();

        if (response.success) {
            allApplications = response.data || [];
            displayApplications(allApplications);
        } else {
            throw new Error('Failed to load applications');
        }

    } catch (error) {
        console.error('Error loading applications:', error);
        
        const container = document.getElementById('applicationsList');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Applications</h3>
                <p>Please refresh the page to try again</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Refresh Page
                </button>
            </div>
        `;
    }
}

/**
 * Display applications
 */
function displayApplications(applications) {
    const container = document.getElementById('applicationsList');
    document.getElementById('applicationsCount').textContent = applications.length;

    if (applications.length === 0) {
        const message = currentFilter === 'all' 
            ? "You haven't applied to any internships yet"
            : `No ${formatStatus(currentFilter).toLowerCase()} applications found`;
            
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No Applications Found</h3>
                <p>${message}</p>
                ${currentFilter === 'all' ? `
                    <a href="internships.html" class="btn btn-primary">Browse Internships</a>
                ` : ''}
            </div>
        `;
        return;
    }

    container.innerHTML = applications.map(app => {
        // ✅ Get internship info from nested object
        const internship = app.internship || {};
        const company = internship.company || {};
        const companyInitials = company.name ? company.name.substring(0, 2).toUpperCase() : 'C';
        
        return `
            <div class="internship-card">
                <div class="internship-header">
                    <div class="company-logo">${companyInitials}</div>
                    <div class="internship-title">
                        <h3>${internship.title || 'Internship'}</h3>
                        <p class="company-name">${company.name || 'Company'} • Applied on ${formatDate(app.appliedDate)}</p>
                    </div>
                    <span class="status-badge ${getStatusClass(app.status)}">
                        ${formatStatus(app.status)}
                    </span>
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
                    ${app.reviewedDate ? `
                        <div class="meta-item">
                            <i class="fas fa-calendar-check"></i>
                            <span>Reviewed ${formatDate(app.reviewedDate)}</span>
                        </div>
                    ` : ''}
                </div>

                ${app.coverLetter ? `
                    <div style="margin: 1rem 0; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <strong style="display: block; margin-bottom: 0.5rem;">
                            <i class="fas fa-file-alt"></i> Your Cover Letter:
                        </strong>
                        <p style="color: var(--text-secondary); line-height: 1.6;">
                            ${app.coverLetter.substring(0, 200)}${app.coverLetter.length > 200 ? '...' : ''}
                        </p>
                    </div>
                ` : ''}

                ${app.companyNotes ? `
                    <div style="margin: 1rem 0; padding: 1rem; background: #FEF3C7; border-radius: var(--radius-md); border-left: 4px solid #F59E0B;">
                        <strong style="display: block; margin-bottom: 0.5rem; color: #92400E;">
                            <i class="fas fa-comment"></i> Company Notes:
                        </strong>
                        <p style="color: #92400E; line-height: 1.6;">
                            ${app.companyNotes}
                        </p>
                    </div>
                ` : ''}

                ${app.rejectionReason ? `
                    <div style="margin: 1rem 0; padding: 1rem; background: #FEE2E2; border-radius: var(--radius-md); border-left: 4px solid #EF4444;">
                        <strong style="display: block; margin-bottom: 0.5rem; color: #991B1B;">
                            <i class="fas fa-info-circle"></i> Rejection Reason:
                        </strong>
                        <p style="color: #991B1B; line-height: 1.6;">
                            ${app.rejectionReason}
                        </p>
                    </div>
                ` : ''}

                <div class="internship-footer">
                    <div class="meta-item">
                        ${app.cvUrl ? `
                            <a href="${app.cvUrl}" target="_blank" style="color: var(--primary-color);">
                                <i class="fas fa-file-pdf"></i> View CV
                            </a>
                        ` : ''}
                    </div>
                    <div class="internship-actions">
                        <a href="internship-details.html?id=${internship.id}" class="btn btn-outline btn-sm">
                            <i class="fas fa-eye"></i>
                            View Internship
                        </a>
                        ${canWithdraw(app.status) ? `
                            <button class="btn btn-outline btn-sm" onclick="withdrawApplication('${app.id}')" style="color: var(--danger-color); border-color: var(--danger-color);">
                                <i class="fas fa-times"></i>
                                Withdraw
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Filter applications
 */
function filterApplications(status) {
    currentFilter = status;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-filter="${status}"]`).classList.add('active');
    
    // Filter and display
    let filtered = allApplications;
    
    if (status !== 'all') {
        filtered = allApplications.filter(app => app.status === status);
    }
    
    displayApplications(filtered);
}

/**
 * Get CSS class for status badge
 */
function getStatusClass(status) {
    const classMap = {
        'SUBMITTED': 'submitted',
        'UNDER_REVIEW': 'under-review',
        'SHORTLISTED': 'shortlisted',
        'ACCEPTED': 'accepted',
        'REJECTED': 'rejected',
        'WITHDRAWN': 'withdrawn'
    };
    return classMap[status] || 'submitted';
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
 * Check if application can be withdrawn
 */
function canWithdraw(status) {
    return status === 'SUBMITTED' || status === 'UNDER_REVIEW';
}

/**
 * Withdraw application - ✅ READY FOR BACKEND IMPLEMENTATION
 */
async function withdrawApplication(applicationId) {
    if (!confirm('Are you sure you want to withdraw this application?')) {
        return;
    }
    
    try {
        // ✅ Call withdraw endpoint when backend is ready
        const response = await apiRequest(`/applications/${applicationId}/withdraw`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showAlert('Application withdrawn successfully', 'success');
            // Reload applications
            await loadApplications();
        } else {
            showAlert(response.message || 'Failed to withdraw application', 'error');
        }
    } catch (error) {
        console.error('Error withdrawing application:', error);
        // ❌ Backend endpoint not implemented yet
        showAlert('Withdraw feature will be available soon!', 'info');
    }
}