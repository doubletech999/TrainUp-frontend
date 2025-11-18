// ===== TrainUp - Student Edit Profile JavaScript =====

let currentUserData = null;
let cvFile = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '../../pages/auth/login.html';
        return;
    }

    const userData = getUserData();
    
    if (userData.userType !== 'STUDENT') {
        showAlert('Access denied. Students only.', 'error');
        setTimeout(() => logout(), 2000);
        return;
    }

    currentUserData = userData;
    loadUserInfo(userData);
    await loadProfileData(userData);

    // Setup form submission
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', saveStudentProfile);
    }

    // Setup CV upload
    setupCVUpload();
});

function loadUserInfo(userData) {
    const profile = userData.profile;
    
    if (profile) {
        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Student';
        const initials = getInitials(profile.firstName || 'S', profile.lastName || 't');
        
        const studentNameEl = document.getElementById('studentName');
        const userEmailEl = document.getElementById('userEmail');
        const userAvatarEl = document.getElementById('userAvatar');
        
        if (studentNameEl) studentNameEl.textContent = fullName;
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
        const response = await apiRequest(API_ENDPOINTS.STUDENTS.PROFILE, {
            method: 'GET'
        });

        // Response structure: { success: true, data: StudentProfileResponse }
        const studentProfile = response.success && response.data 
            ? response.data 
            : (userData.profile || {});

        // Populate form fields
        document.getElementById('firstName').value = studentProfile.firstName || '';
        document.getElementById('lastName').value = studentProfile.lastName || '';
        document.getElementById('studentId').value = studentProfile.studentId || '';
        document.getElementById('phoneNumber').value = studentProfile.phoneNumber || '';
        document.getElementById('university').value = studentProfile.university || '';
        document.getElementById('major').value = studentProfile.major || '';
        document.getElementById('yearOfStudy').value = studentProfile.yearOfStudy || '';
        document.getElementById('gpa').value = studentProfile.gpa || '';
        document.getElementById('bio').value = studentProfile.bio || '';
        document.getElementById('skills').value = Array.isArray(studentProfile.skills) 
            ? studentProfile.skills.join(', ') 
            : (studentProfile.skills || '');
        document.getElementById('linkedinUrl').value = studentProfile.linkedinUrl || '';
        document.getElementById('githubUrl').value = studentProfile.githubUrl || '';

        // Show CV status if exists
        if (studentProfile.cvUrl) {
            const cvStatus = document.getElementById('cvStatus');
            const cvUploadArea = document.getElementById('cvUploadArea');
            if (cvStatus) {
                cvStatus.style.display = 'block';
                document.getElementById('cvFileName').textContent = 'CV uploaded';
            }
            if (cvUploadArea) {
                cvUploadArea.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading profile data:', error);
        // Use data from localStorage as fallback
        const profile = userData.profile || {};
        document.getElementById('firstName').value = profile.firstName || '';
        document.getElementById('lastName').value = profile.lastName || '';
        document.getElementById('studentId').value = profile.studentId || '';
        document.getElementById('phoneNumber').value = profile.phoneNumber || '';
        document.getElementById('university').value = profile.university || '';
        document.getElementById('major').value = profile.major || '';
        document.getElementById('yearOfStudy').value = profile.yearOfStudy || '';
        document.getElementById('gpa').value = profile.gpa || '';
        document.getElementById('bio').value = profile.bio || '';
        document.getElementById('skills').value = Array.isArray(profile.skills) 
            ? profile.skills.join(', ') 
            : (profile.skills || '');
        document.getElementById('linkedinUrl').value = profile.linkedinUrl || '';
        document.getElementById('githubUrl').value = profile.githubUrl || '';
    }
}

/**
 * Setup CV upload functionality
 */
function setupCVUpload() {
    const cvUploadArea = document.getElementById('cvUploadArea');
    const cvInput = document.getElementById('cvInput');

    if (!cvUploadArea || !cvInput) return;

    // Drag and drop
    cvUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        cvUploadArea.classList.add('drag-over');
    });

    cvUploadArea.addEventListener('dragleave', () => {
        cvUploadArea.classList.remove('drag-over');
    });

    cvUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        cvUploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleCVFile(files[0]);
        }
    });
}

/**
 * Handle CV file selection
 */
window.handleCVUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        handleCVFile(file);
    }
};

