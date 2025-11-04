// ===== TrainUp - Company Applications JavaScript =====

let allApplications = [];
let currentFilter = 'all';
let selectedApplication = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in and is a company
    if (!isLoggedIn()) {
        window.location.href = '../../login.html';
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

    // Load applications
    await loadApplications();
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
 * Load applications
 */
async function loadApplications() {
    try {
        const response = await getCompanyApplications();

        if (response.success) {
            allApplications = response.data || [];
            displayApplications(allApplications);
        } else {
            throw new Error('Failed to load applications');
        }

    } catch (error) {
        console.error('Error loading applications:', error);
        
        const container = document.getElementById('applicationsList');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Applications</h3>
                <p>Please refresh the page to try again</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Refresh Page
                </button>
            </div>
        `;
    }
}

/**
 * Display applications
 */
function displayApplications(applications) {
    const container = document.getElementById('applicationsList');
    document.getElementById('applicationsCount').textContent = applications.length;

    if (applications.length === 0) {
        const message = currentFilter === 'all' 
            ? "No applications received yet"
            : `No ${formatStatus(currentFilter).toLowerCase()} applications found`;
            
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No Applications Found</h3>
                <p>${message}</p>
                ${currentFilter === 'all' ? `
                    <p style="margin-top: 1rem;">Post internships to start receiving applications</p>
                    <a href="create-internship.html" class="btn btn-primary">Post Internship</a>
                ` : ''}
            </div>
        `;
        return;
    }

    container.innerHTML = applications.map(app => {
        const student = app.student || {};
        const internship = app.internship || {};
        const initials = getInitials(student.firstName, student.lastName);
        
        return `
            <div class="student-card">
                <div class="student-header">
                    <div class="student-avatar">${initials}</div>
                    <div class="student-info">
                        <div style="display: flex; justify-content: space-between; align-items: start;">
                            <div>
                                <h3>${student.firstName || ''} ${student.lastName || ''}</h3>
                                <p style="color: var(--text-secondary); font-size: 0.875rem;">
                                    ${student.university || 'University'} - ${student.major || 'Major'}
                                </p>
                            </div>
                            <span class="status-badge ${app.status.toLowerCase().replace('_', '-')}">
                                ${formatStatus(app.status)}
                            </span>
                        </div>
                    </div>
                </div>

                <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1rem;">
                    <strong style="display: block; margin-bottom: 0.5rem;">
                        <i class="fas fa-briefcase"></i> Applied for: ${internship.title || 'Internship'}
                    </strong>
                </div>

                <div class="student-meta">
                    <div>
                        <i class="fas fa-id-card"></i>
                        <span>ID: ${student.studentId || 'N/A'}</span>
                    </div>
                    <div>
                        <i class="fas fa-envelope"></i>
                        <span>${student.email || 'N/A'}</span>
                    </div>
                    <div>
                        <i class="fas fa-calendar"></i>
                        <span>Applied ${formatDate(app.appliedDate)}</span>
                    </div>
                    ${app.reviewedDate ? `
                        <div>
                            <i class="fas fa-calendar-check"></i>
                            <span>Reviewed ${formatDate(app.reviewedDate)}</span>
                        </div>
                    ` : ''}
                </div>

                ${app.coverLetter ? `
                    <div style="margin: 1rem 0; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <strong style="display: block; margin-bottom: 0.5rem;">
                            <i class="fas fa-file-alt"></i> Cover Letter:
                        </strong>
                        <p style="color: var(--text-secondary); line-height: 1.6;">
                            ${app.coverLetter.substring(0, 200)}${app.coverLetter.length > 200 ? '...' : ''}
                        </p>
                    </div>
                ` : ''}

                ${app.companyNotes ? `
                    <div style="margin: 1rem 0; padding: 1rem; background: #FEF3C7; border-radius: var(--radius-md);">
                        <strong style="display: block; margin-bottom: 0.5rem; color: #92400E;">
                            <i class="fas fa-comment"></i> Your Notes:
                        </strong>
                        <p style="color: #92400E; line-height: 1.6;">
                            ${app.companyNotes}
                        </p>
                    </div>
                ` : ''}

                ${app.rejectionReason ? `
                    <div style="margin: 1rem 0; padding: 1rem; background: #FEE2E2; border-radius: var(--radius-md);">
                        <strong style="display: block; margin-bottom: 0.5rem; color: #991B1B;">
                            <i class="fas fa-info-circle"></i> Rejection Reason:
                        </strong>
                        <p style="color: #991B1B; line-height: 1.6;">
                            ${app.rejectionReason}
                        </p>
                    </div>
                ` : ''}

                <div class="action-buttons">
                    ${app.cvUrl || app.cvFileData ? `
                        <button class="btn btn-outline btn-sm" onclick="viewCV('${app.id}')">
                            <i class="fas fa-file-pdf"></i>
                            View CV
                        </button>
                    ` : ''}
                    <button class="btn btn-outline btn-sm" onclick="openReviewModal('${app.id}')">
                        <i class="fas fa-edit"></i>
                        Review Application
                    </button>
                    ${app.status === 'SUBMITTED' ? `
                        <button class="btn btn-primary btn-sm" onclick="quickAccept('${app.id}')">
                            <i class="fas fa-check"></i>
                            Quick Accept
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Filter applications
 */
function filterApplications(status) {
    currentFilter = status;
    
    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-filter="${status}"]`).classList.add('active');
    
    // Filter and display
    let filtered = allApplications;
    
    if (status !== 'all') {
        filtered = allApplications.filter(app => app.status === status);
    }
    
    displayApplications(filtered);
}

/**
 * View CV
 */
function viewCV(applicationId) {
    const app = allApplications.find(a => a.id === applicationId);
    

    if (!app) return;
    

    if (app.cvUrl) {
        // Open URL in new tab
        window.open(app.cvUrl, '_blank');
    } else if (app.cvFileData && app.cvFileName) {
        // Download Base64 file
        const link = document.createElement('a');
        link.href = app.cvFileData;
        link.download = app.cvFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        showAlert('CV not available', 'error');
    }
}

/**
 * Build CV preview HTML for the review modal
 */
function getCVPreviewHTML(application) {
    if (!application || (!application.cvFileData && !application.cvUrl)) {
        return '';
    }

    const fileName = (application.cvFileName || '').toLowerCase();
    let previewSource = '';
    let canPreview = false;

    if (application.cvFileData) {
        const dataUrl = application.cvFileData;
        if (dataUrl.startsWith('data:application/pdf')) {
            previewSource = dataUrl;
            canPreview = true;
        } else if (!fileName && dataUrl.startsWith('data:')) {
            // Attempt to infer from data URL when filename is missing
            canPreview = dataUrl.startsWith('data:application/pdf');
            if (canPreview) {
                previewSource = dataUrl;
            }
        }
    }

    if (!canPreview && application.cvUrl) {
        const lowerUrl = application.cvUrl.toLowerCase();
        if (lowerUrl.includes('.pdf')) {
            previewSource = application.cvUrl;
            canPreview = true;
        }
    }

    const previewContent = canPreview
        ? `<iframe
                src="${previewSource}"
                title="CV Preview"
                style="width: 100%; height: 420px; border: 1px solid var(--border-color); border-radius: var(--radius-md);"
            ></iframe>`
        : `<p style="color: var(--text-secondary);">Preview not available. Please use the button above to download or open the CV.</p>`;

    return `
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
            <strong style="display: block; margin-bottom: 0.75rem;">CV Preview</strong>
            ${previewContent}
        </div>
    `;
}

/**
 * Open review modal
 */
function openReviewModal(applicationId) {
    selectedApplication = allApplications.find(app => app.id === applicationId);
    
    if (!selectedApplication) return;
    
    const student = selectedApplication.student || {};
    const internship = selectedApplication.internship || {};
    
    // Display student details
    document.getElementById('applicationDetails').innerHTML = `
        <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 1rem;">${student.firstName} ${student.lastName}</h3>
            <div style="display: grid; gap: 0.75rem; font-size: 0.875rem;">
                <div><strong>Student ID:</strong> ${student.studentId || 'N/A'}</div>
                <div><strong>University:</strong> ${student.university || 'N/A'}</div>
                <div><strong>Major:</strong> ${student.major || 'N/A'}</div>
                <div><strong>Email:</strong> ${student.email || 'N/A'}</div>
                <div><strong>Applied for:</strong> ${internship.title || 'Internship'}</div>
                <div><strong>Applied on:</strong> ${formatDate(selectedApplication.appliedDate)}</div>
            </div>
            
            ${selectedApplication.coverLetter ? `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <strong style="display: block; margin-bottom: 0.5rem;">Cover Letter:</strong>
                    <p style="color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap;">
                        ${selectedApplication.coverLetter}
                    </p>
                </div>
            ` : ''}
        </div>
    `;
    
    // Display CV if available
    displayCV();
    
    document.getElementById('companyNotes').value = selectedApplication.companyNotes || '';
    document.getElementById('reviewModal').classList.add('active');
}

/**
 * Display CV in modal
 */
function displayCV() {
    const cvPreviewSection = document.getElementById('cvPreviewSection');
    const pdfViewer = document.getElementById('pdfViewer');
    const imageViewer = document.getElementById('imageViewer');
    const urlViewer = document.getElementById('urlViewer');
    
    // Hide all viewers first
    pdfViewer.style.display = 'none';
    imageViewer.style.display = 'none';
    urlViewer.style.display = 'none';
    cvPreviewSection.style.display = 'none';
    
    if (!selectedApplication) return;
    
    // Check if CV file data exists (uploaded file)
    if (selectedApplication.cvFileData) {
        cvPreviewSection.style.display = 'block';
        
        const fileName = selectedApplication.cvFileName || 'CV';
        document.getElementById('cvPreviewTitle').textContent = `CV Preview: ${fileName}`;
        
        // Check file type from base64 data
        if (selectedApplication.cvFileData.includes('data:application/pdf')) {
            // PDF file
            pdfViewer.style.display = 'block';
            document.getElementById('cvIframe').src = selectedApplication.cvFileData;
        } else if (selectedApplication.cvFileData.includes('data:image/')) {
            // Image file
            imageViewer.style.display = 'block';
            document.getElementById('cvImage').src = selectedApplication.cvFileData;
        } else {
            // Other file types - show download button
            pdfViewer.style.display = 'block';
            document.getElementById('cvIframe').style.display = 'none';
            pdfViewer.innerHTML = `
                <div style="padding: 3rem; text-align: center; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <i class="fas fa-file" style="font-size: 4rem; color: var(--primary-color); margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 0.5rem;">${fileName}</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Preview not available for this file type</p>
                    <button class="btn btn-primary" onclick="downloadCV()">
                        <i class="fas fa-download"></i>
                        Download CV
                    </button>
                </div>
            `;
        }
    } 
    // Check if CV URL exists
    else if (selectedApplication.cvUrl) {
        cvPreviewSection.style.display = 'block';
        document.getElementById('cvPreviewTitle').textContent = 'CV Link';
        
        urlViewer.style.display = 'block';
        document.getElementById('cvExternalLink').href = selectedApplication.cvUrl;
    }
}

/**
 * Download CV
 */
function downloadCV() {
    if (!selectedApplication) return;
    
    if (selectedApplication.cvFileData) {
        const link = document.createElement('a');
        link.href = selectedApplication.cvFileData;
        link.download = selectedApplication.cvFileName || 'CV.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showAlert('CV downloaded successfully!', 'success');
    } else if (selectedApplication.cvUrl) {
        window.open(selectedApplication.cvUrl, '_blank');
    } else {
        showAlert('CV not available', 'error');
    }
}

/**
 * Close review modal
 */
function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
    selectedApplication = null;
    document.getElementById('companyNotes').value = '';
}

/**
 * Update application status
 */
async function updateApplicationStatus(newStatus) {
    if (!selectedApplication) return;
    
    const notes = document.getElementById('companyNotes').value.trim();
    
    // Validate for rejection
    if (newStatus === 'REJECTED') {
        if (!notes) {
            showAlert('Please provide a reason for rejection in the notes', 'error');
            return;
        }
        if (!confirm('Are you sure you want to reject this application?')) {
            return;
        }
    }
    
    // Confirm for acceptance
    if (newStatus === 'ACCEPTED') {
        if (!confirm('Are you sure you want to accept this candidate?')) {
            return;
        }
    }
    
    try {
        showAlert('Updating application status...', 'info');
        
        const statusData = {
            status: newStatus,
            companyNotes: notes || null,
            rejectionReason: newStatus === 'REJECTED' ? notes : null
        };
        
        const response = await updateApplicationStatusAPI(selectedApplication.id, statusData);
        
        if (response.success) {
            showAlert(`Application ${formatStatus(newStatus).toLowerCase()} successfully!`, 'success');
            closeReviewModal();
            
            // Reload applications
            await loadApplications();
        } else {
            showAlert(response.message || 'Failed to update application', 'error');
        }
        
    } catch (error) {
        console.error('Error updating application:', error);
        showAlert(error.message || 'Failed to update application. Please try again.', 'error');
    }
}

/**
 * Quick accept
 */
async function quickAccept(applicationId) {
    if (!confirm('Are you sure you want to accept this candidate?')) {
        return;
    }
    
    selectedApplication = allApplications.find(app => app.id === applicationId);
    
    if (!selectedApplication) return;
    
    try {
        showAlert('Accepting application...', 'info');
        
        const statusData = {
            status: 'ACCEPTED',
            companyNotes: 'Accepted',
            rejectionReason: null
        };
        
        const response = await updateApplicationStatusAPI(applicationId, statusData);
        
        if (response.success) {
            showAlert('Application accepted successfully!', 'success');
            await loadApplications();
        } else {
            showAlert(response.message || 'Failed to accept application', 'error');
        }
        
    } catch (error) {
        console.error('Error accepting application:', error);
        showAlert(error.message || 'Failed to accept application. Please try again.', 'error');
    }
}

/**
 * Format status for display
 */
function formatStatus(status) {
    const statusMap = {
        'SUBMITTED': 'New',
        'UNDER_REVIEW': 'Under Review',
        'SHORTLISTED': 'Shortlisted',
        'ACCEPTED': 'Accepted',
        'REJECTED': 'Rejected',
        'WITHDRAWN': 'Withdrawn'
    };
    return statusMap[status] || status;
}