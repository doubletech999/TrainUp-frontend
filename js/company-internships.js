// ===== TrainUp - Company Internships Management JavaScript =====

let allInternships = [];
let filteredInternships = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
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

    // Load company info
    loadCompanyInfo(userData);

    // Load internships
    await loadInternships();
});

/**
 * Load company info
 */
function loadCompanyInfo(userData) {
    const profile = userData.profile || {};
    const companyProfile = profile.companyProfile || {};
    
    if (companyProfile.companyName) {
        const initials = companyProfile.companyName.substring(0, 2).toUpperCase();
        document.getElementById('companyName').textContent = companyProfile.companyName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

/**
 * Load internships
 */
async function loadInternships() {
    try {
        const response = await apiRequest('/company/internships', {
            method: 'GET'
        });

        if (response.success && response.data) {
            allInternships = response.data;
            filteredInternships = [...allInternships];
            updateStats();
            displayInternships(filteredInternships);
        } else {
            throw new Error('Failed to load internships');
        }
    } catch (error) {
        console.error('Error loading internships:', error);
        
        // Load mock data as fallback
        loadMockData();
    }
}

/**
 * Load mock data
 */
function loadMockData() {
    allInternships = [
        {
            id: '1',
            title: 'Software Development Intern',
            description: 'We are looking for a talented software development intern to join our team...',
            location: 'Ramallah',
            duration: 6,
            status: 'ACTIVE',
            applicationsCount: 15,
            views: 120,
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: '2',
            title: 'Data Science Intern',
            description: 'Join our data science team and work on exciting projects...',
            location: 'Nablus',
            duration: 3,
            status: 'ACTIVE',
            applicationsCount: 8,
            views: 85,
            deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: '3',
            title: 'Marketing Intern',
            description: 'Help us promote our products and services...',
            location: 'Jerusalem',
            duration: 4,
            status: 'PAUSED',
            applicationsCount: 5,
            views: 45,
            deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    filteredInternships = [...allInternships];
    updateStats();
    displayInternships(filteredInternships);
}

/**
 * Update statistics
 */
function updateStats() {
    const total = allInternships.length;
    const active = allInternships.filter(i => i.status === 'ACTIVE').length;
    const totalApplications = allInternships.reduce((sum, i) => sum + (i.applicationsCount || 0), 0);
    const totalViews = allInternships.reduce((sum, i) => sum + (i.views || 0), 0);

    document.getElementById('totalInternships').textContent = total;
    document.getElementById('activeInternships').textContent = active;
    document.getElementById('totalApplications').textContent = totalApplications;
    document.getElementById('totalViews').textContent = totalViews;
}

/**
 * Display internships
 */
function displayInternships(internships) {
    const container = document.getElementById('internshipsList');
    document.getElementById('internshipsCount').textContent = internships.length;

    if (internships.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-briefcase"></i>
                <h3>No Internships Found</h3>
                <p>Start posting internships to attract talented students</p>
                <a href="create-internship.html" class="btn btn-primary">
                    Post Your First Internship
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = internships.map(internship => {
        const statusClass = getStatusClass(internship.status);
        const statusText = formatStatus(internship.status);

        return `
            <div class="internship-card">
                <div class="internship-header">
                    <div class="company-logo">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <div class="internship-title">
                        <h3>${internship.title}</h3>
                        <p class="company-name">Posted ${formatDate(internship.createdAt)}</p>
                    </div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>

                <p style="margin: 1rem 0; color: var(--text-secondary); line-height: 1.6;">
                    ${internship.description.substring(0, 200)}${internship.description.length > 200 ? '...' : ''}
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
                        <i class="fas fa-eye"></i>
                        <span>${internship.views || 0} views</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-users"></i>
                        <span>${internship.applicationsCount || 0} applicants</span>
                    </div>
                    <div class="meta-item">
                        <i class="fas fa-calendar"></i>
                        <span>Deadline: ${formatDate(internship.deadline)}</span>
                    </div>
                </div>

                <div class="internship-footer">
                    <div class="internship-actions">
                        <a href="applications.html?internship=${internship.id}" class="btn btn-outline btn-sm">
                            <i class="fas fa-users"></i>
                            View Applications (${internship.applicationsCount || 0})
                        </a>
                        <a href="edit-internship.html?id=${internship.id}" class="btn btn-outline btn-sm">
                            <i class="fas fa-edit"></i>
                            Edit
                        </a>
                        ${internship.status === 'ACTIVE' ? `
                            <button class="btn btn-outline btn-sm" onclick="pauseInternship('${internship.id}')" style="border-color: var(--warning-color); color: var(--warning-color);">
                                <i class="fas fa-pause"></i>
                                Pause
                            </button>
                        ` : internship.status === 'PAUSED' ? `
                            <button class="btn btn-primary btn-sm" onclick="activateInternship('${internship.id}')">
                                <i class="fas fa-play"></i>
                                Activate
                            </button>
                        ` : ''}
                        <button class="btn btn-outline btn-sm" onclick="deleteInternship('${internship.id}')" style="border-color: var(--danger-color); color: var(--danger-color);">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Filter internships
 */
function filterInternships() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;

    filteredInternships = allInternships.filter(internship => {
        const matchesSearch = !searchTerm || 
            internship.title.toLowerCase().includes(searchTerm) ||
            internship.location.toLowerCase().includes(searchTerm) ||
            internship.status.toLowerCase().includes(searchTerm);
        const matchesStatus = !status || internship.status === status;

        return matchesSearch && matchesStatus;
    });

    displayInternships(filteredInternships);
}

/**
 * Reset filters
 */
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    filteredInternships = [...allInternships];
    displayInternships(filteredInternships);
}

/**
 * Get status class
 */
function getStatusClass(status) {
    const classes = {
        'ACTIVE': 'active',
        'PAUSED': 'paused',
        'CLOSED': 'closed',
        'DRAFT': 'draft'
    };
    return classes[status] || 'active';
}

/**
 * Format status
 */
function formatStatus(status) {
    return status.charAt(0) + status.slice(1).toLowerCase();
}

/**
 * Pause internship
 */
async function pauseInternship(internshipId) {
    if (!confirm('Are you sure you want to pause this internship?')) return;

    try {
        const response = await apiRequest(`/company/internships/${internshipId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'PAUSED' })
        });

        if (response.success) {
            showAlert('Internship paused successfully', 'success');
            await loadInternships();
        } else {
            throw new Error('Failed to pause internship');
        }
    } catch (error) {
        console.error('Error pausing internship:', error);
        showAlert('Failed to pause internship', 'error');
    }
}

/**
 * Activate internship
 */
async function activateInternship(internshipId) {
    if (!confirm('Are you sure you want to activate this internship?')) return;

    try {
        const response = await apiRequest(`/company/internships/${internshipId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'ACTIVE' })
        });

        if (response.success) {
            showAlert('Internship activated successfully', 'success');
            await loadInternships();
        } else {
            throw new Error('Failed to activate internship');
        }
    } catch (error) {
        console.error('Error activating internship:', error);
        showAlert('Failed to activate internship', 'error');
    }
}

/**
 * Delete internship
 */
async function deleteInternship(internshipId) {
    if (!confirm('Are you sure you want to delete this internship? This action cannot be undone!')) return;

    try {
        const response = await apiRequest(`/company/internships/${internshipId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showAlert('Internship deleted successfully', 'success');
            await loadInternships();
        } else {
            throw new Error('Failed to delete internship');
        }
    } catch (error) {
        console.error('Error deleting internship:', error);
        showAlert('Failed to delete internship', 'error');
    }
}

/**
 * Format date
 */
function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Make functions globally available
window.filterInternships = filterInternships;
window.resetFilters = resetFilters;
window.pauseInternship = pauseInternship;
window.activateInternship = activateInternship;
window.deleteInternship = deleteInternship;

