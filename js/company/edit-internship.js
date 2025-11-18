// ===== TrainUp - Edit Internship JavaScript =====

// Arrays to store chips
const requirements = [];
const responsibilities = [];
const skills = [];

let currentInternship = null;
let internshipId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and is a company
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

    // Load company info
    loadCompanyInfo(userData);

    // Get internship ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    internshipId = urlParams.get('id');

    if (!internshipId) {
        showAlert('Invalid internship ID', 'error');
        setTimeout(() => window.location.href = 'internships.html', 2000);
        return;
    }

    // Load internship details
    await loadInternshipDetails();

    // Set minimum dates (only if form is loaded)
    const startDateEl = document.getElementById('startDate');
    const endDateEl = document.getElementById('endDate');
    const deadlineEl = document.getElementById('applicationDeadline');
    
    if (startDateEl && endDateEl && deadlineEl) {
        const today = new Date().toISOString().split('T')[0];
        startDateEl.min = today;
        endDateEl.min = today;
        deadlineEl.min = today;
    }

    // Handle form submission
    const form = document.getElementById('internshipForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

/**
 * Load internship details
 */
async function loadInternshipDetails() {
    try {
        const response = await apiRequest(API_ENDPOINTS.INTERNSHIPS.GET_BY_ID(internshipId), {
            method: 'GET'
        });

        if (response.success) {
            currentInternship = response.data;
            populateForm(currentInternship);

            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('formSection').style.display = 'block';
        } else {
            throw new Error('Failed to load internship details');
        }

    } catch (error) {
        console.error('Error loading internship:', error);
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error Loading Internship</h3>
                    <p>${error.message || 'Cannot set properties of null (setting \'value\')'}</p>
                    <a href="internships.html" class="btn btn-primary">
                        Back to Internships
                    </a>
                </div>
            `;
        }
    }
}

/**
 * Populate form with existing data
 */
function populateForm(internship) {
    // Basic fields
    const titleEl = document.getElementById('title');
    const categoryEl = document.getElementById('category');
    const locationEl = document.getElementById('location');
    const durationEl = document.getElementById('duration');
    const numberOfPositionsEl = document.getElementById('numberOfPositions');
    
    if (titleEl) titleEl.value = internship.title || '';
    if (categoryEl) categoryEl.value = internship.category || '';
    if (locationEl) locationEl.value = internship.location || '';
    if (durationEl) durationEl.value = internship.duration || '';
    if (numberOfPositionsEl) numberOfPositionsEl.value = internship.numberOfPositions || 1;

    // Dates
    const startDateEl = document.getElementById('startDate');
    const endDateEl = document.getElementById('endDate');
    const deadlineEl = document.getElementById('applicationDeadline');
    
    if (internship.startDate && startDateEl) {
        startDateEl.value = internship.startDate.split('T')[0];
    }
    if (internship.endDate && endDateEl) {
        endDateEl.value = internship.endDate.split('T')[0];
    }
    if (internship.applicationDeadline && deadlineEl) {
        deadlineEl.value = internship.applicationDeadline.split('T')[0];
    }

    // Stipend
    const isPaidEl = document.getElementById('isPaid');
    const stipendEl = document.getElementById('stipend');
    const stipendGroupEl = document.getElementById('stipendGroup');
    
    if (isPaidEl) {
        isPaidEl.value = internship.isPaid ? 'true' : 'false';
        if (internship.isPaid && internship.stipend && stipendEl && stipendGroupEl) {
            stipendEl.value = internship.stipend;
            stipendGroupEl.style.display = 'block';
        }
    }

    // Description
    const descriptionEl = document.getElementById('description');
    if (descriptionEl) {
        descriptionEl.value = internship.description || '';
    }

    // Requirements
    if (internship.requirements && internship.requirements.length > 0) {
        internship.requirements.forEach(req => addChip('requirements', req));
    }

    // Responsibilities
    if (internship.responsibilities && internship.responsibilities.length > 0) {
        internship.responsibilities.forEach(resp => addChip('responsibilities', resp));
    }

    // Skills
    if (internship.skills && internship.skills.length > 0) {
        internship.skills.forEach(skill => addChip('skills', skill));
    }
}

/**
 * Load company info in sidebar
 */
function loadCompanyInfo(userData) {
    const profile = userData.profile;

    if (profile) {
        const companyName = profile.companyName;
        const initials = companyName.substring(0, 2).toUpperCase();

        document.getElementById('companyName').textContent = companyName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

/**
 * Toggle stipend field based on isPaid selection
 */
function toggleStipend() {
    const isPaid = document.getElementById('isPaid').value;
    const stipendGroup = document.getElementById('stipendGroup');
    
    if (isPaid === 'true') {
        stipendGroup.style.display = 'block';
        document.getElementById('stipend').required = true;
    } else {
        stipendGroup.style.display = 'none';
        document.getElementById('stipend').required = false;
        document.getElementById('stipend').value = '';
    }
}

/**
 * Focus chip input
 */
function focusInput(inputId) {
    document.getElementById(inputId).focus();
}

/**
 * Handle chip input
 */
function handleChipInput(event, type) {
    if (event.key === 'Enter') {
        event.preventDefault();
        
        const input = event.target;
        const value = input.value.trim();
        
        if (value) {
            addChip(type, value);
            input.value = '';
        }
    }
}

/**
 * Add chip
 */
function addChip(type, value) {
    const array = type === 'requirements' ? requirements : 
                  type === 'responsibilities' ? responsibilities : skills;
    
    // Avoid duplicates
    if (array.includes(value)) {
        return;
    }
    
    array.push(value);
    renderChips(type);
}

/**
 * Remove chip
 */
function removeChip(type, index) {
    const array = type === 'requirements' ? requirements : 
                  type === 'responsibilities' ? responsibilities : skills;
    
    array.splice(index, 1);
    renderChips(type);
}

/**
 * Render chips
 */
function renderChips(type) {
    const array = type === 'requirements' ? requirements : 
                  type === 'responsibilities' ? responsibilities : skills;
    
    const containerId = `${type}Container`;
    const inputId = `${type}Input`;
    
    const container = document.getElementById(containerId);
    const input = document.getElementById(inputId);
    
    // Check if elements exist
    if (!container || !input) {
        console.warn(`Elements not found for type: ${type}`);
        return;
    }
    
    // Store input value before clearing
    const inputValue = input.value;
    
    // Clear container
    container.innerHTML = '';
    
    // Add chips
    array.forEach((item, index) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.innerHTML = `
            ${item}
            <button type="button" onclick="removeChip('${type}', ${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(chip);
    });
    
    // Re-add input with preserved value
    container.appendChild(input);
    input.value = inputValue;
}

