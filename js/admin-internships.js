// ===== TrainUp - Admin Internships JavaScript =====

let allInternships = [];
let currentFilter = 'all';
let selectedInternship = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn() || getUserData().userType !== 'ADMIN') {
        window.location.href = '../../login.html';
        return;
    }

    loadAdminInfo(getUserData());
    await loadInternships();
});

function loadAdminInfo(userData) {
    const profile = userData.profile || {};
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Administrator';
    const initials = (profile.firstName?.[0] || 'A') + (profile.lastName?.[0] || 'D');
    document.getElementById('userName').textContent = fullName;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('userAvatar').textContent = initials.toUpperCase();
}

async function loadInternships() {
    try {
        const response = await apiRequest('/admin/internships', { method: 'GET' });

        if (response.success) {
            allInternships = response.data || [];
            updateStats();
            displayInternships(allInternships);
        } else {
            throw new Error('Failed to load internships');
        }

    } catch (error) {
        console.error('Error loading internships:', error);
        document.getElementById('internshipsList').innerHTML = `
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

function updateStats() {
    const total = allInternships.length;
    const pending = allInternships.filter(i => i.status === 'PENDING_REVIEW').length;
    const active = allInternships.filter(i => i.status === 'ACTIVE').length;
    const completed = allInternships.filter(i => i.status === 'COMPLETED').length;
    const rejected = allInternships.filter(i => i.status === 'REJECTED').length;

    document.getElementById('totalInternships').textContent = total;
    document.getElementById('pendingInternships').textContent = pending;
    document.getElementById('activeInternships').textContent = active;
    document.getElementById('archivedInternships').textContent = completed + rejected;

    document.getElementById('countAll').textContent = total;
    document.getElementById('countPending').textContent = pending;
    document.getElementById('countActive').textContent = active;
    document.getElementById('countCompleted').textContent = completed;
    document.getElementById('countRejected').textContent = rejected;
}

function filterInternships(status) {
    currentFilter = status;

    // Update active tab
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-filter="${status}"]`).classList.add('active');

    // Filter and display
    let filtered = allInternships;

    if (status !== 'all') {
        filtered = allInternships.filter(i => i.status === status);
    }

    displayInternships(filtered);
}

