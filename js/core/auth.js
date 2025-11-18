// ===== TrainUp - Authentication Helper Functions =====

/**
 * Get refresh token from storage
 */
function getRefreshToken() {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

/**
 * Refresh access token
 */
async function refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        throw new Error('No refresh token available');
    }

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.REFRESH}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
        });

        const data = await response.json();

        if (response.ok && data.success && data.data) {
            saveAuthData(data.data);
            return data.data.accessToken;
        } else {
            throw new Error(data.message || 'Failed to refresh token');
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
        logout();
        throw error;
    }
}

/**
 * Make API Request
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    
    // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
    const isFormData = options.body instanceof FormData;
    
    const defaultOptions = {
        headers: {},
        ...options,
    };
    
    // Only set Content-Type if not FormData
    if (!isFormData && !defaultOptions.headers['Content-Type']) {
        defaultOptions.headers['Content-Type'] = 'application/json';
    }
    
    // Add authorization token if exists (skip for public endpoints like company proof upload during registration)
    // Don't add token for company proof upload endpoint as it's public
    if (!endpoint.includes('/files/upload-company-proof')) {
        let token = getAccessToken();
        if (token) {
            defaultOptions.headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    try {
        let response = await fetch(url, defaultOptions);
        let data;
        
        // Try to parse JSON, but handle non-JSON responses
        try {
            data = await response.json();
        } catch (e) {
            data = { message: 'Invalid response from server' };
        }
        
        // If 401 and we have a refresh token, try to refresh
        if (response.status === 401 && token && getRefreshToken() && !endpoint.includes('/auth/refresh')) {
            try {
                token = await refreshAccessToken();
                defaultOptions.headers['Authorization'] = `Bearer ${token}`;
                
                // Retry the request with new token
                response = await fetch(url, defaultOptions);
                try {
                    data = await response.json();
                } catch (e) {
                    data = { message: 'Invalid response from server' };
                }
            } catch (refreshError) {
                // Refresh failed, logout user
                console.error('Token refresh failed, logging out:', refreshError);
                if (window.location.pathname && !window.location.pathname.includes('login.html')) {
                    logout();
                }
                throw {
                    status: 401,
                    message: 'Session expired. Please login again.',
                    data: data,
                };
            }
        }
        
        if (!response.ok) {
            // Handle 401 specifically
            if (response.status === 401) {
                // If we're not on login page, redirect
                if (window.location.pathname && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
                    console.warn('Unauthorized access, redirecting to login');
                    logout();
                }
            }
            
            throw {
                status: response.status,
                message: data.message || 'An error occurred',
                data: data,
            };
        }
        
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        
        // If it's a network error or parsing error, wrap it
        if (!error.status) {
            // Check for specific network error messages
            let errorMessage = error.message || 'Network error. Please check your connection.';
            
            if (errorMessage.includes('Failed to fetch') || 
                errorMessage.includes('NetworkError') ||
                errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                errorMessage.includes('ERR_CONNECTION_RESET')) {
                errorMessage = 'Cannot connect to server. Please ensure the backend server is running on http://localhost:8080';
            }
            
            throw {
                status: 0,
                message: errorMessage,
                data: null,
            };
        }
        
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
    
    // Check if we're in a subdirectory and redirect to auth login
    if (window.location.pathname.includes('/pages/')) {
        window.location.href = '../../pages/auth/login.html';
    } else if (window.location.pathname.includes('/auth/')) {
        window.location.href = 'pages/auth/login.html';
    } else {
        window.location.href = 'pages/auth/login.html';
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
    
    // Check if we're in a subdirectory and adjust path
    if (window.location.pathname.includes('/pages/')) {
        window.location.href = '../../' + redirectUrl;
    } else if (window.location.pathname.includes('/auth/')) {
        window.location.href = '../' + redirectUrl;
    } else {
        window.location.href = redirectUrl;
    }
}

/**
 * Show alert message
 */
function showAlert(message, type = 'error') {
    const alertElement = document.getElementById('alertMessage');
    
    if (!alertElement) return;
    
    // Determine icon based on type
    let icon = 'fa-exclamation-circle';
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

// Run auth check on page load (only for auth pages)
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname;
    if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
        checkAuthStatus();
    }
});

// Helper function to get correct login path based on current location
function getLoginPath() {
    if (window.location.pathname.includes('/pages/')) {
        return '../../pages/auth/login.html';
    } else if (window.location.pathname.includes('/auth/')) {
        return 'login.html';
    } else {
        return 'pages/auth/login.html';
    }
}
