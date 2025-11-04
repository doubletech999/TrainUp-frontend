// ===== TrainUp - Student Profile JavaScript =====

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    if (!isLoggedIn()) {
        window.location.href = '../../login.html';
        return;
    }

    const userData = getUserData();
    
    if (userData.userType !== 'STUDENT') {
        showAlert('Access denied. Students only.', 'error');
        setTimeout(() => logout(), 2000);
        return;
    }

    currentUser = userData;

    // Load user info
    loadUserInfo(userData);
    
    // Load profile data
    await loadProfileData();
    
    // Handle form submission
    document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
});

/**
 * Load user info in sidebar
 */
function loadUserInfo(userData) {
    const profile = userData.profile;
    
    if (profile) {
        const fullName = `${profile.firstName} ${profile.lastName}`;
        const initials = getInitials(profile.firstName, profile.lastName);
        
        document.getElementById('userName').textContent = fullName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

/**
 * Load profile data
 */
async function loadProfileData() {
    try {
        const profile = currentUser.profile;
        
        if (!profile) {
            showAlert('Profile not found', 'error');
            return;
        }

        // Avatar
        const initials = getInitials(profile.firstName, profile.lastName);
        document.getElementById('profileAvatarLarge').textContent = initials;
        
        // Basic Info
        document.getElementById('profileFullName').textContent = 
            `${profile.firstName} ${profile.lastName}`;
        document.getElementById('profileEmail').textContent = currentUser.email;
        document.getElementById('profileStudentId').textContent = profile.studentId || '-';
        document.getElementById('profileUniversity').textContent = profile.university || '-';
        document.getElementById('profileMajor').textContent = profile.major || '-';

        // Form Fields
        document.getElementById('firstName').value = profile.firstName || '';
        document.getElementById('lastName').value = profile.lastName || '';
        document.getElementById('studentId').value = profile.studentId || '';
        document.getElementById('phoneNumber').value = profile.phoneNumber || '';
        document.getElementById('university').value = profile.university || '';
        document.getElementById('major').value = profile.major || '';
        document.getElementById('yearOfStudy').value = profile.yearOfStudy || '';
        document.getElementById('gpa').value = profile.gpa || '';
        document.getElementById('bio').value = profile.bio || '';
        document.getElementById('linkedinUrl').value = profile.linkedinUrl || '';
        document.getElementById('githubUrl').value = profile.githubUrl || '';
        
        // Skills (array to comma-separated string)
        if (profile.skills && profile.skills.length > 0) {
            document.getElementById('skills').value = profile.skills.join(', ');
        }

        // CV Status
        if (profile.cvUrl) {
            document.getElementById('cvStatus').style.display = 'flex';
            document.getElementById('cvFileName').textContent = 'CV uploaded';
            document.getElementById('uploadCVButtonText').textContent = 'Update CV';
        }

    } catch (error) {
        console.error('Error loading profile:', error);
        showAlert('Failed to load profile data', 'error');
    }
}

/**
 * Handle profile update
 */
async function handleProfileUpdate(event) {
    event.preventDefault();
    
    // Clear errors
    clearAllErrors();
    hideAlert();
    
    // Get form data
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const university = document.getElementById('university').value.trim();
    const major = document.getElementById('major').value.trim();
    const yearOfStudy = parseInt(document.getElementById('yearOfStudy').value) || null;
    const gpa = parseFloat(document.getElementById('gpa').value) || null;
    const bio = document.getElementById('bio').value.trim();
    const linkedinUrl = document.getElementById('linkedinUrl').value.trim();
    const githubUrl = document.getElementById('githubUrl').value.trim();
    const skillsStr = document.getElementById('skills').value.trim();
    
    // Validate
    let isValid = true;
    
    if (!firstName) {
        showFieldError('firstName', 'First name is required');
        isValid = false;
    }
    
    if (!lastName) {
        showFieldError('lastName', 'Last name is required');
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
    
    if (!isValid) {
        showAlert('Please fix the errors in the form', 'error');
        return;
    }
    
    // Convert skills string to array
    const skills = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(s => s) : [];
    
    // Prepare update data
    const updateData = {
        studentProfile: {
            firstName,
            lastName,
            phoneNumber: phoneNumber || null,
            university,
            major,
            yearOfStudy,
            gpa,
            bio: bio || null,
            linkedinUrl: linkedinUrl || null,
            githubUrl: githubUrl || null,
            skills: skills.length > 0 ? skills : null
        }
    };
    
    // Show loading
    const saveBtn = document.getElementById('saveBtn');
    const saveBtnText = document.getElementById('saveBtnText');
    const saveBtnLoader = document.getElementById('saveBtnLoader');
    
    saveBtn.disabled = true;
    saveBtnText.style.display = 'none';
    saveBtnLoader.style.display = 'inline-block';
    
    try {
        // Call API to update profile
        const response = await updateStudentProfile(updateData);
        
        if (response.success) {
            showAlert('Profile updated successfully!', 'success');
            
            // Update local storage
            currentUser.profile = response.data.studentProfile;
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
            
            // Reload profile data
            await loadProfileData();
            
            // Update sidebar
            loadUserInfo(currentUser);
            
        } else {
            showAlert(response.message || 'Failed to update profile', 'error');
        }
        
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert(error.message || 'Failed to update profile. Please try again.', 'error');
        
    } finally {
        saveBtn.disabled = false;
        saveBtnText.style.display = 'inline';
        saveBtnLoader.style.display = 'none';
    }
}

/**
 * Handle CV upload
 */
async function handleCVUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showAlert('File size must be less than 5MB', 'error');
        event.target.value = '';
        return;
    }
    
    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showAlert('Only PDF, DOC, and DOCX files are allowed', 'error');
        event.target.value = '';
        return;
    }
    
    showAlert('Uploading CV...', 'info');
    
    try {
        // Convert to base64
        const base64File = await fileToBase64(file);
        
        // Prepare update data
        const updateData = {
            studentProfile: {
                cvUrl: base64File
            }
        };
        
        // Call API to update CV
        const response = await updateStudentProfile(updateData);
        
        if (response.success) {
            showAlert('CV uploaded successfully!', 'success');
            
            // Update local storage
            currentUser.profile.cvUrl = response.data.studentProfile.cvUrl;
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUser));
            
            // Update UI
            document.getElementById('cvStatus').style.display = 'flex';
            document.getElementById('cvFileName').textContent = file.name;
            document.getElementById('uploadCVButtonText').textContent = 'Update CV';
            
        } else {
            showAlert(response.message || 'Failed to upload CV', 'error');
        }
        
    } catch (error) {
        console.error('Error uploading CV:', error);
        showAlert(error.message || 'Failed to upload CV. Please try again.', 'error');
    }
    
    // Clear input
    event.target.value = '';
}

/**
 * Convert file to Base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

/**
 * API: Update student profile
 */
async function updateStudentProfile(updateData) {
    return await apiRequest('/students/me', {
        method: 'PUT',
        body: JSON.stringify(updateData),
    });
}