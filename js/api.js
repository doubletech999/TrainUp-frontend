// ===== TrainUp - API Helper Functions =====

/**
 * Get all internships
 */
async function getAllInternships() {
    return await apiRequest('/internships', {
        method: 'GET',
    });
}

/**
 * Get internship by ID
 */
async function getInternshipById(internshipId) {
    return await apiRequest(`/internships/${internshipId}`, {
        method: 'GET',
    });
}

/**
 * Apply to internship
 */
async function applyToInternship(applicationData) {
    return await apiRequest('/applications', {
        method: 'POST',
        body: JSON.stringify(applicationData),
    });
}

/**
 * Get student applications
 */
async function getMyApplications() {
    return await apiRequest('/applications/my-applications', {
        method: 'GET',
    });
}

/**
 * Create internship (Company)
 */
async function createInternship(internshipData) {
    return await apiRequest('/internships', {
        method: 'POST',
        body: JSON.stringify(internshipData),
    });
}

/**
 * Get company internships
 */
async function getMyInternships() {
    return await apiRequest('/internships/my-internships', {
        method: 'GET',
    });
}

/**
 * Get company applications
 */
async function getCompanyApplications() {
    return await apiRequest('/applications/company-applications', {
        method: 'GET',
    });
}

/**
 * Get current user profile
 */
async function getCurrentUser() {
    const userData = getUserData();
    if (!userData) {
        throw new Error('User not logged in');
    }
    return userData;
}

/**
 * Format date
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Get initials from name
 */
function getInitials(firstName, lastName) {
    if (!firstName && !lastName) return '?';
    const first = firstName ? firstName.charAt(0) : '';
    const last = lastName ? lastName.charAt(0) : '';
    return (first + last).toUpperCase();
}

/**
 * Check if user has required role
 */
function checkUserRole(requiredRole) {
    const userData = getUserData();
    if (!userData || userData.userType !== requiredRole) {
        window.location.href = '../../login.html';
        return false;
    }
    return true;
}

/**
 * Update application status (Company)
 */
async function updateApplicationStatusAPI(applicationId, statusData) {
    return await apiRequest(`/applications/${applicationId}/status`, {
        method: 'PUT',
        body: JSON.stringify(statusData),
    });
}