// ===== TrainUp - Student Dashboard JavaScript =====

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and is a student
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

    // Load dashboard data
    await loadDashboardData();
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
        document.getElementById('welcomeName').textContent = profile.firstName;
    }
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        // Load applications and internships in parallel
        const [applicationsResponse, internshipsResponse] = await Promise.all([
            getMyApplications(),
            getAllInternships()
        ]);

        if (applicationsResponse.success) {
            const applications = applicationsResponse.data || [];
            updateStats(applications);
            displayRecentApplications(applications.slice(0, 3));
        }

        if (internshipsResponse.success) {
            const internships = internshipsResponse.data || [];
            document.getElementById('availableInternships').textContent = internships.length;
            displayLatestInternships(internships.slice(0, 3));
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Failed to load dashboard data. Please refresh the page.', 'error');
    }
}

/**
 * Update statistics
 */
function updateStats(applications) {
    const total = applications.length;
    const pending = applications.filter(app => 
        app.status === 'SUBMITTED' || app.status === 'UNDER_REVIEW'
    ).length;
    const accepted = applications.filter(app => 
        app.status === 'ACCEPTED'
    ).length;

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
                <a href="internships.html" class="btn btn-primary">Browse Internships</a>
            </div>
        `;
        return;
    }

    container.innerHTML = applications.map(app => `
        <div class="internship-card">
            <div class="internship-header">
                <div class="company-logo">
                    <i class="fas fa-building"></i>
                </div>
                <div class="internship-title">
                    <h3>${app.internship?.title || 'N/A'}</h3>
                    <p class="company-name">Applied on ${formatDate(app.appliedDate)}</p>
                </div>
                <span class="status-badge ${app.status.toLowerCase().replace('_', '-')}">
                    ${formatStatus(app.status)}
                </span>
            </div>

            <div class="internship-meta">
                <div class="meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${app.internship?.location || 'N/A'}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${app.internship?.duration || 0} months</span>
                </div>
            </div>

            <div class="internship-footer">
                <button class="btn btn-outline btn-sm" onclick="viewApplication('${app.id}')">
                    <i class="fas fa-eye"></i>
                    View Details
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Display latest internships
 */
function displayLatestInternships(internships) {
    const container = document.getElementById('latestInternships');

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

    container.innerHTML = internships.map(internship => `
        <div class="internship-card">
            <div class="internship-header">
                <div class="company-logo">
                    ${internship.company?.logo ? 
                        `<img src="${internship.company.logo}" alt="Logo">` :
                        `<i class="fas fa-building"></i>`
                    }
                </div>
                <div class="internship-title">
                    <h3>${internship.title}</h3>
                    <p class="company-name">${internship.company?.name || 'Company'}</p>
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
                    <i class="fas fa-calendar"></i>
                    <span>Deadline: ${formatDate(internship.applicationDeadline)}</span>
                </div>
                ${internship.isPaid ? `
                    <div class="meta-item">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Paid</span>
                    </div>
                ` : ''}
            </div>

            ${internship.skills && internship.skills.length > 0 ? `
                <div class="internship-tags">
                    ${internship.skills.slice(0, 3).map(skill => 
                        `<span class="tag">${skill}</span>`
                    ).join('')}
                    ${internship.skills.length > 3 ? 
                        `<span class="tag">+${internship.skills.length - 3} more</span>` : 
                        ''
                    }
                </div>
            ` : ''}

            <div class="internship-footer">
                <div class="meta-item">
                    <i class="fas fa-eye"></i>
                    <span>${internship.views || 0} views</span>
                </div>
                <div class="internship-actions">
                    <a href="internship-details.html?id=${internship.id}" class="btn btn-outline btn-sm">
                        View Details
                    </a>
                    <a href="internship-details.html?id=${internship.id}" class="btn btn-primary btn-sm">
                        Apply Now
                    </a>
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