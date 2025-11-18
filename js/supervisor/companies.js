// ===== TrainUp - Supervisor Companies JavaScript =====

let allCompanies = [];
let selectedCompany = null;

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

    // Load supervisor info
    loadSupervisorInfo(userData);

    // Load companies
    await loadCompanies();
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
 * Load companies
 */
async function loadCompanies() {
    try {
        const response = await apiRequest('/supervisor/companies/pending', {
            method: 'GET'
        });

        if (response.success) {
            allCompanies = response.data || [];
            displayCompanies(allCompanies);
        } else {
            throw new Error('Failed to load companies');
        }

    } catch (error) {
        console.error('Error loading companies:', error);
        
        const container = document.getElementById('companiesList');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Companies</h3>
                <p>Please refresh the page to try again</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Refresh Page
                </button>
            </div>
        `;
    }
}

/**
 * Display companies
 */
function displayCompanies(companies) {
    const container = document.getElementById('companiesList');
    document.getElementById('companiesCount').textContent = companies.length;

    if (companies.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <h3>All Caught Up!</h3>
                <p>No companies pending verification</p>
            </div>
        `;
        return;
    }

    container.innerHTML = companies.map(company => {
        const profile = company.companyProfile || {};
        const initials = profile.companyName ? profile.companyName.substring(0, 2).toUpperCase() : 'C';
        const contactPerson = profile.contactPerson || {};
        
        return `
            <div class="internship-card">
                <div class="internship-header">
                    <div class="company-logo" style="font-size: 1.5rem;">
                        ${initials}
                    </div>
                    <div class="internship-title">
                        <h3>${profile.companyName || 'Company Name'}</h3>
                        <p class="company-name">
                            ${profile.industry || 'Industry'} • ${profile.companySize || 'N/A'} employees
                        </p>
                    </div>
                    <span class="status-badge submitted">Pending Verification</span>
                </div>

                <div style="background: var(--bg-secondary); padding: 1rem; border-radius: var(--radius-md); margin: 1rem 0;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">
                                Email
                            </strong>
                            <span>${company.email || 'N/A'}</span>
                        </div>
                        <div>
                            <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">
                                Location
                            </strong>
                            <span>${profile.location || 'N/A'}</span>
                        </div>
                        <div>
                            <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">
                                Phone
                            </strong>
                            <span>${profile.phoneNumber || 'N/A'}</span>
                        </div>
                        ${profile.website ? `
                            <div>
                                <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">
                                    Website
                                </strong>
                                <a href="${profile.website}" target="_blank" style="color: var(--primary-color);">
                                    <i class="fas fa-external-link-alt"></i> Visit
                                </a>
                            </div>
                        ` : ''}
                    </div>
                </div>

                ${profile.description ? `
                    <div style="margin: 1rem 0;">
                        <strong style="display: block; margin-bottom: 0.5rem;">
                            <i class="fas fa-info-circle"></i> About Company
                        </strong>
                        <p style="color: var(--text-secondary); line-height: 1.6;">
                            ${profile.description.substring(0, 200)}${profile.description.length > 200 ? '...' : ''}
                        </p>
                    </div>
                ` : ''}

                ${contactPerson.name ? `
                    <div style="background: #F0F9FF; padding: 1rem; border-radius: var(--radius-md); border-left: 4px solid var(--info-color); margin: 1rem 0;">
                        <strong style="display: block; margin-bottom: 0.5rem; color: var(--info-color);">
                            <i class="fas fa-user-tie"></i> Contact Person
                        </strong>
                        <div style="display: grid; gap: 0.5rem; color: var(--text-secondary);">
                            <div><strong>Name:</strong> ${contactPerson.name}</div>
                            ${contactPerson.position ? `<div><strong>Position:</strong> ${contactPerson.position}</div>` : ''}
                            ${contactPerson.email ? `<div><strong>Email:</strong> ${contactPerson.email}</div>` : ''}
                            ${contactPerson.phone ? `<div><strong>Phone:</strong> ${contactPerson.phone}</div>` : ''}
                        </div>
                    </div>
                ` : ''}

                <div style="color: var(--text-light); font-size: 0.875rem; margin: 1rem 0;">
                    <i class="fas fa-calendar"></i> Registered on ${formatDate(company.createdAt)}
                </div>

                <div class="internship-footer">
                    <div class="internship-actions">
                        <button class="btn btn-outline btn-sm" onclick="viewCompanyDetails('${company.id}')">
                            <i class="fas fa-eye"></i>
                            View Full Details
                        </button>
                        <button class="btn btn-outline btn-sm" onclick="quickReject('${company.id}')" 
                                style="border-color: var(--danger-color); color: var(--danger-color);">
                            <i class="fas fa-times"></i>
                            Reject
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="quickApprove('${company.id}')">
                            <i class="fas fa-check"></i>
                            Approve
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * View company details in modal
 */
function viewCompanyDetails(companyId) {
    selectedCompany = allCompanies.find(c => c.id === companyId);
    
    if (!selectedCompany) return;
    
    const profile = selectedCompany.companyProfile || {};
    const contactPerson = profile.contactPerson || {};
    
    document.getElementById('companyDetails').innerHTML = `
        <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%); color: white; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <div style="width: 100px; height: 100px; background: white; color: var(--primary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 700; margin: 0 auto 1rem;">
                ${profile.companyName ? profile.companyName.substring(0, 2).toUpperCase() : 'C'}
            </div>
            <h2 style="color: white; margin-bottom: 0.5rem;">${profile.companyName || 'Company Name'}</h2>
            <p style="opacity: 0.9;">${profile.industry || 'Industry'}</p>
        </div>

        <div style="display: grid; gap: 1.5rem;">
            <!-- Basic Information -->
            <div>
                <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                    <i class="fas fa-info-circle"></i> Basic Information
                </h3>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Email:</strong>
                        <span>${selectedCompany.email}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Industry:</strong>
                        <span>${profile.industry || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Company Size:</strong>
                        <span>${profile.companySize || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Location:</strong>
                        <span>${profile.location || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Phone:</strong>
                        <span>${profile.phoneNumber || 'N/A'}</span>
                    </div>
                    ${profile.website ? `
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                            <strong>Website:</strong>
                            <a href="${profile.website}" target="_blank" style="color: var(--primary-color);">
                                <i class="fas fa-external-link-alt"></i> Visit Website
                            </a>
                        </div>
                    ` : ''}
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                        <strong>Registered:</strong>
                        <span>${formatDate(selectedCompany.createdAt)}</span>
                    </div>
                </div>
            </div>

            <!-- Description -->
            ${profile.description ? `
                <div>
                    <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                        <i class="fas fa-align-left"></i> Company Description
                    </h3>
                    <p style="line-height: 1.8; color: var(--text-secondary);">
                        ${profile.description}
                    </p>
                </div>
            ` : ''}

            <!-- Contact Person -->
            ${contactPerson.name ? `
                <div>
                    <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                        <i class="fas fa-user-tie"></i> Contact Person
                    </h3>
                    <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-md);">
                        <div style="display: grid; gap: 0.75rem;">
                            <div style="display: flex; justify-content: space-between;">
                                <strong>Name:</strong>
                                <span>${contactPerson.name}</span>
                            </div>
                            ${contactPerson.position ? `
                                <div style="display: flex; justify-content: space-between;">
                                    <strong>Position:</strong>
                                    <span>${contactPerson.position}</span>
                                </div>
                            ` : ''}
                            ${contactPerson.email ? `
                                <div style="display: flex; justify-content: space-between;">
                                    <strong>Email:</strong>
                                    <span>${contactPerson.email}</span>
                                </div>
                            ` : ''}
                            ${contactPerson.phone ? `
                                <div style="display: flex; justify-content: space-between;">
                                    <strong>Phone:</strong>
                                    <span>${contactPerson.phone}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Setup modal buttons
    document.getElementById('approveBtn').onclick = () => approveCompanyFromModal();
    document.getElementById('rejectBtn').onclick = () => rejectCompanyFromModal();
    
    // Show modal
    document.getElementById('companyModal').classList.add('active');
}

/**
 * Close company modal
 */
function closeCompanyModal() {
    document.getElementById('companyModal').classList.remove('active');
    selectedCompany = null;
}

/**
 * Quick approve
 */
async function quickApprove(companyId) {
    if (!confirm('Are you sure you want to approve and verify this company?')) {
        return;
    }

    await approveCompany(companyId);
}

/**
 * Quick reject
 */
async function quickReject(companyId) {
    if (!confirm('Are you sure you want to reject this company registration?')) {
        return;
    }

    await rejectCompany(companyId);
}

/**
 * Approve company from modal
 */
async function approveCompanyFromModal() {
    if (!selectedCompany) return;
    
    closeCompanyModal();
    await approveCompany(selectedCompany.id);
}

/**
 * Reject company from modal
 */
async function rejectCompanyFromModal() {
    if (!selectedCompany) return;
    
    closeCompanyModal();
    await rejectCompany(selectedCompany.id);
}

/**
 * Approve company
 */
async function approveCompany(companyId) {
    try {
        showAlert('Approving company...', 'info');
        
        const response = await apiRequest(`/supervisor/companies/${companyId}/verify?approve=true`, {
            method: 'PUT'
        });

        if (response.success) {
            showAlert('Company verified and approved successfully!', 'success');
            await loadCompanies();
        } else {
            showAlert(response.message || 'Failed to approve company', 'error');
        }
    } catch (error) {
        console.error('Error approving company:', error);
        showAlert(error.message || 'Failed to approve company', 'error');
    }
}

/**
 * Reject company
 */
async function rejectCompany(companyId) {
    try {
        showAlert('Rejecting company...', 'info');
        
        const response = await apiRequest(`/supervisor/companies/${companyId}/verify?approve=false`, {
            method: 'PUT'
        });

        if (response.success) {
            showAlert('Company registration rejected successfully!', 'success');
            await loadCompanies();
        } else {
            showAlert(response.message || 'Failed to reject company', 'error');
        }
    } catch (error) {
        console.error('Error rejecting company:', error);
        showAlert(error.message || 'Failed to reject company', 'error');
    }
}