function handleCVFile(file) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
        showAlert('Invalid file type. Please upload PDF, DOC, or DOCX files only.', 'error');
        return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size exceeds 5MB limit.', 'error');
        return;
    }

    cvFile = file;
    
    // Update UI
    const cvStatus = document.getElementById('cvStatus');
    const cvUploadArea = document.getElementById('cvUploadArea');
    const uploadCVButtonText = document.getElementById('uploadCVButtonText');
    
    if (cvStatus) {
        cvStatus.style.display = 'block';
        document.getElementById('cvFileName').textContent = file.name;
    }
    if (uploadCVButtonText) {
        uploadCVButtonText.textContent = 'File selected: ' + file.name;
    }
    if (cvUploadArea) {
        cvUploadArea.style.borderColor = 'var(--success-color)';
        cvUploadArea.style.display = 'none'; // Hide upload area when file is selected
    }

    showAlert('CV file selected. Click Save to upload.', 'success');
}

/**
 * Save student profile
 */
async function saveStudentProfile(event) {
    event.preventDefault();

    // Get form values
    const firstName = document.getElementById('firstName').value.trim();
    const lastName = document.getElementById('lastName').value.trim();
    const studentId = document.getElementById('studentId').value.trim();
    const phoneNumber = document.getElementById('phoneNumber').value.trim();
    const university = document.getElementById('university').value.trim();
    const major = document.getElementById('major').value.trim();
    const yearOfStudy = document.getElementById('yearOfStudy').value;
    const gpa = document.getElementById('gpa').value;
    const bio = document.getElementById('bio').value.trim();
    const skillsText = document.getElementById('skills').value.trim();
    const linkedinUrl = document.getElementById('linkedinUrl').value.trim();
    const githubUrl = document.getElementById('githubUrl').value.trim();

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
    if (!studentId) {
        document.getElementById('studentIdError').textContent = 'Student ID is required';
        isValid = false;
    }
    if (!university) {
        document.getElementById('universityError').textContent = 'University is required';
        isValid = false;
    }
    if (!major) {
        document.getElementById('majorError').textContent = 'Major is required';
        isValid = false;
    }

    if (!isValid) {
        showAlert('Please fill in all required fields.', 'error');
        return;
    }

    // Parse skills
    const skills = skillsText 
        ? skillsText.split(',').map(s => s.trim()).filter(s => s.length > 0)
        : [];

    // Prepare profile data
    const profileData = {
        firstName,
        lastName,
        studentId,
        phoneNumber: phoneNumber || null,
        university,
        major,
        yearOfStudy: yearOfStudy || null,
        gpa: gpa ? parseFloat(gpa) : null,
        bio: bio || null,
        skills: skills.length > 0 ? skills : null,
        linkedinUrl: linkedinUrl || null,
        githubUrl: githubUrl || null
    };

    try {
        setButtonLoading('saveBtn', true);
        showAlert('Saving profile...', 'info');

        // Upload CV if selected
        if (cvFile) {
            try {
                showAlert('Uploading CV...', 'info');
                const formData = new FormData();
                formData.append('file', cvFile);
                
                const uploadResponse = await apiRequest(API_ENDPOINTS.FILES.UPLOAD_CV, {
                    method: 'POST',
                    body: formData,
                    headers: {} // Let browser set Content-Type for FormData
                });

                if (uploadResponse.success && uploadResponse.data) {
                    // Get CV URL from response - backend returns fileUrl
                    const cvUrl = uploadResponse.data.fileUrl || uploadResponse.data.url || uploadResponse.data.cvUrl;
                    if (cvUrl) {
                        profileData.cvUrl = cvUrl;
                        showAlert('CV uploaded successfully!', 'success');
                    } else {
                        throw new Error('CV uploaded but URL not returned');
                    }
                } else {
                    throw new Error(uploadResponse.message || 'Failed to upload CV');
                }
            } catch (uploadError) {
                console.error('Error uploading CV:', uploadError);
                showAlert('Profile saved but CV upload failed: ' + (uploadError.message || 'Unknown error'), 'warning');
            }
        }

        // Update profile
        const response = await apiRequest(API_ENDPOINTS.STUDENTS.UPDATE_PROFILE, {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });

        if (response.success) {
            showAlert('Profile updated successfully!', 'success');
            
            // Update local storage with complete profile data including cvUrl
            if (currentUserData && response.data) {
                // Ensure cvUrl is included - prioritize from upload, then response, then existing
                const updatedCvUrl = profileData.cvUrl || response.data.cvUrl || currentUserData.profile?.cvUrl;
                
                currentUserData.profile = {
                    ...currentUserData.profile,
                    ...response.data,
                    cvUrl: updatedCvUrl
                };
                localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(currentUserData));
                
                // Update UI to show CV status if cvUrl exists
                if (updatedCvUrl) {
                    const cvStatus = document.getElementById('cvStatus');
                    const cvUploadArea = document.getElementById('cvUploadArea');
                    if (cvStatus) {
                        cvStatus.style.display = 'block';
                        document.getElementById('cvFileName').textContent = 'CV uploaded';
                    }
                    if (cvUploadArea) {
                        cvUploadArea.style.display = 'none';
                    }
                }
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

