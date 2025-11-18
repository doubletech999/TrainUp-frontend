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
 * Get company internships (UPDATED WITH BETTER ERROR HANDLING)
 */
async function getMyInternships() {
    try {
        console.log('🔍 Fetching company internships...');
        console.log('Token:', getAccessToken() ? 'exists' : 'missing');
        console.log('User:', getUserData()?.email);
        console.log('User Type:', getUserData()?.userType);
        
        const response = await apiRequest('/internships/my-internships', {
            method: 'GET',
        });
        
        console.log('✅ getMyInternships API response:', response);
        return response;
    } catch (error) {
        console.error('❌ getMyInternships API error:', error);
        console.error('Error details:', {
            status: error.status,
            message: error.message,
            data: error.data
        });
        throw error;
    }
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
        window.location.href = '../../pages/auth/login.html';
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
 * Get monthly evaluations for supervisor
 */
async function getSupervisorMonthlyEvaluations() {
    return await apiRequest('/monthly-evaluations/supervisor', {
        method: 'GET',
    });
}

/**
 * Get monthly evaluations by application ID
 */
async function getMonthlyEvaluationsByApplication(applicationId) {
    return await apiRequest(`/monthly-evaluations/application/${applicationId}`, {
        method: 'GET',
    });
}

/**
 * Get final evaluations for supervisor
 */
async function getSupervisorFinalEvaluations() {
    return await apiRequest('/final-evaluations/supervisor', {
        method: 'GET',
    });
}

/**
 * Get final evaluation by application ID
 */
async function getFinalEvaluationByApplication(applicationId) {
    return await apiRequest(`/final-evaluations/application/${applicationId}`, {
        method: 'GET',
    });
}

/**
 * Check if final evaluation can be submitted
 */
async function canSubmitFinalEvaluation(applicationId) {
    return await apiRequest(`/final-evaluations/can-submit/${applicationId}`, {
        method: 'GET',
    });
}

/**
 * Submit final evaluation (Supervisor)
 */
async function submitFinalEvaluation(evaluationData) {
    return await apiRequest('/final-evaluations', {
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
 * Show alert message (UPDATED)
 */
function showAlert(message, type = 'info') {
    const alertElement = document.getElementById('alertMessage');
    if (!alertElement) {
        console.warn('Alert element not found, using console instead:', message);
        return;
    }

    // Determine icon based on type
    let icon = 'fa-info-circle';
    if (type === 'success') {
        icon = 'fa-check-circle';
    } else if (type === 'error') {
        icon = 'fa-exclamation-circle';
    } else if (type === 'warning') {
        icon = 'fa-exclamation-triangle';
    } else if (type === 'info') {
        icon = 'fa-info-circle';
    }

    alertElement.className = `alert alert-${type}`;
    alertElement.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    alertElement.style.display = 'flex';

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

/**
 * Debug: Log authentication info (HELPER FOR DEBUGGING)
 */
function debugAuthInfo() {
    const userData = getUserData();
    const token = getAccessToken();
    
    console.log('========== AUTH DEBUG INFO ==========');
    console.log('User Data:', userData);
    console.log('User Email:', userData?.email);
    console.log('User Type:', userData?.userType);
    console.log('User ID:', userData?.id);
    console.log('Token Exists:', !!token);
    console.log('Token Preview:', token ? token.substring(0, 30) + '...' : 'No token');
    console.log('Is Logged In:', isLoggedIn());
    console.log('====================================');
    
    return {
        userData,
        token,
        isLoggedIn: isLoggedIn()
    };
}

/**
 * Test API connection (HELPER FOR DEBUGGING)
 */
async function testAPIConnection() {
    try {
        console.log('🔍 Testing API connection...');
        const response = await fetch(`${API_CONFIG.BASE_URL}/auth/test`);
        const data = await response.json();
        console.log('✅ API connection test:', data);
        return true;
    } catch (error) {
        console.error('❌ API connection test failed:', error);
        return false;
    }
}

// Make functions globally available
window.getAllInternships = getAllInternships;
window.getInternshipById = getInternshipById;
window.applyToInternship = applyToInternship;
window.getMyApplications = getMyApplications;
window.createInternship = createInternship;
window.getMyInternships = getMyInternships;
window.getCompanyApplications = getCompanyApplications;
window.getCurrentUser = getCurrentUser;
window.formatDate = formatDate;
window.getInitials = getInitials;
window.checkUserRole = checkUserRole;
window.updateApplicationStatusAPI = updateApplicationStatusAPI;
window.updateInternship = updateInternship;
window.withdrawApplication = withdrawApplication;
window.submitCompanyEvaluation = submitCompanyEvaluation;
window.getSupervisorMonthlyEvaluations = getSupervisorMonthlyEvaluations;
window.getMonthlyEvaluationsByApplication = getMonthlyEvaluationsByApplication;
window.getSupervisorFinalEvaluations = getSupervisorFinalEvaluations;
window.getFinalEvaluationByApplication = getFinalEvaluationByApplication;
window.canSubmitFinalEvaluation = canSubmitFinalEvaluation;
window.submitFinalEvaluation = submitFinalEvaluation;
window.approveInternshipCompletion = approveInternshipCompletion;
window.getInternshipCompletionDetails = getInternshipCompletionDetails;
window.exportData = exportData;
window.showAlert = showAlert;
window.hideAlert = hideAlert;
window.setButtonLoading = setButtonLoading;
window.showFieldError = showFieldError;
window.clearAllErrors = clearAllErrors;
window.debugAuthInfo = debugAuthInfo;
window.testAPIConnection = testAPIConnection;