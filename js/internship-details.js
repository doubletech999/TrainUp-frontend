// ===== TrainUp - Internship Details JavaScript =====

let currentInternship = null;
let selectedFile = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    if (!isLoggedIn()) {
        window.location.href = '../../login.html';
        return;
    }

    const userData = getUserData();
    
    // Load user info
    loadUserInfo(userData);

    // Get internship ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const internshipId = urlParams.get('id');

    if (!internshipId) {
        showAlert('Invalid internship ID', 'error');
        setTimeout(() => {
            window.location.href = 'internships.html';
        }, 2000);
        return;
    }

    // Load internship details
    await loadInternshipDetails(internshipId);
});

/**
 * Load user info in sidebar
 */
function loadUserInfo(userData) {
    const profile = userData.profile;
    
    if (profile && userData.userType === 'STUDENT') {
        const fullName = `${profile.firstName} ${profile.lastName}`;
        const initials = getInitials(profile.firstName, profile.lastName);
        
        document.getElementById('userName').textContent = fullName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

/**
 * Load internship details
 */
async function loadInternshipDetails(internshipId) {
    try {
        const response = await getInternshipById(internshipId);

        if (response.success && response.data) {
            currentInternship = response.data;
            displayInternshipDetails(currentInternship);
        } else {
            throw new Error('Failed to load internship details');
        }

    } catch (error) {
        console.error('Error loading internship:', error);
        
        document.getElementById('loadingState').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Internship</h3>
                <p>Unable to load internship details. Please try again.</p>
                <a href="internships.html" class="btn btn-primary">Back to Internships</a>
            </div>
        `;
    }
}

/**
 * Display internship details
 */
function displayInternshipDetails(internship) {
    // Hide loading, show content
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('detailsContent').style.display = 'block';

    // Title and basic info
    document.getElementById('internshipTitle').textContent = internship.title;
    document.getElementById('companyName').textContent = internship.company?.name || 'Company';
    document.getElementById('location').textContent = internship.location;
    document.getElementById('duration').textContent = `${internship.duration} months`;

    // Stipend
    const stipendMeta = document.getElementById('stipendMeta');
    if (internship.isPaid) {
        document.getElementById('stipend').textContent = 
            internship.stipend ? `$${internship.stipend}/month` : 'Paid';
        stipendMeta.style.display = 'flex';
    } else {
        stipendMeta.style.display = 'none';
    }

    // Skills tags
    if (internship.skills && internship.skills.length > 0) {
        document.getElementById('skillsTags').innerHTML = internship.skills
            .map(skill => `<span class="tag">${skill}</span>`)
            .join('');
    }

    // Description
    document.getElementById('description').textContent = internship.description;

    // Responsibilities
    if (internship.responsibilities && internship.responsibilities.length > 0) {
        document.getElementById('responsibilitiesList').innerHTML = internship.responsibilities
            .map(item => `<li><i class="fas fa-check"></i> <span>${item}</span></li>`)
            .join('');
    } else {
        document.getElementById('responsibilitiesSection').style.display = 'none';
    }

    // Requirements
    if (internship.requirements && internship.requirements.length > 0) {
        document.getElementById('requirementsList').innerHTML = internship.requirements
            .map(item => `<li><i class="fas fa-check"></i> <span>${item}</span></li>`)
            .join('');
    } else {
        document.getElementById('requirementsSection').style.display = 'none';
    }

    // Skills list
    if (internship.skills && internship.skills.length > 0) {
        document.getElementById('skillsList').innerHTML = internship.skills
            .map(skill => `<li><i class="fas fa-code"></i> <span>${skill}</span></li>`)
            .join('');
    } else {
        document.getElementById('skillsSection').style.display = 'none';
    }

    // Sidebar info
    const companyInitials = internship.company?.name 
        ? internship.company.name.substring(0, 2).toUpperCase()
        : 'C';
    
    document.getElementById('companyLogoLarge').textContent = companyInitials;
    document.getElementById('companyNameSidebar').textContent = internship.company?.name || 'Company';
    document.getElementById('companyLocation').textContent = internship.company?.location || internship.location;
    document.getElementById('deadline').textContent = formatDate(internship.applicationDeadline);
    document.getElementById('startDate').textContent = formatDate(internship.startDate);
    document.getElementById('positions').textContent = internship.numberOfPositions;
    document.getElementById('views').textContent = internship.views || 0;
    document.getElementById('applicationsCount').textContent = internship.applicationsCount || 0;
}

/**
 * Open application modal
 */
function openApplicationModal() {
    document.getElementById('applicationModal').classList.add('active');
}

/**
 * Close application modal
 */
function closeApplicationModal() {
    document.getElementById('applicationModal').classList.remove('active');
    document.getElementById('applicationForm').reset();
    removeFile();
    clearAllErrors();
}

/**
 * Handle file selection
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Check file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
        showFieldError('cvFile', 'File size must be less than 5MB');
        event.target.value = '';
        return;
    }
    
    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showFieldError('cvFile', 'Only PDF, DOC, and DOCX files are allowed');
        event.target.value = '';
        return;
    }
    
    // Store file
    selectedFile = file;
    
    // Update UI
    document.getElementById('uploadBtnText').textContent = file.name;
    document.getElementById('removeFileBtn').style.display = 'block';
    
    const fileInfo = document.getElementById('fileInfo');
    fileInfo.textContent = `Selected: ${file.name} (${formatFileSize(file.size)})`;
    fileInfo.style.display = 'block';
    fileInfo.style.color = 'var(--secondary-color)';
    
    clearFieldError('cvFile');
}

/**
 * Remove selected file
 */
function removeFile() {
    selectedFile = null;
    document.getElementById('cvFile').value = '';
    document.getElementById('uploadBtnText').textContent = 'Choose File';
    document.getElementById('removeFileBtn').style.display = 'none';
    document.getElementById('fileInfo').style.display = 'none';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
 * Submit application
 */
async function submitApplication() {
    // Clear previous errors
    clearAllErrors();
    hideAlert();

    // Get form data
    const coverLetter = document.getElementById('coverLetter').value.trim();
    const cvUrl = document.getElementById('cvUrl').value.trim();

    // Validate
    let isValid = true;

    if (!coverLetter) {
        showFieldError('coverLetter', 'Cover letter is required');
        isValid = false;
    } else if (coverLetter.length < 50) {
        showFieldError('coverLetter', 'Cover letter must be at least 50 characters');
        isValid = false;
    }

    if (!isValid) return;

    // Show loading state
    const btn = document.getElementById('submitApplicationBtn');
    const btnText = document.getElementById('submitApplicationBtnText');
    const btnLoader = document.getElementById('submitApplicationBtnLoader');
    
    btn.disabled = true;
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline-block';

    try {
        // Prepare application data
        const applicationData = {
            internshipId: currentInternship.id,
            coverLetter: coverLetter,
            cvUrl: cvUrl || null
        };

        // If file is selected, convert to base64 and include in request
        if (selectedFile) {
            try {
                const base64File = await fileToBase64(selectedFile);
                applicationData.cvFile = base64File;
                applicationData.cvFileName = selectedFile.name;
            } catch (error) {
                console.error('Error converting file:', error);
                showAlert('Error processing file. Please try again.', 'error');
                btn.disabled = false;
                btnText.style.display = 'inline';
                btnLoader.style.display = 'none';
                return;
            }
        }

        const response = await applyToInternship(applicationData);

        if (response.success) {
            showAlert('Application submitted successfully!', 'success');
            closeApplicationModal();
            
            // Disable apply button
            document.getElementById('applyBtn').disabled = true;
            document.getElementById('applyBtn').innerHTML = '<i class="fas fa-check"></i> Applied';
            
            setTimeout(() => {
                window.location.href = 'my-applications.html';
            }, 2000);
        } else {
            showAlert(response.message || 'Failed to submit application', 'error');
        }

    } catch (error) {
        console.error('Error submitting application:', error);
        
        let errorMessage = 'An error occurred. Please try again.';
        
        if (error.status === 409) {
            errorMessage = 'You have already applied to this internship.';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showAlert(errorMessage, 'error');

    } finally {
        btn.disabled = false;
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}