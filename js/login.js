// ===== TrainUp - Login Page JavaScript =====

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    
    // Load remembered email if exists
    const rememberedEmail = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        rememberMeCheckbox.checked = true;
    }
    
    // Handle form submission
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Clear previous errors
        clearAllErrors();
        hideAlert();
        
        // Get form data
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = rememberMeCheckbox.checked;
        
        // Validate inputs
        let isValid = true;
        
        if (!email) {
            showFieldError('email', 'Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            showFieldError('email', 'Please enter a valid email address');
            isValid = false;
        }
        
        if (!password) {
            showFieldError('password', 'Password is required');
            isValid = false;
        }
        
        if (!isValid) return;
        
        // Show loading state
        setButtonLoading('loginBtn', true, 'Login');
        
        try {
            // Make login request
            const response = await apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
                method: 'POST',
                body: JSON.stringify({
                    email: email,
                    password: password,
                }),
            });
            
            // Check if response is successful
            if (response.success && response.data) {
                // Save auth data
                saveAuthData(response.data);
                
                // Handle remember me
                if (rememberMe) {
                    localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, email);
                } else {
                    localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
                }
                
                // Show success message
                showAlert('Login successful! Redirecting...', 'success');
                
                // Redirect to dashboard after 1 second
                setTimeout(() => {
                    redirectToDashboard(response.data.user.userType);
                }, 1000);
                
            } else {
                showAlert(response.message || 'Login failed. Please try again.');
            }
            
        } catch (error) {
            console.error('Login error:', error);
            
            // Handle specific error messages
            let errorMessage = 'An error occurred. Please try again.';
            
            if (error.status === HTTP_STATUS.UNAUTHORIZED) {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (error.status === HTTP_STATUS.NOT_FOUND) {
                errorMessage = 'Account not found. Please check your email.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            showAlert(errorMessage, 'error');
            
        } finally {
            // Hide loading state
            setButtonLoading('loginBtn', false, 'Login');
        }
    });
    
    // Clear error on input
    document.getElementById('email').addEventListener('input', () => {
        clearFieldError('email');
    });
    
    document.getElementById('password').addEventListener('input', () => {
        clearFieldError('password');
    });
});

// Social login handlers (placeholder)
document.addEventListener('DOMContentLoaded', () => {
    const socialButtons = document.querySelectorAll('.social-btn');
    
    socialButtons.forEach(button => {
        button.addEventListener('click', () => {
            const provider = button.classList.contains('google') ? 'Google' : 'Microsoft';
            showAlert(`${provider} login is coming soon!`, 'info');
        });
    });
});