function displayInternships(internships) {
    const container = document.getElementById('internshipsList');

    if (internships.length === 0) {
        const message = currentFilter === 'all'
            ? 'No internships found'
            : `No ${formatStatus(currentFilter).toLowerCase()} internships found`;

        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-inbox"></i>
                <h3>No Internships</h3>
                <p>${message}</p>
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
                    <span class="status-badge ${getStatusClass(internship.status)}">
                        ${formatStatus(internship.status)}
                    </span>
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
                                <i class="fas fa-calendar"></i> Posted
                            </strong>
                            <span>${formatDate(internship.createdAt)}</span>
                        </div>
                    </div>
                </div>

                <div class="internship-footer">
                    <div class="internship-actions">
                        <button class="btn btn-outline btn-sm" onclick="viewDetails('${internship.id}')">
                            <i class="fas fa-eye"></i>
                            View Details
                        </button>
                        ${internship.status === 'PENDING_REVIEW' ? `
                            <button class="btn btn-outline btn-sm" onclick="quickReject('${internship.id}')"
                                    style="border-color: var(--danger-color); color: var(--danger-color);">
                                <i class="fas fa-times"></i>
                                Reject
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="quickApprove('${internship.id}')">
                                <i class="fas fa-check"></i>
                                Approve
                            </button>
                        ` : internship.status === 'ACTIVE' ? `
                            <button class="btn btn-outline btn-sm" onclick="archiveInternship('${internship.id}')"
                                    style="border-color: var(--warning-color); color: var(--warning-color);">
                                <i class="fas fa-archive"></i>
                                Archive
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getStatusClass(status) {
    const classMap = {
        'PENDING_REVIEW': 'submitted',
        'ACTIVE': 'accepted',
        'COMPLETED': 'under-review',
        'REJECTED': 'rejected'
    };
    return classMap[status] || 'submitted';
}

function formatStatus(status) {
    const statusMap = {
        'PENDING_REVIEW': 'Pending Review',
        'ACTIVE': 'Active',
        'COMPLETED': 'Completed',
        'REJECTED': 'Rejected'
    };
    return statusMap[status] || status;
}

function viewDetails(internshipId) {
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
                        <strong>Status:</strong>
                        <span class="status-badge ${getStatusClass(selectedInternship.status)}">
                            ${formatStatus(selectedInternship.status)}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                        <strong>Posted:</strong>
                        <span>${formatDate(selectedInternship.createdAt)}</span>
                    </div>
                </div>
            </div>

            <div>
                <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                    <i class="fas fa-align-left"></i> Description
                </h3>
                <p style="line-height: 1.8; color: var(--text-secondary); white-space: pre-wrap;">
                    ${selectedInternship.description}
                </p>
            </div>

            ${selectedInternship.requirements && selectedInternship.requirements.length > 0 ? `
                <div>
                    <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                        <i class="fas fa-clipboard-check"></i> Requirements
                    </h3>
                    <ul style="list-style: none; padding: 0; display: grid; gap: 0.5rem;">
                        ${selectedInternship.requirements.map(req => `
                            <li style="display: flex; align-items: start; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm);">
                                <i class="fas fa-check-circle" style="color: var(--success-color); margin-right: 0.75rem; margin-top: 0.25rem;"></i>
                                <span style="color: var(--text-secondary);">${req}</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            ` : ''}
        </div>
    `;

    // Setup modal buttons
    document.getElementById('approveBtn').onclick = () => approveInternshipFromModal();
    document.getElementById('rejectBtn').onclick = () => rejectInternshipFromModal();

    // Show modal
    document.getElementById('reviewModal').classList.add('active');
}

function closeReviewModal() {
    document.getElementById('reviewModal').classList.remove('active');
    selectedInternship = null;
}

async function quickApprove(internshipId) {
    if (!confirm('Are you sure you want to approve and publish this internship?')) {
        return;
    }

    await approveInternship(internshipId);
}

async function quickReject(internshipId) {
    const notes = prompt('Please provide a reason for rejection (required):');

    if (!notes || notes.trim() === '') {
        showAlert('Rejection reason is required', 'error');
        return;
    }

    await rejectInternship(internshipId, notes);
}

async function approveInternshipFromModal() {
    if (!selectedInternship) return;

    const notes = document.getElementById('adminNotes').value.trim();

    closeReviewModal();
    await approveInternship(selectedInternship.id, notes);
}

async function rejectInternshipFromModal() {
    if (!selectedInternship) return;

    const notes = document.getElementById('adminNotes').value.trim();

    if (!notes) {
        showAlert('Please provide feedback/reason for rejection', 'error');
        return;
    }

    closeReviewModal();
    await rejectInternship(selectedInternship.id, notes);
}

async function approveInternship(internshipId, notes = '') {
    try {
        showAlert('Approving internship...', 'info');

        let url = `/admin/internships/${internshipId}/approve`;
        const body = notes ? { notes } : {};

        const response = await apiRequest(url, {
            method: 'PUT',
            body: JSON.stringify(body)
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

async function rejectInternship(internshipId, notes) {
    try {
        showAlert('Rejecting internship...', 'info');

        const response = await apiRequest(`/admin/internships/${internshipId}/reject`, {
            method: 'PUT',
            body: JSON.stringify({ notes })
        });

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

async function archiveInternship(internshipId) {
    if (!confirm('Are you sure you want to archive this internship?')) {
        return;
    }

    try {
        showAlert('Archiving internship...', 'info');

        const response = await apiRequest(`/admin/internships/${internshipId}/archive`, {
            method: 'PUT'
        });

        if (response.success) {
            showAlert('Internship archived successfully!', 'success');
            await loadInternships();
        } else {
            showAlert(response.message || 'Failed to archive internship', 'error');
        }
    } catch (error) {
        console.error('Error archiving internship:', error);
        showAlert(error.message || 'Failed to archive internship', 'error');
    }
}
