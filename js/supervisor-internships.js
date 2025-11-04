// ===== TrainUp - Supervisor Internships JavaScript =====

let allInternships = [];
let selectedInternship = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '../../login.html';
        return;
    }

    const userData = getUserData();
    if (userData.userType !== 'SUPERVISOR') {
        showAlert('Access denied. Supervisors only.', 'error');
        setTimeout(() => logout(), 2000);
        return;
    }

    // Load supervisor info
    loadSupervisorInfo(userData);

    // Load internships
    await loadInternships();
});

/**
 * Load supervisor info
 */
function loadSupervisorInfo(userData) {
    const profile = userData.profile;
    
    if (profile) {
        const fullName = `${profile.firstName} ${profile.lastName}`;
        const initials = getInitials(profile.firstName, profile.lastName);
        
        document.getElementById('supervisorName').textContent = fullName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

/**
 * Load internships
 */
async function loadInternships() {
    try {
        const response = await apiRequest('/supervisor/internships/pending', {
            method: 'GET'
        });

        if (response.success) {
            allInternships = response.data || [];
            displayInternships(allInternships);
        } else {
            throw new Error('Failed to load internships');
        }

    } catch (error) {
        console.error('Error loading internships:', error);
        
        const container = document.getElementById('internshipsList');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Internships</h3>
                <p>Please refresh the page to try again</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Refresh Page
                </button>
            </div>
        `;
    }
}

/**
 * Display internships
 */
function displayInternships(internships) {
    const container = document.getElementById('internshipsList');
    document.getElementById('internshipsCount').textContent = internships.length;

    if (internships.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>All Caught Up!</h3>
                <p>No internships pending review</p>
            </div>
        `;
        return;
    }

    container.innerHTML = internships.map(internship => {
        const company = internship.company || {};
        const companyInitials = company.name ? company.name.substring(0, 2).toUpperCase() : 'C';
        
        return `
            <div class="internship-card">
                <div class="internship-header">
                    <div class="company-logo" style="font-size: 1.5rem;">
                        ${companyInitials}
                    </div>
                    <div class="internship-title">
                        <h3>${internship.title}</h3>
                        <p class="company-name">${company.name || 'Company'}</p>
                    </div>
                    <span class="status-badge submitted">Pending Review</span>
                </div>

                <p style="margin: 1rem 0; color: var(--text-secondary); line-height: 1.6;">
                    ${internship.description.substring(0, 200)}${internship.description.length > 200 ? '...' : ''}
                </p>

                <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); margin: 1rem 0;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">
                                <i class="fas fa-map-marker-alt"></i> Location
                            </strong>
                            <span>${internship.location}</span>
                        </div>
                        <div>
                            <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">
                                <i class="fas fa-clock"></i> Duration
                            </strong>
                            <span>${internship.duration} months</span>
                        </div>
                        <div>
                            <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">
                                <i class="fas fa-users"></i> Positions
                            </strong>
                            <span>${internship.numberOfPositions} available</span>
                        </div>
                        <div>
                            <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">
                                <i class="fas fa-calendar"></i> Deadline
                            </strong>
                            <span>${formatDate(internship.applicationDeadline)}</span>
                        </div>
                    </div>
                </div>

                ${internship.requirements && internship.requirements.length > 0 ? `
                    <div style="margin: 1rem 0;">
                        <strong style="display: block; margin-bottom: 0.5rem;">
                            <i class="fas fa-clipboard-check"></i> Requirements
                        </strong>
                        <ul style="list-style: none; padding: 0; display: grid; gap: 0.5rem;">
                            ${internship.requirements.slice(0, 3).map(req => `
                                <li style="display: flex; align-items: start; color: var(--text-secondary);">
                                    <i class="fas fa-check" style="color: var(--success-color); margin-right: 0.5rem; margin-top: 0.25rem;"></i>
                                    <span>${req}</span>
                                </li>
                            `).join('')}
                            ${internship.requirements.length > 3 ? `
                                <li style="color: var(--primary-color); cursor: pointer;" onclick="viewInternshipDetails('${internship.id}')">
                                    <i class="fas fa-plus"></i> View ${internship.requirements.length - 3} more requirements
                                </li>
                            ` : ''}
                        </ul>
                    </div>
                ` : ''}

                ${internship.skills && internship.skills.length > 0 ? `
                    <div class="internship-tags">
                        ${internship.skills.slice(0, 5).map(skill => 
                            `<span class="tag">${skill}</span>`
                        ).join('')}
                        ${internship.skills.length > 5 ? `
                            <span class="tag" style="background: var(--primary-color); color: white;">
                                +${internship.skills.length - 5} more
                            </span>
                        ` : ''}
                    </div>
                ` : ''}

                <div style="color: var(--text-light); font-size: 0.875rem; margin: 1rem 0;">
                    <i class="fas fa-calendar-plus"></i> Posted on ${formatDate(internship.createdAt)}
                </div>

                <div class="internship-footer">
                    <div class="internship-actions">
                        <button class="btn btn-outline btn-sm" onclick="viewInternshipDetails('${internship.id}')">
                            <i class="fas fa-eye"></i>
                            View Full Details
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="quickReject('${internship.id}')" 
                                style="border-color: var(--danger-color); color: var(--danger-color);">
                            <i class="fas fa-times"></i>
                            Reject
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="quickApprove('${internship.id}')">
                            <i class="fas fa-check"></i>
                            Approve & Publish
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * View internship details in modal
 */
function viewInternshipDetails(internshipId) {
    selectedInternship = allInternships.find(i => i.id === internshipId);
    
    if (!selectedInternship) return;
    
    const company = selectedInternship.company || {};
    
    document.getElementById('internshipDetails').innerHTML = `
        <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%); color: white; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <div style="width: 100px; height: 100px; background: white; color: var(--primary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 700; margin: 0 auto 1rem;">
                ${company.name ? company.name.substring(0, 2).toUpperCase() : 'C'}
            </div>
            <h2 style="color: white; margin-bottom: 0.5rem;">${selectedInternship.title}</h2>
            <p style="opacity: 0.9;">${company.name || 'Company'}</p>
        </div>

        <div style="display: grid; gap: 1.5rem;">
            <!-- Basic Information -->
            <div>
                <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                    <i class="fas fa-info-circle"></i> Basic Information
                </h3>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Location:</strong>
                        <span>${selectedInternship.location}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Duration:</strong>
                        <span>${selectedInternship.duration} months</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Positions:</strong>
                        <span>${selectedInternship.numberOfPositions} available</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Type:</strong>
                        <span>${selectedInternship.type || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Application Deadline:</strong>
                        <span>${formatDate(selectedInternship.applicationDeadline)}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                        <strong>Posted:</strong>
                        <span>${formatDate(selectedInternship.createdAt)}</span>
                    </div>
                </div>
            </div>

            <!-- Description -->
            <div>
                <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                    <i class="fas fa-align-left"></i> Description
                </h3>
                <p style="line-height: 1.8; color: var(--text-secondary); white-space: pre-wrap;">
                    ${selectedInternship.description}
                </p>
            </div>

            <!-- Requirements -->
            ${selectedInternship.requirements && selectedInternship.requirements.length > 0 ? `
                <div>
                    <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                        <i class="fas fa-clipboard-check"></i> Requirements
                    </h3>
                    <ul style="list-style: none; padding: 0; display: grid; gap: 0.75rem;">
                        ${selectedInternship.requirements.map(req => `
                            <li style="display: flex; align-items: start; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm);">
                                <i class="fas fa-check-circle" style="color: var(--success-color); margin-right: 0.75rem; margin-top: 0.25rem;"></i>
                                <span style="color: var(--text-secondary);">${req}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Skills -->
            ${selectedInternship.skills && selectedInternship.skills.length > 0 ? `
                <div>
                    <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                        <i class="fas fa-tools"></i> Required Skills
                    </h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${selectedInternship.skills.map(skill => `
                            <span style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-full); font-size: 0.875rem; font-weight: 500;">
                                ${skill}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Responsibilities -->
            ${selectedInternship.responsibilities && selectedInternship.responsibilities.length > 0 ? `
                <div>
                    <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                        <i class="fas fa-tasks"></i> Responsibilities
                    </h3>
                    <ul style="list-style: none; padding: 0; display: grid; gap: 0.75rem;">
                        ${selectedInternship.responsibilities.map(resp => `
                            <li style="display: flex; align-items: start; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm);">
                                <i class="fas fa-arrow-right" style="color: var(--primary-color); margin-right: 0.75rem; margin-top: 0.25rem;"></i>
                                <span style="color: var(--text-secondary);">${resp}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Benefits -->
            ${selectedInternship.benefits && selectedInternship.benefits.length > 0 ? `
                <div>
                    <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                        <i class="fas fa-gift"></i> Benefits
                    </h3>
                    <ul style="list-style: none; padding: 0; display: grid; gap: 0.75rem;">
                        ${selectedInternship.benefits.map(benefit => `
                            <li style="display: flex; align-items: start; padding: 0.75rem; background: #F0F9FF; border-radius: var(--radius-sm); border-left: 4px solid var(--info-color);">
                                <i class="fas fa-star" style="color: var(--warning-color); margin-right: 0.75rem; margin-top: 0.25rem;"></i>
                                <span style="color: var(--text-secondary);">${benefit}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}

            <!-- Company Information -->
            <div>
                <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                    <i class="fas fa-building"></i> About Company
                </h3>
                <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-md);">
                    <h4 style="margin-bottom: 0.75rem;">${company.name || 'Company'}</h4>
                    ${company.description ? `
                        <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
                            ${company.description}
                        </p>
                    ` : ''}
                    <div style="display: grid; gap: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                        ${company.industry ? `<div><i class="fas fa-industry"></i> ${company.industry}</div>` : ''}
                        ${company.location ? `<div><i class="fas fa-map-marker-alt"></i> ${company.location}</div>` : ''}
                        ${company.website ? `
                            <div>
                                <i class="fas fa-globe"></i> 
                                <a href="${company.website}" target="_blank" style="color: var(--primary-color);">
                                    Visit Website
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Clear previous notes
    document.getElementById('reviewNotes').value = '';
    
    // Setup modal buttons
    document.getElementById('approveBtn').onclick = () => approveInternshipFromModal();
    document.getElementById('rejectBtn').onclick = () => rejectInternshipFromModal();
    
    // Show modal
    document.getElementById('reviewModal').classList.add('active');
}

/**
 * Close review modal
 */
function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
    selectedInternship = null;
}

/**
 * Quick approve
 */
async function quickApprove(internshipId) {
    if (!confirm('Are you sure you want to approve and publish this internship?')) {
        return;
    }

    await approveInternship(internshipId);
}

/**
 * Quick reject
 */
async function quickReject(internshipId) {
    const notes = prompt('Please provide a reason for rejection (required):');
    
    if (!notes || notes.trim() === '') {
        showAlert('Rejection reason is required', 'error');
        return;
    }

    await rejectInternship(internshipId, notes);
}

/**
 * Approve internship from modal
 */
async function approveInternshipFromModal() {
    if (!selectedInternship) return;
    
    const notes = document.getElementById('reviewNotes').value.trim();
    
    closeReviewModal();
    await approveInternship(selectedInternship.id, notes);
}

/**
 * Reject internship from modal
 */
async function rejectInternshipFromModal() {
    if (!selectedInternship) return;
    
    const notes = document.getElementById('reviewNotes').value.trim();
    
    if (!notes) {
        showAlert('Please provide feedback/reason for rejection', 'error');
        return;
    }
    
    closeReviewModal();
    await rejectInternship(selectedInternship.id, notes);
}

/**
 * Approve internship
 */
async function approveInternship(internshipId, notes = '') {
    try {
        showAlert('Approving internship...', 'info');
        
        let url = `/supervisor/internships/${internshipId}/review?approve=true`;
        if (notes) {
            url += `&notes=${encodeURIComponent(notes)}`;
        }
        
        const response = await apiRequest(url, {
            method: 'PUT'
        });

        if (response.success) {
            showAlert('Internship approved and published successfully!', 'success');
            await loadInternships();
        } else {
            showAlert(response.message || 'Failed to approve internship', 'error');
        }
    } catch (error) {
        console.error('Error approving internship:', error);
        showAlert(error.message || 'Failed to approve internship', 'error');
    }
}

/**
 * Reject internship
 */
async function rejectInternship(internshipId, notes) {
    try {
        showAlert('Rejecting internship...', 'info');
        
        const response = await apiRequest(
            `/supervisor/internships/${internshipId}/review?approve=false&notes=${encodeURIComponent(notes)}`,
            {
                method: 'PUT'
            }
        );

        if (response.success) {
            showAlert('Internship rejected successfully!', 'success');
            await loadInternships();
        } else {
            showAlert(response.message || 'Failed to reject internship', 'error');
        }
    } catch (error) {
        console.error('Error rejecting internship:', error);
        showAlert(error.message || 'Failed to reject internship', 'error');
    }
}