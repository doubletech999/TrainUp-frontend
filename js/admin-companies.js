// ===== TrainUp - Admin Companies Management JavaScript =====

let allCompanies = [];
let filteredCompanies = [];
let selectedCompany = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '../login.html';
        return;
    }

    const userData = getUserData();
    if (userData.userType !== 'ADMIN') {
        showAlert('Access denied. Administrators only.', 'error');
        setTimeout(() => logout(), 2000);
        return;
    }

    // Load admin info
    loadAdminInfo(userData);

    // Load companies
    await loadCompanies();
});

/**
 * Load admin info
 */
function loadAdminInfo(userData) {
    const profile = userData.profile;
    if (profile) {
        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Administrator';
        const initials = getInitials(profile.firstName || 'A', profile.lastName || 'D');
        document.getElementById('userName').textContent = fullName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'AD';
}

/**
 * Load all companies
 */
async function loadCompanies() {
    try {
        const response = await apiRequest('/admin/companies', {
            method: 'GET'
        });

        if (response.success && response.data) {
            allCompanies = response.data;
            filteredCompanies = [...allCompanies];
            updateStats();
            populateIndustryFilter();
            displayCompanies(filteredCompanies);
        } else {
            throw new Error('Failed to load companies');
        }
    } catch (error) {
        console.error('Error loading companies:', error);
        
        // Load mock data as fallback
        loadMockData();
    }
}

/**
 * Load mock data for development/testing
 */
function loadMockData() {
    allCompanies = [
        {
            id: '1',
            email: 'techcorp@example.com',
            status: 'VERIFIED',
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            companyProfile: {
                companyName: 'TechCorp Solutions',
                industry: 'Technology',
                companySize: '50-100',
                location: 'Ramallah',
                phoneNumber: '+970 2 123 4567',
                website: 'https://techcorp.example.com',
                description: 'A leading technology company specializing in software development and digital solutions.',
                contactPerson: {
                    name: 'Ahmed Ali',
                    position: 'HR Manager',
                    email: 'ahmed@techcorp.example.com',
                    phone: '+970 59 123 4567'
                }
            }
        },
        {
            id: '2',
            email: 'innovate@example.com',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            companyProfile: {
                companyName: 'Innovate Labs',
                industry: 'Research & Development',
                companySize: '20-50',
                location: 'Nablus',
                phoneNumber: '+970 9 987 6543',
                website: 'https://innovate.example.com',
                description: 'Innovation-driven research lab focused on emerging technologies.',
                contactPerson: {
                    name: 'Sara Mohammad',
                    position: 'CEO',
                    email: 'sara@innovate.example.com',
                    phone: '+970 59 987 6543'
                }
            }
        },
        {
            id: '3',
            email: 'finance@example.com',
            status: 'VERIFIED',
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            companyProfile: {
                companyName: 'FinanceHub',
                industry: 'Finance',
                companySize: '100-500',
                location: 'Jerusalem',
                phoneNumber: '+970 2 555 1234',
                website: 'https://financehub.example.com',
                description: 'Financial services company providing banking and investment solutions.',
                contactPerson: {
                    name: 'Mohammad Hassan',
                    position: 'Operations Manager',
                    email: 'mohammad@financehub.example.com',
                    phone: '+970 59 555 1234'
                }
            }
        }
    ];
    
    filteredCompanies = [...allCompanies];
    updateStats();
    populateIndustryFilter();
    displayCompanies(filteredCompanies);
}

/**
 * Update statistics
 */
function updateStats() {
    const total = allCompanies.length;
    const verified = allCompanies.filter(c => c.status === 'VERIFIED').length;
    const pending = allCompanies.filter(c => c.status === 'PENDING').length;
    const rejected = allCompanies.filter(c => c.status === 'REJECTED').length;

    document.getElementById('totalCompanies').textContent = total;
    document.getElementById('verifiedCompanies').textContent = verified;
    document.getElementById('pendingCompanies').textContent = pending;
    document.getElementById('rejectedCompanies').textContent = rejected;
}

/**
 * Populate industry filter
 */
function populateIndustryFilter() {
    const industries = [...new Set(allCompanies
        .map(c => c.companyProfile?.industry)
        .filter(Boolean)
    )].sort();
    
    const select = document.getElementById('industryFilter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">All Industries</option>' +
        industries.map(ind => `<option value="${ind}">${ind}</option>`).join('');
    
    if (currentValue) {
        select.value = currentValue;
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
                <i class="fas fa-building"></i>
                <h3>No Companies Found</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }

    container.innerHTML = companies.map(company => {
        const profile = company.companyProfile || {};
        const initials = profile.companyName ? profile.companyName.substring(0, 2).toUpperCase() : 'C';
        const status = company.status || 'PENDING';
        const statusClass = status.toLowerCase();

        return `
            <div class="company-card">
                <div class="company-logo-large">${initials}</div>
                <div class="company-info">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <strong style="font-size: 1.1rem;">${profile.companyName || 'Company Name'}</strong>
                        <span class="company-status-badge ${statusClass}">${status}</span>
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.25rem;">
                        <i class="fas fa-envelope"></i> ${company.email}
                        ${profile.industry ? `<span style="margin-left: 1rem;"><i class="fas fa-industry"></i> ${profile.industry}</span>` : ''}
                        ${profile.location ? `<span style="margin-left: 1rem;"><i class="fas fa-map-marker-alt"></i> ${profile.location}</span>` : ''}
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.85rem;">
                        ${profile.companySize ? `<span><i class="fas fa-users"></i> ${profile.companySize} employees</span>` : ''}
                        ${company.createdAt ? `<span style="margin-left: 1rem;"><i class="fas fa-calendar"></i> Registered: ${formatDate(company.createdAt)}</span>` : ''}
                    </div>
                </div>
                <div class="company-actions">
                    <button class="btn btn-sm btn-outline" onclick="viewCompanyDetails('${company.id}')">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    ${status === 'PENDING' ? `
                        <button class="btn btn-sm btn-primary" onclick="quickApprove('${company.id}')">
                            <i class="fas fa-check"></i>
                            Approve
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="quickReject('${company.id}')" 
                                style="border-color: var(--danger-color); color: var(--danger-color);">
                            <i class="fas fa-times"></i>
                            Reject
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Filter companies
 */
function filterCompanies() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const industry = document.getElementById('industryFilter').value;

    filteredCompanies = allCompanies.filter(company => {
        const profile = company.companyProfile || {};
        const companyName = (profile.companyName || '').toLowerCase();
        const email = company.email.toLowerCase();
        const industryName = (profile.industry || '').toLowerCase();

        const matchesSearch = !searchTerm || 
            companyName.includes(searchTerm) || 
            email.includes(searchTerm) ||
            industryName.includes(searchTerm);
        const matchesStatus = !status || (company.status || 'PENDING') === status;
        const matchesIndustry = !industry || profile.industry === industry;

        return matchesSearch && matchesStatus && matchesIndustry;
    });

    displayCompanies(filteredCompanies);
}

/**
 * Reset filters
 */
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('industryFilter').value = '';
    filteredCompanies = [...allCompanies];
    displayCompanies(filteredCompanies);
}

/**
 * View company details in modal
 */
function viewCompanyDetails(companyId) {
    selectedCompany = allCompanies.find(c => c.id === companyId);
    
    if (!selectedCompany) return;
    
    const profile = selectedCompany.companyProfile || {};
    const contactPerson = profile.contactPerson || {};
    const status = selectedCompany.status || 'PENDING';
    
    document.getElementById('companyDetails').innerHTML = `
        <div style="text-align: center; padding: 2rem; background: var(--primary-gradient-elegant); color: white; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <div style="width: 100px; height: 100px; background: white; color: var(--primary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 700; margin: 0 auto 1rem;">
                ${profile.companyName ? profile.companyName.substring(0, 2).toUpperCase() : 'C'}
            </div>
            <h2 style="color: white; margin-bottom: 0.5rem;">${profile.companyName || 'Company Name'}</h2>
            <p style="opacity: 0.95; font-size: 1.125rem; font-weight: 500;">${profile.industry || 'Industry'}</p>
            <span class="company-status-badge ${status.toLowerCase()}" style="margin-top: 0.5rem; display: inline-block; background: rgba(255, 255, 255, 0.2); color: white;">
                ${status}
            </span>
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
                        <strong>Status:</strong>
                        <span class="company-status-badge ${status.toLowerCase()}">${status}</span>
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
    
    // Setup modal buttons based on status
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    const suspendBtn = document.getElementById('suspendCompanyBtn');
    const activateBtn = document.getElementById('activateCompanyBtn');
    const deleteBtn = document.getElementById('deleteCompanyBtn');
    
    // Hide all buttons first
    approveBtn.style.display = 'none';
    rejectBtn.style.display = 'none';
    suspendBtn.style.display = 'none';
    activateBtn.style.display = 'none';
    deleteBtn.style.display = 'none';
    
    if (status === 'PENDING') {
        approveBtn.style.display = 'inline-flex';
        rejectBtn.style.display = 'inline-flex';
    } else if (status === 'VERIFIED') {
        suspendBtn.style.display = 'inline-flex';
    } else if (status === 'SUSPENDED') {
        activateBtn.style.display = 'inline-flex';
    }
    
    deleteBtn.style.display = 'inline-flex';
    
    // Add event listeners
    approveBtn.onclick = () => approveCompanyFromModal();
    rejectBtn.onclick = () => rejectCompanyFromModal();
    suspendBtn.onclick = () => suspendCompany(selectedCompany.id);
    activateBtn.onclick = () => activateCompany(selectedCompany.id);
    deleteBtn.onclick = () => deleteCompany(selectedCompany.id);
    
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
        
        const response = await apiRequest(`/admin/companies/${companyId}/verify`, {
            method: 'PUT',
            body: JSON.stringify({ approve: true })
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
        
        const response = await apiRequest(`/admin/companies/${companyId}/verify`, {
            method: 'PUT',
            body: JSON.stringify({ approve: false })
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

/**
 * Suspend company
 */
async function suspendCompany(companyId) {
    if (!confirm('Are you sure you want to suspend this company?')) return;

    try {
        showAlert('Suspending company...', 'info');
        
        const response = await apiRequest(`/admin/companies/${companyId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'SUSPENDED' })
        });

        if (response.success) {
            showAlert('Company suspended successfully!', 'success');
            closeCompanyModal();
            await loadCompanies();
        } else {
            showAlert(response.message || 'Failed to suspend company', 'error');
        }
    } catch (error) {
        console.error('Error suspending company:', error);
        showAlert('Failed to suspend company', 'error');
    }
}

