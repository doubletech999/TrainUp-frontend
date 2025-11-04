// ===== TrainUp - Supervisor Dashboard JavaScript =====

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and is a supervisor
    if (!isLoggedIn()) {
        window.location.href = '../../login.html';
        return;
    }

    const userData = getUserData();
    if (userData.userType !== 'SUPERVISOR') {
        showAlert('Access denied. Supervisors only.', 'error');
        setTimeout(() => logout(), 2000);
        return;
    }

    // Load supervisor info
    loadSupervisorInfo(userData);

    // Load dashboard data
    await loadDashboardData();
});

/**
 * Load supervisor info in sidebar
 */
function loadSupervisorInfo(userData) {
    const profile = userData.profile;
    
    if (profile) {
        const fullName = `${profile.firstName} ${profile.lastName}`;
        const initials = getInitials(profile.firstName, profile.lastName);
        
        document.getElementById('supervisorName').textContent = fullName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
        document.getElementById('welcomeName').textContent = profile.lastName;
    }
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        // Load all data in parallel
        const [companiesResponse, internshipsResponse, studentsResponse] = await Promise.all([
            getPendingCompanies(),
            getPendingInternships(),
            getAllStudents()
        ]);

        // Update stats
        if (companiesResponse.success) {
            const companies = companiesResponse.data || [];
            document.getElementById('pendingCompanies').textContent = companies.length;
            displayPendingCompanies(companies.slice(0, 3));
        }

        if (internshipsResponse.success) {
            const internships = internshipsResponse.data || [];
            document.getElementById('pendingInternships').textContent = internships.length;
            displayPendingInternships(internships.slice(0, 3));
        }

        if (studentsResponse.success) {
            const students = studentsResponse.data || [];
            document.getElementById('totalStudents').textContent = students.length;
            
            // Get active internships count (students with ACCEPTED applications)
            const activeCount = await getActiveInternshipsCount();
            document.getElementById('activeInternships').textContent = activeCount;
        }

    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showAlert('Failed to load dashboard data. Please refresh the page.', 'error');
    }
}

/**
 * Get pending companies
 */
async function getPendingCompanies() {
    return await apiRequest('/supervisor/companies/pending', {
        method: 'GET'
    });
}

/**
 * Get pending internships
 */
async function getPendingInternships() {
    return await apiRequest('/supervisor/internships/pending', {
        method: 'GET'
    });
}

/**
 * Get all students
 */
async function getAllStudents() {
    return await apiRequest('/supervisor/students', {
        method: 'GET'
    });
}

/**
 * Get active internships count
 */
async function getActiveInternshipsCount() {
    try {
        const response = await getAllInternships();
        if (response.success) {
            return response.data.filter(i => i.status === 'ACTIVE').length;
        }
    } catch (error) {
        console.error('Error getting active internships:', error);
    }
    return 0;
}

/**
 * Display pending companies
 */
