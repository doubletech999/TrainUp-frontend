// ===== TrainUp - Company Dashboard JavaScript =====

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and is a company
    if (!isLoggedIn()) {
        window.location.href = '../../login.html';
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
    try {
        // Load internships and applications in parallel
        const [internshipsResponse, applicationsResponse] = await Promise.all([
            getMyInternships(),
            getCompanyApplications()
        ]);

        if (internshipsResponse.success) {
            const internships = internshipsResponse.data || [];
            updateInternshipStats(internships);
            displayActiveInternships(internships.filter(i => i.status === 'ACTIVE').slice(0, 3));
        }

        if (applicationsResponse.success) {
            const applications = applicationsResponse.data || [];
            updateApplicationStats(applications);
            displayRecentApplications(applications.slice(0, 5));
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Failed to load dashboard data. Please refresh the page.', 'error');
    }
}

/**
 * Update internship statistics
 */
function updateInternshipStats(internships) {
    const total = internships.length;
    const active = internships.filter(i => i.status === 'ACTIVE').length;

    document.getElementById('totalInternships').textContent = total;
    document.getElementById('activeInternships').textContent = active;
}

/**
 * Update application statistics
 */
function updateApplicationStats(applications) {
    const total = applications.length;
    const pending = applications.filter(app => 
        app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW'
    ).length;

    document.getElementById('totalApplications').textContent = total;
    document.getElementById('pendingApplications').textContent = pending;
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
                    <h3>${internship.title}</h3>
                    <p class="company-name">Posted ${formatDate(internship.postedDate)}</p>
                </div>
                <span class="status-badge active">Active</span>
            </div>

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