/**
 * Activate company
 */
async function activateCompany(companyId) {
    if (!confirm('Are you sure you want to activate this company?')) return;

    try {
        showAlert('Activating company...', 'info');
        
        const response = await apiRequest(`/admin/companies/${companyId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'VERIFIED' })
        });

        if (response.success) {
            showAlert('Company activated successfully!', 'success');
            closeCompanyModal();
            await loadCompanies();
        } else {
            showAlert(response.message || 'Failed to activate company', 'error');
        }
    } catch (error) {
        console.error('Error activating company:', error);
        showAlert('Failed to activate company', 'error');
    }
}

/**
 * Delete company
 */
async function deleteCompany(companyId) {
    if (!confirm('Are you sure you want to delete this company? This action cannot be undone!')) return;

    try {
        showAlert('Deleting company...', 'info');
        
        const response = await apiRequest(`/admin/companies/${companyId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showAlert('Company deleted successfully!', 'success');
            closeCompanyModal();
            await loadCompanies();
        } else {
            showAlert(response.message || 'Failed to delete company', 'error');
        }
    } catch (error) {
        console.error('Error deleting company:', error);
        showAlert('Failed to delete company', 'error');
    }
}

/**
 * Export companies
 */
function exportCompanies() {
    try {
        // Generate CSV data
        const headers = ['ID', 'Company Name', 'Email', 'Industry', 'Location', 'Status', 'Registered Date'];
        const rows = allCompanies.map(company => {
            const profile = company.companyProfile || {};
            return [
                company.id || '',
                profile.companyName || '',
                company.email || '',
                profile.industry || '',
                profile.location || '',
                company.status || 'PENDING',
                company.createdAt ? new Date(company.createdAt).toLocaleDateString() : ''
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `companies_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showAlert('Companies exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting companies:', error);
        showAlert('Failed to export companies', 'error');
    }
}

/**
 * Format date
 */
function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Make functions globally available
window.viewCompanyDetails = viewCompanyDetails;
window.closeCompanyModal = closeCompanyModal;
window.quickApprove = quickApprove;
window.quickReject = quickReject;
window.filterCompanies = filterCompanies;
window.resetFilters = resetFilters;
window.exportCompanies = exportCompanies;

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('companyModal');
    if (event.target === modal) {
        closeCompanyModal();
    }
};

