// ===== TrainUp - Authentication Helper Functions =====

/**
 * Make API Request
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    };
    
    // Add authorization token if exists
    const token = getAccessToken();
    if (token) {
        defaultOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, defaultOptions);
        const data = await response.json();
        
        if (!response.ok) {
            throw {
                status: response.status,
                message: data.message || 'An error occurred',
                data: data,
            };
        }
        
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

/**
 * Save authentication data to storage
 */
function saveAuthData(authResponse) {
    const { accessToken, refreshToken, user } = authResponse;
    
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
}

/**
 * Get access token from storage
 */
function getAccessToken() {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Get user data from storage
 */
function getUserData() {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return userData ? JSON.parse(userData) : null;
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return !!getAccessToken();
}

/**
 * Logout user
 */
function logout() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    
    // Check if we're in a subdirectory
    if (window.location.pathname.includes('/pages/')) {
        window.location.href = '../../login.html';
    } else {
        window.location.href = 'login.html';
    }
}

/**
 * Redirect based on user type
 */
function redirectToDashboard(userType) {
    const redirects = {
        [USER_TYPES.STUDENT]: 'pages/student/dashboard.html',
        [USER_TYPES.COMPANY]: 'pages/company/dashboard.html',
        [USER_TYPES.SUPERVISOR]: 'pages/supervisor/dashboard.html',
        [USER_TYPES.ADMIN]: 'pages/admin/dashboard.html',
    };
    
    const redirectUrl = redirects[userType] || 'pages/student/dashboard.html';
    window.location.href = redirectUrl;
}

/**
 * Show alert message
 */
function showAlert(message, type = 'error') {
    const alertElement = document.getElementById('alertMessage');
    
    if (!alertElement) return;
    
    alertElement.className = `alert alert-${type}`;
    alertElement.textContent = message;
    alertElement.style.display = 'flex';
    
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
 * Show loading state on button
 */
function setButtonLoading(buttonId, loading, originalText = 'Submit') {
    const button = document.getElementById(buttonId);
    const btnText = document.getElementById(`${buttonId}Text`);
    const btnLoader = document.getElementById(`${buttonId}Loader`);
    
    if (!button) return;
    
    if (loading) {
        button.disabled = true;
        if (btnText) btnText.style.display = 'none';
        if (btnLoader) btnLoader.style.display = 'inline-block';
    } else {
        button.disabled = false;
        if (btnText) {
            btnText.textContent = originalText;
            btnText.style.display = 'inline';
        }
        if (btnLoader) btnLoader.style.display = 'none';
    }
}

/**
 * Validate email format
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Show field error
 */
function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = message;
    }
    
    if (inputElement) {
        inputElement.classList.add('error');
    }
}

/**
 * Clear field error
 */
function clearFieldError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}Error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = '';
    }
    
    if (inputElement) {
        inputElement.classList.remove('error');
    }
}

/**
 * Clear all errors
 */
function clearAllErrors() {
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
    });
    
    const inputElements = document.querySelectorAll('input.error');
    inputElements.forEach(element => {
        element.classList.remove('error');
    });
}

/**
 * Toggle password visibility
 */
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (!passwordInput || !toggleIcon) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

/**
 * Check if user is already logged in
 */
function checkAuthStatus() {
    if (isLoggedIn()) {
        const userData = getUserData();
        if (userData && userData.userType) {
            redirectToDashboard(userData.userType);
        }
    }
}

// Run auth check on page load
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
    if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
        checkAuthStatus();
    }
});