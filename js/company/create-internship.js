// ===== TrainUp - Create Internship JavaScript =====

// Arrays to store chips
const requirements = [];
const responsibilities = [];
const skills = [];

document.addEventListener('DOMContentLoaded', () => {
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

    // Set minimum dates
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('startDate').min = today;
    document.getElementById('endDate').min = today;
    document.getElementById('applicationDeadline').min = today;

    // Handle form submission
    document.getElementById('internshipForm').addEventListener('submit', handleSubmit);
});

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
    
    // Re-add input
    container.appendChild(input);
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
    setButtonLoading('submitBtn', true, 'Post Internship');
    
    try {
        const response = await createInternship(formData);
        
        if (response.success) {
            showAlert('Internship posted successfully! Redirecting...', 'success');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showAlert(response.message || 'Failed to post internship', 'error');
        }
        
    } catch (error) {
        console.error('Error posting internship:', error);
        showAlert(error.message || 'An error occurred. Please try again.', 'error');
        
    } finally {
        setButtonLoading('submitBtn', false, 'Post Internship');
    }
}
