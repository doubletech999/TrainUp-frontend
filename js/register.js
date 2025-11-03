// ===== TrainUp - Register Page JavaScript =====

let currentStep = 1;
let selectedUserType = null;

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    
    // Handle form submission
    registerForm.addEventListener('submit', handleRegister);
    
    // Clear errors on input
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => {
            clearFieldError(input.id);
        });
    });
});

/**
 * Select user type
 */
function selectUserType(userType) {
    selectedUserType = userType;
    document.getElementById('userType').value = userType;
    
    // Update UI
    document.querySelectorAll('.user-type-card').forEach(card => {
        card.classList.remove('active');
    });
    event.target.closest('.user-type-card').classList.add('active');
    
    clearFieldError('userType');
    
    // Auto advance to next step
    setTimeout(() => goToStep(2), 300);
}

/**
 * Go to specific step
 */
function goToStep(step) {
    // Validate current step before advancing
    if (step > currentStep) {
        if (currentStep === 1 && !validateStep1()) return;
        if (currentStep === 2 && !validateStep2()) return;
    }
    
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(s => {
        s.style.display = 'none';
    });
    
    // Show target step
    document.getElementById(`step${step}`).style.display = 'block';
    currentStep = step;
    
    // Show appropriate profile section in step 3
    if (step === 3) {
        document.querySelectorAll('.profile-section').forEach(section => {
            section.classList.remove('active');
        });
        
        if (selectedUserType === 'STUDENT') {
            document.getElementById('studentProfile').classList.add('active');
        } else if (selectedUserType === 'COMPANY') {
            document.getElementById('companyProfile').classList.add('active');
        }
    }
}

/**
 * Validate step 1
 */
function validateStep1() {
    if (!selectedUserType) {
        showFieldError('userType', 'Please select your user type');
        return false;
    }
    return true;
}

/**
 * Validate step 2
 */
function validateStep2() {
    clearAllErrors();
    let isValid = true;
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!email) {
        showFieldError('email', 'Email is required');
        isValid = false;
    } else if (!validateEmail(email)) {
        showFieldError('email', 'Please enter a valid email');
        isValid = false;
    }
    
    if (!password) {
        showFieldError('password', 'Password is required');
        isValid = false;
    } else if (password.length < 6) {
        showFieldError('password', 'Password must be at least 6 characters');
        isValid = false;
    }
    
    if (!confirmPassword) {
        showFieldError('confirmPassword', 'Please confirm your password');
        isValid = false;
    } else if (password !== confirmPassword) {
        showFieldError('confirmPassword', 'Passwords do not match');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Handle registration
 */
async function handleRegister(event) {
    event.preventDefault();
    
    // Clear previous errors
    clearAllErrors();
    hideAlert();
    
    // Validate all steps
    if (!validateStep1() || !validateStep2()) {
        goToStep(1);
        return;
    }
    
    // Get form data
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    let registerData = {
        email: email,
        password: password,
        userType: selectedUserType
    };
    
    // Add profile data based on user type
    if (selectedUserType === 'STUDENT') {
        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const studentId = document.getElementById('studentId').value.trim();
        const university = document.getElementById('university').value.trim();
        const major = document.getElementById('major').value.trim();
        
        // Validate required fields
        let isValid = true;
        
        if (!firstName) {
            showFieldError('firstName', 'First name is required');
            isValid = false;
        }
        if (!lastName) {
            showFieldError('lastName', 'Last name is required');
            isValid = false;
        }
        if (!studentId) {
            showFieldError('studentId', 'Student ID is required');
            isValid = false;
        }
        if (!university) {
            showFieldError('university', 'University is required');
            isValid = false;
        }
        if (!major) {
            showFieldError('major', 'Major is required');
            isValid = false;
        }
        
        if (!isValid) return;
        
        registerData.studentProfile = {
            firstName: firstName,
            lastName: lastName,
            studentId: studentId,
            university: university,
            major: major,
            yearOfStudy: parseInt(document.getElementById('yearOfStudy').value) || null,
            phoneNumber: document.getElementById('studentPhone').value.trim() || null
        };
        
    } else if (selectedUserType === 'COMPANY') {
        const companyName = document.getElementById('companyName').value.trim();
        const industry = document.getElementById('industry').value;
        const location = document.getElementById('companyLocation').value.trim();
        
        // Validate required fields
        let isValid = true;
        
        if (!companyName) {
            showFieldError('companyName', 'Company name is required');
            isValid = false;
        }
        if (!industry) {
            showFieldError('industry', 'Industry is required');
            isValid = false;
        }
        if (!location) {
            showFieldError('companyLocation', 'Location is required');
            isValid = false;
        }
        
        if (!isValid) return;
        
        registerData.companyProfile = {
            companyName: companyName,
            industry: industry,
            companySize: document.getElementById('companySize').value || null,
            location: location,
            phoneNumber: document.getElementById('companyPhone').value.trim() || null,
            website: document.getElementById('website').value.trim() || null,
            description: document.getElementById('description').value.trim() || null
        };
    }
    
    // Show loading state
    setButtonLoading('registerBtn', true, 'Create Account');
    
    try {
        // Make registration request
        const response = await apiRequest(API_ENDPOINTS.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify(registerData),
        });
        
        if (response.success && response.data) {
            // Save auth data
            saveAuthData(response.data);
            
            // Show success message
            showAlert('Registration successful! Redirecting...', 'success');
            
            // Redirect to dashboard after 1.5 seconds
            setTimeout(() => {
                redirectToDashboard(response.data.user.userType);
            }, 1500);
            
        } else {
            showAlert(response.message || 'Registration failed. Please try again.');
        }
        
    } catch (error) {
        console.error('Registration error:', error);
        
        let errorMessage = 'An error occurred. Please try again.';
        
        if (error.status === HTTP_STATUS.CONFLICT) {
            errorMessage = 'This email is already registered. Please login instead.';
        } else if (error.data && error.data.message) {
            errorMessage = error.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showAlert(errorMessage, 'error');
        
    } finally {
        setButtonLoading('registerBtn', false, 'Create Account');
    }
}