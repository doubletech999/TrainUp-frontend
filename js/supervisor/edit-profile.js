// ===== TrainUp - Supervisor Edit Profile JavaScript =====

let currentUserData = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '../../pages/auth/login.html';
        return;
    }

    const userData = getUserData();
    
    if (userData.userType !== 'SUPERVISOR') {
        showAlert('Access denied. Supervisors only.', 'error');
        setTimeout(() => logout(), 2000);
        return;
    }

    currentUserData = userData;
    loadUserInfo(userData);
    await loadProfileData(userData);

    // Setup form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', saveSupervisorProfile);
    }
});

function loadUserInfo(userData) {
    const profile = userData.profile;
    
    if (profile) {
        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Supervisor';
        const initials = getInitials(profile.firstName || 'S', profile.lastName || 'p');
        
        const supervisorNameEl = document.getElementById('supervisorName');
        const userEmailEl = document.getElementById('userEmail');
        const userAvatarEl = document.getElementById('userAvatar');
        
        if (supervisorNameEl) supervisorNameEl.textContent = fullName;
        if (userEmailEl) userEmailEl.textContent = userData.email;
        if (userAvatarEl) userAvatarEl.textContent = initials;
    }
}

/**
 * Load profile data into form
 */
async function loadProfileData(userData) {
    try {
        // Try to fetch latest profile data from API
        const response = await apiRequest(API_ENDPOINTS.SUPERVISOR.PROFILE, {
            method: 'GET'
        });

        // Response structure: { success: true, data: SupervisorProfileResponse }
        const supervisorProfile = response.success && response.data 
            ? response.data 
            : (userData.profile || {});

        // Populate form fields
        document.getElementById('firstName').value = supervisorProfile.firstName || '';
        document.getElementById('lastName').value = supervisorProfile.lastName || '';
        document.getElementById('phoneNumber').value = supervisorProfile.phoneNumber || '';
        document.getElementById('universityName').value = supervisorProfile.universityName || '';
        document.getElementById('department').value = supervisorProfile.department || '';
        document.getElementById('position').value = supervisorProfile.position || '';
    } catch (error) {
        console.error('Error loading profile data:', error);
        // Use data from localStorage as fallback
        const profile = userData.profile || {};
        document.getElementById('firstName').value = profile.firstName || '';
        document.getElementById('lastName').value = profile.lastName || '';
        document.getElementById('phoneNumber').value = profile.phoneNumber || '';
        document.getElementById('universityName').value = profile.universityName || '';
        document.getElementById('department').value = profile.department || '';
        document.getElementById('position').value = profile.position || '';
    }
}

/**
 * Save supervisor profile
 */
async function saveSupervisorProfile(event) {
    event.preventDefault();

    // Get form values
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const universityName = document.getElementById('universityName').value.trim();
    const department = document.getElementById('department').value.trim();
    const position = document.getElementById('position').value.trim();

    // Validate required fields
    let isValid = true;
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

    if (!firstName) {
        document.getElementById('firstNameError').textContent = 'First name is required';
        isValid = false;
    }
    if (!lastName) {
        document.getElementById('lastNameError').textContent = 'Last name is required';
        isValid = false;
    }
    if (!universityName) {
        document.getElementById('universityNameError').textContent = 'University is required';
        isValid = false;
    }
    if (!department) {
        document.getElementById('departmentError').textContent = 'Department is required';
        isValid = false;
    }
    if (!position) {
        document.getElementById('positionError').textContent = 'Position is required';
        isValid = false;
    }

    if (!isValid) {
        showAlert('Please fill in all required fields.', 'error');
        return;
    }

    // Prepare profile data
    const profileData = {
        firstName,
        lastName,
        phoneNumber: phoneNumber || null,
        universityName,
        department,
        position
    };

    try {
        setButtonLoading('saveBtn', true);
        showAlert('Saving profile...', 'info');

        // Update profile
        const response = await apiRequest(API_ENDPOINTS.SUPERVISOR.UPDATE_PROFILE, {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        if (response.success) {
            showAlert('Profile updated successfully!', 'success');
            
            // Update local storage
            if (currentUserData && response.data) {
                currentUserData.profile = {
                    ...currentUserData.profile,
                    ...response.data
                };
                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUserData));
            }

            // Redirect to profile page after a short delay
            setTimeout(() => {
                window.location.href = 'profile.html';
            }, 1500);
        } else {
            throw new Error(response.message || 'Failed to update profile');
        }
    } catch (error) {
        console.error('Error saving profile:', error);
        showAlert(error.message || 'Failed to update profile. Please try again.', 'error');
    } finally {
        setButtonLoading('saveBtn', false);
    }
}

