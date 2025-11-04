// ===== TrainUp - Internship Details JavaScript =====

let currentInternship = null;
let alreadyApplied = false;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
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

    // Load student info
    loadStudentInfo(userData);

    // Get internship ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const internshipId = urlParams.get('id');
    const autoApply = urlParams.get('apply') === 'true';

    if (!internshipId) {
        showAlert('Invalid internship ID', 'error');
        setTimeout(() => window.location.href = 'internships.html', 2000);
        return;
    }

    // Load internship details
    await loadInternshipDetails(internshipId);

    // Auto-open apply modal if requested
    if (autoApply && currentInternship && !alreadyApplied) {
        setTimeout(() => openApplyModal(), 500);
    }
});

/**
 * Load student info
 */
function loadStudentInfo(userData) {
    const profile = userData.profile;
    
    if (profile) {
        const fullName = `${profile.firstName} ${profile.lastName}`;
        const initials = getInitials(profile.firstName, profile.lastName);
        
        document.getElementById('studentName').textContent = fullName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

/**
 * Load internship details
 */
async function loadInternshipDetails(internshipId) {
    try {
        const response = await apiRequest(`/internships/${internshipId}`, {
            method: 'GET'
        });

        if (response.success) {
            currentInternship = response.data;
            
            // Check if already applied
            await checkIfApplied(internshipId);
            
            // Display internship
            displayInternship(currentInternship);
            
            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('internshipDetails').style.display = 'block';
        } else {
            throw new Error(response.message || 'Failed to load internship');
        }

    } catch (error) {
        console.error('Error loading internship:', error);
        document.getElementById('loadingState').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Internship</h3>
                <p>${error.message}</p>
                <a href="internships.html" class="btn btn-primary">
                    Back to Internships
                </a>
            </div>
        `;
    }
}

/**
 * Check if student already applied
 */
async function checkIfApplied(internshipId) {
    try {
        const response = await apiRequest('/applications/my-applications', {
            method: 'GET'
        });

        if (response.success) {
            const applications = response.data || [];
            alreadyApplied = applications.some(app => 
                app.internship && app.internship.id === internshipId
            );
        }
    } catch (error) {
        console.error('Error checking applications:', error);
    }
}

/**
 * Display internship
 */
function displayInternship(internship) {
    const company = internship.company || {};
    const companyInitials = company.name ? company.name.substring(0, 2).toUpperCase() : 'C';
    
    const isExpired = new Date(internship.applicationDeadline) < new Date();
    const canApply = !alreadyApplied && !isExpired && internship.status === 'ACTIVE';

    document.getElementById('internshipDetails').innerHTML = `
        <!-- Header Card -->
        <div style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%); color: white; padding: 3rem; border-radius: var(--radius-lg); margin-bottom: 2rem;">
            <div style="display: flex; align-items: start; gap: 2rem; flex-wrap: wrap;">
                <div style="width: 120px; height: 120px; background: white; color: var(--primary-color); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 700; flex-shrink: 0;">
                    ${companyInitials}
                </div>
                
                <div style="flex: 1; min-width: 250px;">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; flex-wrap: wrap;">
                        <h1 style="color: white; margin: 0;">${internship.title}</h1>
                        ${internship.featured ? `
                            <span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.75rem; border-radius: var(--radius-full); font-size: 0.875rem;">
                                <i class="fas fa-star"></i> Featured
                            </span>
                        ` : ''}
                    </div>
                    
                    <h2 style="color: rgba(255,255,255,0.9); font-size: 1.5rem; font-weight: 500; margin-bottom: 1.5rem;">
                        ${company.name || 'Company'}
                    </h2>
                    
                    <div style="display: flex; gap: 2rem; flex-wrap: wrap; font-size: 0.95rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${internship.location}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-clock"></i>
                            <span>${internship.duration} months</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-briefcase"></i>
                            <span>${internship.type || 'Full-time'}</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-users"></i>
                            <span>${internship.numberOfPositions} positions</span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 1rem; min-width: 200px;">
                    ${canApply ? `
                        <button class="btn" style="background: white; color: var(--primary-color); padding: 1rem 2rem; font-size: 1.1rem;" onclick="openApplyModal()">
                            <i class="fas fa-paper-plane"></i>
                            Apply Now
                        </button>
                    ` : alreadyApplied ? `
                        <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: var(--radius-md); text-align: center;">
                            <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                            <div>Already Applied</div>
                        </div>
                        <a href="applications.html" class="btn btn-outline" style="border-color: white; color: white;">
                            View Application
                        </a>
                    ` : isExpired ? `
                        <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: var(--radius-md); text-align: center;">
                            <i class="fas fa-times-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                            <div>Application Closed</div>
                        </div>
                    ` : `
                        <div style="background: rgba(255,255,255,0.2); padding: 1rem; border-radius: var(--radius-md); text-align: center;">
                            <i class="fas fa-info-circle" style="font-size: 2rem; margin-bottom: 0.5rem;"></i>
                            <div>Not Available</div>
                        </div>
                    `}
                    
                    <button class="btn btn-outline" style="border-color: white; color: white;" onclick="shareInternship()">
                        <i class="fas fa-share-alt"></i>
                        Share
                    </button>
                </div>
            </div>

            <!-- Deadline Warning -->
            ${!isExpired ? `
                <div style="background: rgba(255,255,255,0.15); padding: 1rem; border-radius: var(--radius-md); margin-top: 2rem; display: flex; align-items: center; gap: 1rem;">
                    <i class="fas fa-calendar-alt" style="font-size: 1.5rem;"></i>
                    <div>
                        <strong>Application Deadline:</strong> ${formatDate(internship.applicationDeadline)}
                        <div style="opacity: 0.9; font-size: 0.875rem; margin-top: 0.25rem;">
                            ${getDaysUntilDeadline(internship.applicationDeadline)} days remaining
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>

        <!-- Main Content Grid -->
        <div style="display: grid; gap: 2rem; grid-template-columns: 1fr 350px;">
            <!-- Left Column -->
            <div style="display: grid; gap: 2rem;">
                <!-- Description -->
                <div class="content-section">
                    <h2 style="margin-bottom: 1rem;">
                        <i class="fas fa-align-left"></i>
                        About This Internship
                    </h2>
                    <p style="line-height: 1.8; color: var(--text-secondary); white-space: pre-wrap;">
                        ${internship.description}
                    </p>
                </div>

                <!-- Requirements -->
                ${internship.requirements && internship.requirements.length > 0 ? `
                    <div class="content-section">
                        <h2 style="margin-bottom: 1rem;">
                            <i class="fas fa-clipboard-check"></i>
                            Requirements
                        </h2>
                        <ul style="list-style: none; padding: 0; display: grid; gap: 0.75rem;">
                            ${internship.requirements.map(req => `
                                <li style="display: flex; align-items: start; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); border-left: 4px solid var(--primary-color);">
                                    <i class="fas fa-check-circle" style="color: var(--success-color); margin-right: 1rem; margin-top: 0.25rem; flex-shrink: 0;"></i>
                                    <span>${req}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- Responsibilities -->
                ${internship.responsibilities && internship.responsibilities.length > 0 ? `
                    <div class="content-section">
                        <h2 style="margin-bottom: 1rem;">
                            <i class="fas fa-tasks"></i>
                            Responsibilities
                        </h2>
                        <ul style="list-style: none; padding: 0; display: grid; gap: 0.75rem;">
                            ${internship.responsibilities.map(resp => `
                                <li style="display: flex; align-items: start; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                                    <i class="fas fa-arrow-right" style="color: var(--primary-color); margin-right: 1rem; margin-top: 0.25rem; flex-shrink: 0;"></i>
                                    <span>${resp}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- Benefits -->
                ${internship.benefits && internship.benefits.length > 0 ? `
                    <div class="content-section">
                        <h2 style="margin-bottom: 1rem;">
                            <i class="fas fa-gift"></i>
                            What We Offer
                        </h2>
                        <ul style="list-style: none; padding: 0; display: grid; gap: 0.75rem;">
                            ${internship.benefits.map(benefit => `
                                <li style="display: flex; align-items: start; padding: 1rem; background: #F0F9FF; border-radius: var(--radius-md); border-left: 4px solid var(--info-color);">
                                    <i class="fas fa-star" style="color: var(--warning-color); margin-right: 1rem; margin-top: 0.25rem; flex-shrink: 0;"></i>
                                    <span>${benefit}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                ` : ''}

                <!-- Skills -->
                ${internship.skills && internship.skills.length > 0 ? `
                    <div class="content-section">
                        <h2 style="margin-bottom: 1rem;">
                            <i class="fas fa-tools"></i>
                            Required Skills
                        </h2>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                            ${internship.skills.map(skill => `
                                <span style="background: var(--primary-light); color: var(--primary-color); padding: 0.75rem 1.25rem; border-radius: var(--radius-full); font-weight: 500;">
                                    ${skill}
                                </span>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>

            <!-- Right Column (Sidebar) -->
            <div style="display: grid; gap: 1.5rem; height: fit-content; position: sticky; top: 2rem;">
                <!-- Company Card -->
                <div class="content-section">
                    <h3 style="margin-bottom: 1rem;">
                        <i class="fas fa-building"></i>
                        About ${company.name || 'Company'}
                    </h3>
                    
                    ${company.description ? `
                        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
                            ${company.description}
                        </p>
                    ` : ''}
                    
                    <div style="display: grid; gap: 0.75rem; font-size: 0.9rem; color: var(--text-secondary);">
                        ${company.industry ? `
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <i class="fas fa-industry" style="width: 20px;"></i>
                                <span>${company.industry}</span>
                            </div>
                        ` : ''}
                        ${company.companySize ? `
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <i class="fas fa-users" style="width: 20px;"></i>
                                <span>${company.companySize} employees</span>
                            </div>
                        ` : ''}
                        ${company.location ? `
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <i class="fas fa-map-marker-alt" style="width: 20px;"></i>
                                <span>${company.location}</span>
                            </div>
                        ` : ''}
                        ${company.website ? `
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <i class="fas fa-globe" style="width: 20px;"></i>
                                <a href="${company.website}" target="_blank" style="color: var(--primary-color);">
                                    Visit Website <i class="fas fa-external-link-alt" style="font-size: 0.75rem;"></i>
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Quick Info Card -->
                <div class="content-section" style="background: var(--bg-secondary);">
                    <h3 style="margin-bottom: 1rem;">
                        <i class="fas fa-info-circle"></i>
                        Quick Information
                    </h3>
                    
                    <div style="display: grid; gap: 0.75rem;">
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                            <span style="color: var(--text-secondary);">Duration:</span>
                            <strong>${internship.duration} months</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                            <span style="color: var(--text-secondary);">Type:</span>
                            <strong>${internship.type || 'Full-time'}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                            <span style="color: var(--text-secondary);">Positions:</span>
                            <strong>${internship.numberOfPositions}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                            <span style="color: var(--text-secondary);">Location:</span>
                            <strong>${internship.location}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                            <span style="color: var(--text-secondary);">Posted:</span>
                            <strong>${formatDate(internship.createdAt)}</strong>
                        </div>
                    </div>
                </div>

                <!-- Apply CTA Card -->
                ${canApply ? `
                    <div style="background: linear-gradient(135deg, var(--success-color) 0%, #059669 100%); color: white; padding: 1.5rem; border-radius: var(--radius-md); text-align: center;">
                        <i class="fas fa-rocket" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
                        <h3 style="color: white; margin-bottom: 0.5rem;">Ready to Apply?</h3>
                        <p style="opacity: 0.9; margin-bottom: 1.5rem; font-size: 0.9rem;">
                            Take the next step in your career journey
                        </p>
                        <button class="btn" style="background: white; color: var(--success-color); width: 100%;" onclick="openApplyModal()">
                            <i class="fas fa-paper-plane"></i>
                            Apply Now
                        </button>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

/**
 * Get days until deadline
 */
function getDaysUntilDeadline(deadline) {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

/**
 * Open apply modal
 */
function openApplyModal() {
    const userData = getUserData();
    const profile = userData.profile;

    // Show CV info
    const cvInfo = document.getElementById('cvInfo');
    if (profile && profile.cvUrl) {
        cvInfo.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-file-pdf" style="font-size: 2rem; color: var(--danger-color);"></i>
                    <div>
                        <strong>CV on file</strong>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">Ready to submit</div>
                    </div>
                </div>
                <a href="${profile.cvUrl}" target="_blank" class="btn btn-sm btn-outline">
                    <i class="fas fa-eye"></i>
                    View
                </a>
            </div>
        `;
    } else {
        cvInfo.innerHTML = `
            <div style="color: var(--warning-color); display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 1.5rem;"></i>
                <div>
                    <strong>No CV uploaded</strong>
                    <div style="font-size: 0.875rem;">Please upload your CV in profile settings</div>
                </div>
            </div>
        `;
    }

    // Setup submit button
    document.getElementById('submitApplicationBtn').onclick = submitApplication;

    // Show modal
    document.getElementById('applyModal').classList.add('active');
}

/**
 * Close apply modal
 */
function closeApplyModal() {
    document.getElementById('applyModal').classList.remove('active');
    document.getElementById('coverLetter').value = '';
}

/**
 * Submit application
 */
async function submitApplication() {
    const coverLetter = document.getElementById('coverLetter').value.trim();
    const userData = getUserData();
    const profile = userData.profile;

    // Validation
    if (!coverLetter) {
        showAlert('Please write a cover letter', 'error');
        return;
    }

    if (!profile || !profile.cvUrl) {
        showAlert('Please upload your CV before applying', 'error');
        return;
    }

    if (coverLetter.length < 100) {
        showAlert('Cover letter should be at least 100 characters', 'error');
        return;
    }

    try {
        showAlert('Submitting your application...', 'info');

        const response = await apiRequest('/applications/apply', {
            method: 'POST',
            body: JSON.stringify({
                internshipId: currentInternship.id,
                coverLetter: coverLetter
            })
        });

        if (response.success) {
            closeApplyModal();
            showAlert('Application submitted successfully! 🎉', 'success');
            
            // Mark as applied
            alreadyApplied = true;
            
            // Reload page to update UI
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } else {
            showAlert(response.message || 'Failed to submit application', 'error');
        }

    } catch (error) {
        console.error('Error submitting application:', error);
        showAlert(error.message || 'Failed to submit application', 'error');
    }
}

/**
 * Share internship
 */
function shareInternship() {
    const url = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: currentInternship.title,
            text: `Check out this internship at ${currentInternship.company?.name || 'this company'}!`,
            url: url
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            showAlert('Link copied to clipboard!', 'success');
        });
    }
}