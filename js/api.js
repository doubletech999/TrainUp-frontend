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

/**
 * Update internship (Company)
 */
async function updateInternship(internshipId, internshipData) {
    return await apiRequest(`/internships/${internshipId}`, {
        method: 'PUT',
        body: JSON.stringify(internshipData),
    });
}

/**
 * Delete/Withdraw application (Student)
 */
async function withdrawApplication(applicationId) {
    return await apiRequest(`/applications/${applicationId}/withdraw`, {
        method: 'DELETE',
    });
}

/**
 * Submit company evaluation (Student)
 */
async function submitCompanyEvaluation(evaluationData) {
    return await apiRequest('/evaluations/company', {
        method: 'POST',
        body: JSON.stringify(evaluationData),
    });
}

/**
 * Approve internship completion (Supervisor)
 */
async function approveInternshipCompletion(internshipId, approvalData) {
    return await apiRequest(`/supervisor/internships/${internshipId}/complete`, {
        method: 'PUT',
        body: JSON.stringify(approvalData),
    });
}

/**
 * Get internship completion details (Supervisor)
 */
async function getInternshipCompletionDetails(internshipId) {
    return await apiRequest(`/supervisor/internships/${internshipId}/completion`, {
        method: 'GET',
    });
}

/**
 * Export data to CSV/PDF (Admin)
 */
async function exportData(type, format) {
    return await apiRequest(`/admin/export/${type}?format=${format}`, {
        method: 'GET',
    });
}

/**
 * Show alert message
 */
function showAlert(message, type = 'info') {
    const alertElement = document.getElementById('alertMessage');
    if (!alertElement) return;

    alertElement.className = `alert alert-${type}`;
    alertElement.textContent = message;
    alertElement.style.display = 'block';

    // Auto-hide after 5 seconds
    setTimeout(() => {
        alertElement.style.display = 'none';
    }, 5000);
}

/**
 * Hide alert message
 */
function hideAlert() {
    const alertElement = document.getElementById('alertMessage');
    if (alertElement) {
        alertElement.style.display = 'none';
    }
}

/**
 * Set button loading state
 */
function setButtonLoading(buttonId, isLoading, originalText) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    if (isLoading) {
        button.disabled = true;
        button.innerHTML = '<span class="loader" style="display: inline-block;"></span> Loading...';
    } else {
        button.disabled = false;
        button.innerHTML = `<i class="fas fa-paper-plane"></i> ${originalText}`;
    }
}

/**
 * Show field error
 */
function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    if (errorElement) {
        errorElement.textContent = message;
    }
}

/**
 * Clear all errors
 */
function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
    });
}