// ===== TrainUp - Company Edit Profile JavaScript =====

let currentUserData = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '../../pages/auth/login.html';
        return;
    }

    const userData = getUserData();
    if (userData.userType !== 'COMPANY') {
        showAlert('Access denied. Companies only.', 'error');
        setTimeout(() => logout(), 2000);
        return;
    }

    currentUserData = userData;

    // Load company info
    loadCompanyInfo(userData);

    // Load form data
    await loadProfileData(userData);

    // Add event listeners to remove error state when user types
    const requiredFields = ['companyName', 'industry', 'location'];
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                this.closest('.form-group')?.classList.remove('error');
            });
            field.addEventListener('change', function() {
                this.closest('.form-group')?.classList.remove('error');
            });
        }
    });
});

/**
 * Load company info
 */
function loadCompanyInfo(userData) {
    const profile = userData.profile || {};
    const companyProfile = profile.companyProfile || {};
    
    if (companyProfile.companyName) {
        const initials = companyProfile.companyName.substring(0, 2).toUpperCase();
        document.getElementById('companyName').textContent = companyProfile.companyName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

/**
 * Load profile data into form
 */
async function loadProfileData(userData) {
    try {
        // Try to fetch latest profile data from API
        const response = await apiRequest(API_ENDPOINTS.COMPANIES.PROFILE, {
            method: 'GET'
        });

        // Response structure: { success: true, data: CompanyProfileResponse }
        const companyProfile = response.success && response.data 
            ? response.data 
            : (userData.profile?.companyProfile || {});
        const contactPerson = companyProfile.contactPerson || {};

        // Populate form fields
        document.getElementById('companyName').value = companyProfile.companyName || '';
        document.getElementById('industry').value = companyProfile.industry || '';
        document.getElementById('companySize').value = companyProfile.companySize || '';
        document.getElementById('location').value = companyProfile.location || '';
        document.getElementById('phoneNumber').value = companyProfile.phoneNumber || '';
        document.getElementById('website').value = companyProfile.website || '';
        document.getElementById('description').value = companyProfile.description || '';

        // Contact person fields
        document.getElementById('contactName').value = contactPerson.name || '';
        document.getElementById('contactPosition').value = contactPerson.position || '';
        document.getElementById('contactEmail').value = contactPerson.email || '';
        document.getElementById('contactPhone').value = contactPerson.phone || '';
    } catch (error) {
        console.error('Error loading profile data:', error);
        
        // Fallback to userData from localStorage
        const profile = userData.profile || {};
        const companyProfile = profile.companyProfile || {};
        const contactPerson = companyProfile.contactPerson || {};

        document.getElementById('companyName').value = companyProfile.companyName || '';
        document.getElementById('industry').value = companyProfile.industry || '';
        document.getElementById('companySize').value = companyProfile.companySize || '';
        document.getElementById('location').value = companyProfile.location || '';
        document.getElementById('phoneNumber').value = companyProfile.phoneNumber || '';
        document.getElementById('website').value = companyProfile.website || '';
        document.getElementById('description').value = companyProfile.description || '';

        document.getElementById('contactName').value = contactPerson.name || '';
        document.getElementById('contactPosition').value = contactPerson.position || '';
        document.getElementById('contactEmail').value = contactPerson.email || '';
        document.getElementById('contactPhone').value = contactPerson.phone || '';
    }
}

/**
 * Save company profile
 */
async function saveCompanyProfile(event) {
    event.preventDefault();

    // Get form elements
    const companyNameInput = document.getElementById('companyName');
    const industrySelect = document.getElementById('industry');
    const locationInput = document.getElementById('location');

    // Get form values
    const companyName = companyNameInput ? companyNameInput.value.trim() : '';
    const industry = industrySelect ? industrySelect.value : '';
    const companySize = document.getElementById('companySize')?.value || '';
    const location = locationInput ? locationInput.value.trim() : '';
    const phoneNumber = document.getElementById('phoneNumber')?.value.trim() || '';
    const website = document.getElementById('website')?.value.trim() || '';
    const description = document.getElementById('description')?.value.trim() || '';

    // Contact person
    const contactName = document.getElementById('contactName')?.value.trim() || '';
    const contactPosition = document.getElementById('contactPosition')?.value.trim() || '';
    const contactEmail = document.getElementById('contactEmail')?.value.trim() || '';
    const contactPhone = document.getElementById('contactPhone')?.value.trim() || '';

    // Validate required fields with visual feedback
    let isValid = true;
    let firstErrorField = null;

    // Clear previous error states
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });

    if (!companyName) {
        if (companyNameInput) {
            companyNameInput.closest('.form-group')?.classList.add('error');
            companyNameInput.focus();
        }
        firstErrorField = 'Company name';
        isValid = false;
    }
    
    if (!industry) {
        if (industrySelect) {
            industrySelect.closest('.form-group')?.classList.add('error');
            if (!firstErrorField) industrySelect.focus();
        }
        if (!firstErrorField) firstErrorField = 'Industry';
        isValid = false;
    }
    
    if (!location) {
        if (locationInput) {
            locationInput.closest('.form-group')?.classList.add('error');
            if (!firstErrorField) locationInput.focus();
        }
        if (!firstErrorField) firstErrorField = 'Location';
        isValid = false;
    }

    if (!isValid) {
        showAlert(`${firstErrorField} is required`, 'error');
        return;
    }

    // Prepare profile data (matching UpdateCompanyProfileRequest structure)
    const profileData = {
        companyName: companyName,
        industry: industry,
        companySize: companySize || null,
        location: location,
        phoneNumber: phoneNumber || null,
        website: website || null,
        description: description || null,
        contactPerson: {
            name: contactName || null,
            position: contactPosition || null,
            email: contactEmail || null,
            phone: contactPhone || null
        }
    };

    try {
        showAlert('Saving profile...', 'info');

        const response = await apiRequest(API_ENDPOINTS.COMPANIES.UPDATE_PROFILE, {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        if (response.success) {
            showAlert('Profile updated successfully!', 'success');
            
            // Update local storage
            if (currentUserData && response.data) {
                currentUserData.profile = {
                    ...currentUserData.profile,
                    companyProfile: response.data
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
    }
}