/**
 * Handle form submission
 */
async function handleSubmit(event) {
    event.preventDefault();
    
    // Clear previous errors
    clearAllErrors();
    hideAlert();
    
    // Get form data
    const formData = {
        title: document.getElementById('title').value.trim(),
        category: document.getElementById('category').value,
        location: document.getElementById('location').value.trim(),
        duration: parseInt(document.getElementById('duration').value),
        numberOfPositions: parseInt(document.getElementById('numberOfPositions').value),
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value || null,
        applicationDeadline: document.getElementById('applicationDeadline').value,
        isPaid: document.getElementById('isPaid').value === 'true',
        stipend: document.getElementById('stipend').value ? parseFloat(document.getElementById('stipend').value) : null,
        description: document.getElementById('description').value.trim(),
        requirements: requirements,
        responsibilities: responsibilities,
        skills: skills
    };
    
    // Validate
    let isValid = true;
    
    if (!formData.title) {
        showFieldError('title', 'Title is required');
        isValid = false;
    }
    
    if (!formData.category) {
        showFieldError('category', 'Category is required');
        isValid = false;
    }
    
    if (!formData.location) {
        showFieldError('location', 'Location is required');
        isValid = false;
    }
    
    if (!formData.duration || formData.duration < 1) {
        showFieldError('duration', 'Valid duration is required');
        isValid = false;
    }
    
    if (!formData.numberOfPositions || formData.numberOfPositions < 1) {
        showFieldError('numberOfPositions', 'Valid number of positions is required');
        isValid = false;
    }
    
    if (!formData.startDate) {
        showFieldError('startDate', 'Start date is required');
        isValid = false;
    }
    
    if (!formData.applicationDeadline) {
        showFieldError('applicationDeadline', 'Application deadline is required');
        isValid = false;
    }
    
    if (!formData.description) {
        showFieldError('description', 'Description is required');
        isValid = false;
    }
    
    if (!isValid) {
        showAlert('Please fix the errors in the form', 'error');
        return;
    }
    
    // Show loading state
    setButtonLoading('submitBtn', true, 'Update Internship');

    try {
        // Update internship via PUT request
        const response = await apiRequest(API_ENDPOINTS.INTERNSHIPS.UPDATE(internshipId), {
            method: 'PUT',
            body: JSON.stringify(formData)
        });

        if (response.success) {
            showAlert('Internship updated successfully! Redirecting...', 'success');

            setTimeout(() => {
                window.location.href = 'internships.html';
            }, 2000);
        } else {
            showAlert(response.message || 'Failed to update internship', 'error');
        }

    } catch (error) {
        console.error('Error updating internship:', error);
        showAlert(error.message || 'An error occurred. Please try again.', 'error');

    } finally {
        setButtonLoading('submitBtn', false, 'Update Internship');
    }
}
