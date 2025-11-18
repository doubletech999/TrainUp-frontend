// ===== TrainUp - Register Page JavaScript =====

let currentStep = 1;
let selectedUserType = null;
let companyProofFile = null;

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

    // Update UI - remove active from all cards
    document.querySelectorAll('.user-type-card').forEach(card => {
        card.classList.remove('active');
    });

    // Add active to the selected card based on userType
    const cards = document.querySelectorAll('.user-type-card');
    cards.forEach(card => {
        if (card.querySelector('h3').textContent === 'Student' && userType === 'STUDENT') {
            card.classList.add('active');
        } else if (card.querySelector('h3').textContent === 'Company' && userType === 'COMPANY') {
            card.classList.add('active');
        } else if (card.querySelector('h3').textContent === 'Supervisor' && userType === 'SUPERVISOR') {
            card.classList.add('active');
        }
    });

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
        } else if (selectedUserType === 'SUPERVISOR') {
            document.getElementById('supervisorProfile').classList.add('active');
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
    } else if (selectedUserType === 'STUDENT' && !email.toLowerCase().endsWith('@students.alquds.edu')) {
        showFieldError('email', 'Student email must end with @students.alquds.edu');
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
        if (!companyProofFile) {
            showFieldError('companyProof', 'Company verification document is required');
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

    } else if (selectedUserType === 'SUPERVISOR') {
        const firstName = document.getElementById('supervisorFirstName').value.trim();
        const lastName = document.getElementById('supervisorLastName').value.trim();
        const employeeId = document.getElementById('employeeId').value.trim();
        const university = document.getElementById('supervisorUniversity').value.trim();
        const department = document.getElementById('department').value.trim();
        const position = document.getElementById('position').value.trim();
        const phoneNumber = document.getElementById('supervisorPhone').value.trim();

        // Validate required fields
        let isValid = true;

        if (!firstName) {
            showFieldError('supervisorFirstName', 'First name is required');
            isValid = false;
        }
        if (!lastName) {
            showFieldError('supervisorLastName', 'Last name is required');
            isValid = false;
        }
        if (!employeeId) {
            showFieldError('employeeId', 'Employee ID is required');
            isValid = false;
        }
        if (!university) {
            showFieldError('supervisorUniversity', 'University is required');
            isValid = false;
        }
        if (!department) {
            showFieldError('department', 'Department is required');
            isValid = false;
        }
        if (!position) {
            showFieldError('position', 'Position/Title is required');
            isValid = false;
        }
        if (!phoneNumber) {
            showFieldError('supervisorPhone', 'Phone number is required');
            isValid = false;
        }

        if (!isValid) return;

        registerData.supervisorProfile = {
            firstName: firstName,
            lastName: lastName,
            employeeId: employeeId,
            university: university,
            department: department,
            position: position,
            phoneNumber: phoneNumber,
            officeLocation: document.getElementById('officeLocation').value.trim() || null
        };
    }

    // Show loading state
    setButtonLoading('registerBtn', true, 'Create Account');
    
    try {
        // If company, upload proof document first
        if (selectedUserType === 'COMPANY' && companyProofFile) {
            try {
                showAlert('Uploading company verification document...', 'info');
                const formData = new FormData();
                formData.append('file', companyProofFile);
                
                const uploadResponse = await apiRequest(API_ENDPOINTS.FILES.UPLOAD_COMPANY_PROOF, {
                    method: 'POST',
                    body: formData,
                    headers: {} // Let browser set Content-Type for FormData
                });
                
                if (uploadResponse.success && uploadResponse.data) {
                    const proofDocumentUrl = uploadResponse.data.fileUrl || uploadResponse.data.url;
                    if (proofDocumentUrl) {
                        registerData.companyProfile.verificationDocument = proofDocumentUrl;
                        showAlert('Verification document uploaded successfully!', 'success');
                    }
                } else {
                    throw new Error(uploadResponse.message || 'Failed to upload verification document');
                }
            } catch (uploadError) {
                console.error('Error uploading proof document:', uploadError);
                setButtonLoading('registerBtn', false, 'Create Account');
                showAlert('Failed to upload verification document: ' + (uploadError.message || 'Unknown error'), 'error');
                return;
            }
        }
        
        // Make registration request
        const response = await apiRequest(API_ENDPOINTS.AUTH.REGISTER, {
            method: 'POST',
            body: JSON.stringify(registerData),
        });
        
        if (response.success) {
            showAlert('Registration successful! Please check your email to verify your account before logging in.', 'success');
            
            // Reset form and return to first step
            document.getElementById('registerForm').reset();
            currentStep = 1;
            selectedUserType = null;
            companyProofFile = null;
            document.querySelectorAll('.user-type-card').forEach(card => card.classList.remove('active'));
            goToStep(1);
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2500);
            
        } else {
            showAlert(response.message || 'Registration failed. Please try again.', 'error');
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

/**
 * Handle company proof file selection
 */
function handleCompanyProofFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        showFieldError('companyProof', 'Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files only.');
        event.target.value = '';
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showFieldError('companyProof', 'File size exceeds 5MB limit. Please upload a smaller file.');
        event.target.value = '';
        return;
    }
    
    companyProofFile = file;
    clearFieldError('companyProof');
    
    // Update UI
    const uploadArea = document.getElementById('companyProofUploadArea');
    const fileStatus = document.getElementById('companyProofFileStatus');
    const fileName = document.getElementById('companyProofFileName');
    
    if (uploadArea) {
        uploadArea.style.borderColor = 'var(--success-color)';
        uploadArea.style.display = 'none';
    }
    
    if (fileStatus && fileName) {
        fileStatus.style.display = 'block';
        fileName.textContent = file.name;
    }
}

/**
 * Clear company proof file
 */
function clearCompanyProofFile() {
    companyProofFile = null;
    const fileInput = document.getElementById('companyProofFile');
    const uploadArea = document.getElementById('companyProofUploadArea');
    const fileStatus = document.getElementById('companyProofFileStatus');
    
    if (fileInput) fileInput.value = '';
    if (uploadArea) {
        uploadArea.style.display = 'block';
        uploadArea.style.borderColor = 'var(--border-color)';
    }
    if (fileStatus) fileStatus.style.display = 'none';
    clearFieldError('companyProof');
}
