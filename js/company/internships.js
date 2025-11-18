// ===== TrainUp - Company Internships Management JavaScript =====

let allInternships = [];
let filteredInternships = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '../../pages/auth/login.html';
        return;
    }

    const userData = getUserData();
    if (!userData) {
        showAlert('User data not found. Please login again.', 'error');
        setTimeout(() => {
            logout();
            window.location.href = '../../pages/auth/login.html';
        }, 2000);
        return;
    }

    if (userData.userType !== 'COMPANY') {
        showAlert(`Access denied. This page is for companies only. Your account type is: ${userData.userType || 'Unknown'}. Please login with a company account.`, 'error');
        setTimeout(() => logout(), 3000);
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
    const container = document.getElementById('internshipsList');
    
    // Show loading state
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Loading internships...</p>
            </div>
        `;
    }
    
    try {
        // Check if user is authenticated and has correct role
        const userData = getUserData();
        const token = getAccessToken();
        
        console.log('🔍 Debug Info:');
        console.log('User Data:', userData);
        console.log('User Type:', userData?.userType);
        console.log('Token exists:', !!token);
        console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'none');
        
        if (!userData || userData.userType !== 'COMPANY') {
            throw {
                status: 403,
                message: `Access denied. Your account type is ${userData?.userType || 'Unknown'}. This page requires a COMPANY account.`
            };
        }
        
        const response = await getMyInternships();
        
        console.log('📦 API Response:', response);

        // Handle successful response
        if (response) {
            if (response.success === false) {
                throw new Error(response.message || 'Failed to load internships');
            }
            
            let internshipsData = [];
            
            if (response.data !== undefined) {
                internshipsData = Array.isArray(response.data) ? response.data : [];
            } else if (Array.isArray(response)) {
                internshipsData = response;
            } else {
                console.warn('⚠️ Unexpected response format:', response);
                throw new Error('Unexpected response format from server');
            }
            
            // Log raw data for debugging
            console.log('📦 Raw internships data:', internshipsData);
            console.log('📦 First internship sample:', internshipsData[0]);
            
            allInternships = internshipsData;
            filteredInternships = [...allInternships];
            
            // Reset filters when loading new data
            document.getElementById('searchInput').value = '';
            document.getElementById('statusFilter').value = '';
            
            updateStats();
            displayInternships(filteredInternships);
            console.log('✅ Internships loaded successfully:', allInternships.length);
            return;
        }
        
        console.warn('⚠️ Unexpected response format:', response);
        throw new Error('Unexpected response format from server');
        
    } catch (error) {
        console.error('❌ Error loading internships:', error);
        
        // Handle 401 - Unauthorized
        if (error.status === 401) {
            showAlert('Your session has expired. Please login again.', 'error');
            setTimeout(() => {
                logout();
            }, 2000);
            return;
        }
        
        // Handle 403 - Forbidden
        if (error.status === 403) {
            const userData = getUserData();
            let errorMsg = error.message || 'Access Denied. You don\'t have permission to access this resource.';
            
            if (userData && userData.userType !== 'COMPANY') {
                errorMsg = `Access Denied. This page is for companies only. Your account type is: ${userData.userType || 'Unknown'}. Please login with a company account.`;
            }
            
            if (container) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-exclamation-circle"></i>
                        <h3>Access Denied</h3>
                        <p>${errorMsg}</p>
                        <div style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: center;">
                            <button class="btn btn-primary" onclick="location.reload()">
                                <i class="fas fa-sync"></i> Refresh Page
                            </button>
                            <button class="btn btn-outline" onclick="logout()">
                                <i class="fas fa-sign-out-alt"></i> Logout & Login Again
                            </button>
                        </div>
                    </div>
                `;
            }
            
            showAlert(errorMsg, 'error');
            return;
        }
        
        // Handle other errors
        let errorMsg = error.message || 'An unexpected error occurred';
        
        if (errorMsg.includes('Failed to fetch') || 
            errorMsg.includes('NetworkError') ||
            error.status === 0) {
            errorMsg = 'Cannot connect to server. Please ensure the backend is running on http://localhost:8080';
        }
        
        if (container) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error Loading Internships</h3>
                    <p>${errorMsg}</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-sync"></i> Refresh Page
                    </button>
                </div>
            `;
        }
        
        showAlert(errorMsg, 'error');
    }
}

/**
 * Update statistics
 */
function updateStats() {
    const total = allInternships.length;
    
    // Normalize status - handle both string and object formats
    const normalizeStatus = (status) => {
        if (!status) return null;
        if (typeof status === 'string') return status.toUpperCase();
        if (typeof status === 'object' && status.name) return status.name.toUpperCase();
        return String(status).toUpperCase();
    };
    
    const active = allInternships.filter(i => {
        const status = normalizeStatus(i.status);
        return status === 'ACTIVE';
    }).length;
    
    const totalApplications = allInternships.reduce((sum, i) => sum + (i.applicationsCount || 0), 0);
    const totalViews = allInternships.reduce((sum, i) => sum + (i.views || 0), 0);

    console.log('📊 Stats Update:', {
        total,
        active,
        totalApplications,
        totalViews,
        allStatuses: allInternships.map(i => ({ id: i.id, title: i.title, status: i.status, normalized: normalizeStatus(i.status) }))
    });

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

    console.log('📋 Displaying internships:', {
        count: internships.length,
        internships: internships.map(i => ({
            id: i.id,
            title: i.title,
            status: i.status,
            statusType: typeof i.status
        }))
    });

    if (internships.length === 0) {
        // Check if there are internships but they're filtered out
        if (allInternships.length > 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-filter"></i>
                    <h3>No Internships Match Your Filters</h3>
                    <p>Try adjusting your search or filter criteria</p>
                    <button class="btn btn-primary" onclick="resetFilters()">
                        <i class="fas fa-redo"></i> Reset Filters
                    </button>
                </div>
            `;
        } else {
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
        }
        return;
    }

    // Normalize status helper
    const normalizeStatus = (status) => {
        if (!status) return 'UNKNOWN';
        if (typeof status === 'string') return status.toUpperCase();
        if (typeof status === 'object' && status.name) return status.name.toUpperCase();
        return String(status).toUpperCase();
    };

    container.innerHTML = internships.map(internship => {
        const normalizedStatus = normalizeStatus(internship.status);
        const statusClass = getStatusClass(normalizedStatus);
        const statusText = formatStatus(normalizedStatus);
        const description = internship.description || '';
        const safeDescription = description.length > 200 ? description.substring(0, 200) + '...' : description;

        return `
            <div class="internship-card">
                <div class="internship-header">
                    <div class="company-logo">
                        <i class="fas fa-briefcase"></i>
                    </div>
                    <div class="internship-title">
                        <h3>${internship.title || 'Untitled Internship'}</h3>
                        <p class="company-name">Posted ${formatDate(internship.createdAt || internship.postedDate)}</p>
                    </div>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>

                ${description ? `
                    <p style="margin: 1rem 0; color: var(--text-secondary); line-height: 1.6;">
                        ${safeDescription}
                    </p>
                ` : ''}

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
                    ${internship.deadline ? `
                        <div class="meta-item">
                            <i class="fas fa-calendar"></i>
                            <span>Deadline: ${formatDate(internship.deadline)}</span>
                        </div>
                    ` : ''}
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
                        ${normalizedStatus === 'ACTIVE' ? `
                            <button class="btn btn-outline btn-sm" onclick="pauseInternship('${internship.id}')" style="border-color: var(--warning-color); color: var(--warning-color);">
                                <i class="fas fa-pause"></i>
                                Pause
                            </button>
                        ` : normalizedStatus === 'PAUSED' ? `
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

    // Normalize status helper
    const normalizeStatus = (status) => {
        if (!status) return null;
        if (typeof status === 'string') return status.toUpperCase();
        if (typeof status === 'object' && status.name) return status.name.toUpperCase();
        return String(status).toUpperCase();
    };

    filteredInternships = allInternships.filter(internship => {
        const internshipStatus = normalizeStatus(internship.status);
        const internshipTitle = (internship.title || '').toLowerCase();
        const internshipLocation = (internship.location || '').toLowerCase();
        const internshipStatusStr = internshipStatus ? internshipStatus.toLowerCase() : '';
        
        const matchesSearch = !searchTerm || 
            internshipTitle.includes(searchTerm) ||
            internshipLocation.includes(searchTerm) ||
            internshipStatusStr.includes(searchTerm);
        
        const matchesStatus = !status || internshipStatus === status.toUpperCase();

        return matchesSearch && matchesStatus;
    });

    console.log('🔍 Filtering internships:', {
        searchTerm,
        statusFilter: status,
        total: allInternships.length,
        filtered: filteredInternships.length,
        filteredList: filteredInternships.map(i => ({ id: i.id, title: i.title, status: normalizeStatus(i.status) }))
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
        const response = await apiRequest(API_ENDPOINTS.INTERNSHIPS.UPDATE(internshipId) + '/status', {
            method: 'PUT',
            body: JSON.stringify({ status: 'PAUSED' })
        });

        if (response.success) {
            showAlert('Internship paused successfully', 'success');
            await loadInternships();
        } else {
            throw new Error(response.message || 'Failed to pause internship');
        }
    } catch (error) {
        console.error('Error pausing internship:', error);
        showAlert(error.message || 'Failed to pause internship', 'error');
    }
}

/**
 * Activate internship
 */
async function activateInternship(internshipId) {
    if (!confirm('Are you sure you want to activate this internship?')) return;

    try {
        const response = await apiRequest(API_ENDPOINTS.INTERNSHIPS.UPDATE(internshipId) + '/status', {
            method: 'PUT',
            body: JSON.stringify({ status: 'ACTIVE' })
        });

        if (response.success) {
            showAlert('Internship activated successfully', 'success');
            await loadInternships();
        } else {
            throw new Error(response.message || 'Failed to activate internship');
        }
    } catch (error) {
        console.error('Error activating internship:', error);
        showAlert(error.message || 'Failed to activate internship', 'error');
    }
}

/**
 * Delete internship
 */
async function deleteInternship(internshipId) {
    if (!confirm('Are you sure you want to delete this internship? This action cannot be undone!')) return;

    try {
        const response = await apiRequest(API_ENDPOINTS.INTERNSHIPS.DELETE(internshipId), {
            method: 'DELETE'
        });

        if (response.success) {
            showAlert('Internship deleted successfully', 'success');
            await loadInternships();
        } else {
            throw new Error(response.message || 'Failed to delete internship');
        }
    } catch (error) {
        console.error('Error deleting internship:', error);
        showAlert(error.message || 'Failed to delete internship', 'error');
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