function displayPendingCompanies(companies) {
    const container = document.getElementById('pendingCompaniesList');

    if (companies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>All Caught Up!</h3>
                <p>No companies pending verification</p>
            </div>
        `;
        return;
    }

    container.innerHTML = companies.map(company => {
        const profile = company.companyProfile || {};
        const initials = profile.companyName ? profile.companyName.substring(0, 2).toUpperCase() : 'C';
        
        return `
            <div class="internship-card">
                <div class="internship-header">
                    <div class="company-logo">${initials}</div>
                    <div class="internship-title">
                        <h3>${profile.companyName || 'Company'}</h3>
                        <p class="company-name">${profile.industry || 'Industry'}</p>
                    </div>
                    <span class="status-badge submitted">Pending</span>
                </div>

                <div class="internship-meta">
                    <div class="meta-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${profile.location || 'N/A'}</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-users"></i>
                        <span>${profile.companySize || 'N/A'} employees</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-envelope"></i>
                        <span>${company.email || 'N/A'}</span>
                    </div>
                    ${profile.website ? `
                        <div class="meta-item">
                            <i class="fas fa-globe"></i>
                            <a href="${profile.website}" target="_blank" style="color: var(--primary-color);">
                                Website
                            </a>
                        </div>
                    ` : ''}
                </div>

                ${profile.description ? `
                    <p style="margin: 1rem 0; color: var(--text-secondary); line-height: 1.6;">
                        ${profile.description.substring(0, 150)}${profile.description.length > 150 ? '...' : ''}
                    </p>
                ` : ''}

                <div class="internship-footer">
                    <div class="internship-actions">
                        <button class="btn btn-outline btn-sm" onclick="rejectCompany('${company.id}')">
                            <i class="fas fa-times"></i>
                            Reject
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="approveCompany('${company.id}')">
                            <i class="fas fa-check"></i>
                            Approve
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Display pending internships
 */
function displayPendingInternships(internships) {
    const container = document.getElementById('pendingInternshipsList');

    if (internships.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>All Caught Up!</h3>
                <p>No internships pending review</p>
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
                    <span class="status-badge submitted">Pending Review</span>
                </div>

                <p style="margin-bottom: 1rem; color: var(--text-secondary);">
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
                        <i class="fas fa-users"></i>
                        <span>${internship.numberOfPositions} positions</span>
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
                        <button class="btn btn-outline btn-sm" onclick="viewInternshipDetails('${internship.id}')">
                            <i class="fas fa-eye"></i>
                            View Details
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="rejectInternship('${internship.id}')">
                            <i class="fas fa-times"></i>
                            Reject
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="approveInternship('${internship.id}')">
                            <i class="fas fa-check"></i>
                            Approve
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Approve company
 */
async function approveCompany(companyId) {
    if (!confirm('Are you sure you want to approve this company?')) {
        return;
    }

    try {
        showAlert('Approving company...', 'info');
        
        const response = await apiRequest(`/supervisor/companies/${companyId}/verify?approve=true`, {
            method: 'PUT'
        });

        if (response.success) {
            showAlert('Company approved successfully!', 'success');
            await loadDashboardData();
        } else {
            showAlert(response.message || 'Failed to approve company', 'error');
        }
    } catch (error) {
        console.error('Error approving company:', error);
        showAlert(error.message || 'Failed to approve company', 'error');
    }
}

/**
 * Reject company
 */
async function rejectCompany(companyId) {
    if (!confirm('Are you sure you want to reject this company?')) {
        return;
    }

    try {
        showAlert('Rejecting company...', 'info');
        
        const response = await apiRequest(`/supervisor/companies/${companyId}/verify?approve=false`, {
            method: 'PUT'
        });

        if (response.success) {
            showAlert('Company rejected successfully!', 'success');
            await loadDashboardData();
        } else {
            showAlert(response.message || 'Failed to reject company', 'error');
        }
    } catch (error) {
        console.error('Error rejecting company:', error);
        showAlert(error.message || 'Failed to reject company', 'error');
    }
}

/**
 * Approve internship
 */
async function approveInternship(internshipId) {
    if (!confirm('Are you sure you want to approve this internship?')) {
        return;
    }

    try {
        showAlert('Approving internship...', 'info');
        
        const response = await apiRequest(`/supervisor/internships/${internshipId}/review?approve=true`, {
            method: 'PUT'
        });

        if (response.success) {
            showAlert('Internship approved successfully!', 'success');
            await loadDashboardData();
        } else {
            showAlert(response.message || 'Failed to approve internship', 'error');
        }
    } catch (error) {
        console.error('Error approving internship:', error);
        showAlert(error.message || 'Failed to approve internship', 'error');
    }
}

/**
 * Reject internship
 */
async function rejectInternship(internshipId) {
    const notes = prompt('Please provide a reason for rejection:');
    
    if (!notes) {
        showAlert('Rejection reason is required', 'error');
        return;
    }

    try {
        showAlert('Rejecting internship...', 'info');
        
        const response = await apiRequest(
            `/supervisor/internships/${internshipId}/review?approve=false&notes=${encodeURIComponent(notes)}`, 
            {
                method: 'PUT'
            }
        );

        if (response.success) {
            showAlert('Internship rejected successfully!', 'success');
            await loadDashboardData();
        } else {
            showAlert(response.message || 'Failed to reject internship', 'error');
        }
    } catch (error) {
        console.error('Error rejecting internship:', error);
        showAlert(error.message || 'Failed to reject internship', 'error');
    }
}

/**
 * View internship details
 */
function viewInternshipDetails(internshipId) {
    window.location.href = `internship-details.html?id=${internshipId}`;
}