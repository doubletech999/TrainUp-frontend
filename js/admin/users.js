// ===== TrainUp - Admin Users Management JavaScript =====

let allUsers = [];
let filteredUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '../../pages/auth/login.html';
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

    // Load users
    await loadUsers();
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
 * Load all users
 */
async function loadUsers() {
    try {
        const response = await apiRequest('/admin/users', {
            method: 'GET'
        });

        if (response.success && response.data) {
            allUsers = response.data;
            filteredUsers = [...allUsers];
            updateStats();
            displayUsers(filteredUsers);
        } else {
            throw new Error('Failed to load users');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to Load Users</h3>
                <p>Please try again later</p>
            </div>
        `;
    }
}

/**
 * Update statistics
 */
function updateStats() {
    const total = allUsers.length;
    const students = allUsers.filter(u => u.userType === 'STUDENT').length;
    const companies = allUsers.filter(u => u.userType === 'COMPANY').length;
    const supervisors = allUsers.filter(u => u.userType === 'SUPERVISOR').length;

    document.getElementById('totalUsers').textContent = total;
    document.getElementById('totalStudents').textContent = students;
    document.getElementById('totalCompanies').textContent = companies;
    document.getElementById('totalSupervisors').textContent = supervisors;
}

/**
 * Display users
 */
function displayUsers(users) {
    const container = document.getElementById('usersList');
    document.getElementById('usersCount').textContent = users.length;

    if (users.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Users Found</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }

    container.innerHTML = users.map(user => {
        const profile = user.profile || {};
        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.email;
        const initials = getInitials(profile.firstName || 'U', profile.lastName || 'S');
        const userType = user.userType.toLowerCase();
        
        // Determine user status
        const isActive = user.isActive !== undefined ? user.isActive : (user.status !== 'SUSPENDED' && user.status !== 'INACTIVE');
        const statusText = isActive ? 'ACTIVE' : 'Suspend User';
        const statusClass = isActive ? 'active' : 'inactive';

        return `
            <div class="user-card">
                <div class="user-avatar-large">${initials}</div>
                <div class="user-info">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <strong>${fullName}</strong>
                        <span class="user-type-badge ${userType}">${user.userType}</span>
                        <span class="user-status-badge ${statusClass}">${statusText}</span>
                    </div>
                    <div style="color: var(--text-secondary); font-size: 0.9rem;">
                        <i class="fas fa-envelope"></i> ${user.email}
                        ${profile.university ? `<span style="margin-left: 1rem;"><i class="fas fa-university"></i> ${profile.university}</span>` : ''}
                        ${profile.company ? `<span style="margin-left: 1rem;"><i class="fas fa-building"></i> ${profile.company}</span>` : ''}
                    </div>
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">
                        Registered: ${formatDate(user.createdAt)}
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn btn-sm btn-outline" onclick="viewUser('${user.id}')">
                        <i class="fas fa-eye"></i>
                        View
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                        Edit
                    </button>
                    ${isActive ? `
                        <button class="btn btn-sm btn-warning" onclick="updateUserStatus('${user.id}', false)" title="Suspend User">
                            <i class="fas fa-ban"></i>
                            Suspend
                        </button>
                    ` : `
                        <button class="btn btn-sm btn-success" onclick="updateUserStatus('${user.id}', true)" title="Activate User">
                            <i class="fas fa-check"></i>
                            Activate
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Filter users
 */
function filterUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const userType = document.getElementById('userTypeFilter').value;
    const status = document.getElementById('statusFilter').value;

    filteredUsers = allUsers.filter(user => {
        const profile = user.profile || {};
        const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.toLowerCase();
        const email = user.email.toLowerCase();

        const matchesSearch = !searchTerm || fullName.includes(searchTerm) || email.includes(searchTerm);
        const matchesType = !userType || user.userType === userType;
        const matchesStatus = !status || (user.status || 'ACTIVE') === status;

        return matchesSearch && matchesType && matchesStatus;
    });

    displayUsers(filteredUsers);
}

/**
 * Reset filters
 */
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('userTypeFilter').value = '';
    document.getElementById('statusFilter').value = '';
    filteredUsers = [...allUsers];
    displayUsers(filteredUsers);
}

/**
 * View user details
 */
async function viewUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    const modal = document.getElementById('userModal');
    const details = document.getElementById('userDetails');
    const profile = user.profile || {};
    const isVerified = user.isVerified !== false;

    // Determine user status
    const isActive = user.isActive !== undefined ? user.isActive : (user.status !== 'SUSPENDED' && user.status !== 'INACTIVE');
    const statusText = isActive ? 'ACTIVE' : 'Suspend User';
    const statusClass = isActive ? 'active' : 'inactive';

    details.innerHTML = `
        <div style="display: grid; gap: 1.5rem;">
            <div>
                <h3>Basic Information</h3>
                <div style="display: grid; gap: 0.75rem; margin-top: 1rem;">
                    <div><strong>Email:</strong> ${user.email}</div>
                    <div><strong>User Type:</strong> <span class="user-type-badge ${user.userType.toLowerCase()}">${user.userType}</span></div>
                    <div><strong>Status:</strong> <span class="user-status-badge ${statusClass}">${statusText}</span></div>
                    <div><strong>Verification:</strong> <span class="user-status-badge ${isVerified ? 'active' : 'pending'}">${isVerified ? 'Verified' : 'Pending'}</span></div>
                    <div><strong>Registered:</strong> ${formatDate(user.createdAt)}</div>
                </div>
            </div>

            ${profile.firstName || profile.lastName ? `
                <div>
                    <h3>Profile Information</h3>
                    <div style="display: grid; gap: 0.75rem; margin-top: 1rem;">
                        ${profile.firstName ? `<div><strong>First Name:</strong> ${profile.firstName}</div>` : ''}
                        ${profile.lastName ? `<div><strong>Last Name:</strong> ${profile.lastName}</div>` : ''}
                        ${profile.phoneNumber ? `<div><strong>Phone:</strong> ${profile.phoneNumber}</div>` : ''}
                        ${profile.university ? `<div><strong>University:</strong> ${profile.university}</div>` : ''}
                        ${profile.company ? `<div><strong>Company:</strong> ${profile.company}</div>` : ''}
                        ${profile.bio ? `<div><strong>Bio:</strong> ${profile.bio}</div>` : ''}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    // Show appropriate action buttons
    const verifyBtn = document.getElementById('verifyUserBtn');
    if (verifyBtn) {
        if (!isVerified) {
            verifyBtn.style.display = 'inline-flex';
            verifyBtn.onclick = () => verifyUserEmail(userId);
        } else {
            verifyBtn.style.display = 'none';
            verifyBtn.onclick = null;
        }
    }

    // Check user active status (handle both isActive boolean and status string) - already calculated above
    document.getElementById('suspendUserBtn').style.display = isActive ? 'inline-flex' : 'none';
    document.getElementById('activateUserBtn').style.display = !isActive ? 'inline-flex' : 'none';
    document.getElementById('deleteUserBtn').style.display = 'inline-flex';

    // Add event listeners
    document.getElementById('suspendUserBtn').onclick = () => updateUserStatus(userId, false);
    document.getElementById('activateUserBtn').onclick = () => updateUserStatus(userId, true);
    document.getElementById('deleteUserBtn').onclick = () => deleteUser(userId);

    modal.style.display = 'flex';
}

/**
 * Edit user
 */
function editUser(userId) {
    // Open edit modal or redirect to edit page
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    viewUser(userId);
    // TODO: Add edit functionality in modal or redirect to edit page
    showAlert('Edit user functionality will be available soon. Currently, you can view user details.', 'info');
}

/**
 * Update user status
 */
async function updateUserStatus(userId, isActive) {
    const action = isActive ? 'activate' : 'suspend';
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
        const response = await apiRequest(`/admin/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ isActive })
        });

        if (response.success) {
            showAlert(`User ${action}ed successfully!`, 'success');
            
            // Close modal if open
            const modal = document.getElementById('userModal');
            if (modal && modal.style.display === 'flex') {
                closeUserModal();
            }
            
            // Reload users list
            await loadUsers();
        } else {
            throw new Error(response.message || 'Failed to update user status');
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        showAlert(error.message || 'Failed to update user status', 'error');
    }
}

/**
 * Delete user
 */
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone!')) return;

    try {
        const response = await apiRequest(`/admin/users/${userId}`, {
            method: 'DELETE'
        });

        if (response.success) {
            showAlert('User deleted successfully!', 'success');
            closeUserModal();
            await loadUsers();
        } else {
            throw new Error('Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        showAlert('Failed to delete user', 'error');
    }
}

/**
 * Manually verify a user's email
 */
async function verifyUserEmail(userId) {
    const notes = prompt('Optional: Add notes for this manual verification (leave blank to skip).');
    const payload = {};
    if (notes && notes.trim()) {
        payload.notes = notes.trim();
    }

    try {
        showAlert('Verifying user...', 'info');
        const response = await apiRequest(API_ENDPOINTS.ADMIN.VERIFY_USER(userId), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (response.success) {
            showAlert('User verified successfully!', 'success');
            closeUserModal();
            await loadUsers();
        } else {
            throw new Error(response.message || 'Failed to verify user');
        }
    } catch (error) {
        console.error('Error verifying user:', error);
        showAlert(error.message || 'Failed to verify user', 'error');
    }
}

/**
 * Close user modal
 */
function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

/**
 * Export users
 */
function exportUsers() {
    try {
        // Generate CSV data
        const headers = ['ID', 'Name', 'Email', 'User Type', 'Status', 'Registered Date'];
        const rows = allUsers.map(user => {
            const profile = user.profile || {};
            const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || user.email;
            return [
                user.id || '',
                fullName,
                user.email || '',
                user.userType || '',
                user.status || 'ACTIVE',
                user.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''
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
        link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showAlert('Users exported successfully!', 'success');
    } catch (error) {
        console.error('Error exporting users:', error);
        showAlert('Failed to export users', 'error');
    }
}

/**
 * Show add user modal
 */
function showAddUserModal() {
    // Create and show modal for adding new user
    const modalHTML = `
        <div class="modal active" id="addUserModal" style="z-index: 10000;">
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-user-plus"></i>
                        Add New User
                    </h2>
                    <button class="modal-close" onclick="closeAddUserModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body">
                    <form id="addUserForm" onsubmit="handleAddUser(event)">
                        <div class="form-group">
                            <label for="addUserType">User Type *</label>
                            <select id="addUserType" class="form-control" required onchange="toggleUserTypeFields()">
                                <option value="">Select User Type</option>
                                <option value="STUDENT">Student</option>
                                <option value="COMPANY">Company</option>
                                <option value="SUPERVISOR">Supervisor</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="addUserEmail">Email *</label>
                            <input type="email" id="addUserEmail" class="form-control" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="addUserPassword">Password *</label>
                            <input type="password" id="addUserPassword" class="form-control" required minlength="6">
                        </div>
                        
                        <!-- Student Fields -->
                        <div id="studentFields" style="display: none;">
                            <div class="form-group">
                                <label for="addStudentFirstName">First Name *</label>
                                <input type="text" id="addStudentFirstName" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="addStudentLastName">Last Name *</label>
                                <input type="text" id="addStudentLastName" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="addStudentId">Student ID</label>
                                <input type="text" id="addStudentId" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="addStudentUniversity">University</label>
                                <input type="text" id="addStudentUniversity" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="addStudentMajor">Major</label>
                                <input type="text" id="addStudentMajor" class="form-control">
                            </div>
                        </div>
                        
                        <!-- Company Fields -->
                        <div id="companyFields" style="display: none;">
                            <div class="form-group">
                                <label for="addCompanyName">Company Name *</label>
                                <input type="text" id="addCompanyName" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="addCompanyIndustry">Industry</label>
                                <input type="text" id="addCompanyIndustry" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="addCompanyWebsite">Website</label>
                                <input type="url" id="addCompanyWebsite" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="addCompanyPhone">Phone</label>
                                <input type="tel" id="addCompanyPhone" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="addCompanyProof">
                                    <i class="fas fa-file-certificate"></i>
                                    Company Verification Document * 
                                    <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: normal;">
                                        (PDF, DOC, DOCX, JPG, PNG - Max 5MB)
                                    </span>
                                </label>
                                <div id="companyProofUploadArea" style="border: 2px dashed var(--border-color); border-radius: var(--radius-md); padding: 1.5rem; text-align: center; cursor: pointer; transition: all 0.3s;" onclick="document.getElementById('addCompanyProofFile').click()">
                                    <i class="fas fa-cloud-upload-alt" style="font-size: 2rem; color: var(--text-secondary); margin-bottom: 0.5rem;"></i>
                                    <p style="margin: 0.5rem 0; color: var(--text-secondary);">
                                        Click to upload or drag and drop
                                    </p>
                                    <p style="margin: 0; font-size: 0.85rem; color: var(--text-muted);">
                                        Company registration certificate or official proof
                                    </p>
                                </div>
                                <input type="file" id="addCompanyProofFile" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style="display: none;" onchange="handleCompanyProofFileSelect(event)">
                                <div id="companyProofFileStatus" style="display: none; margin-top: 0.5rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                                    <div style="display: flex; align-items: center; justify-content: space-between;">
                                        <span id="companyProofFileName" style="color: var(--text-primary);"></span>
                                        <button type="button" onclick="clearCompanyProofFile()" style="background: none; border: none; color: var(--danger-color); cursor: pointer;">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Supervisor Fields -->
                        <div id="supervisorFields" style="display: none;">
                            <div class="form-group">
                                <label for="addSupervisorFirstName">First Name *</label>
                                <input type="text" id="addSupervisorFirstName" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="addSupervisorLastName">Last Name *</label>
                                <input type="text" id="addSupervisorLastName" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="addSupervisorUniversity">University Name</label>
                                <input type="text" id="addSupervisorUniversity" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="addSupervisorDepartment">Department</label>
                                <input type="text" id="addSupervisorDepartment" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="addSupervisorPosition">Position</label>
                                <input type="text" id="addSupervisorPosition" class="form-control">
                            </div>
                            <div class="form-group">
                                <label for="addSupervisorPhone">Phone</label>
                                <input type="tel" id="addSupervisorPhone" class="form-control">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="addUserActive" checked>
                                Active User
                            </label>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeAddUserModal()">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="handleAddUser(event)">
                        <i class="fas fa-user-plus"></i>
                        Create User
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('addUserModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Close modal when clicking outside
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAddUserModal();
            }
        });
    }
}

// Store company proof file
let companyProofFile = null;

/**
 * Handle company proof file selection
 */
function handleCompanyProofFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
        showAlert('Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files only.', 'error');
        event.target.value = '';
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showAlert('File size exceeds 5MB limit. Please upload a smaller file.', 'error');
        event.target.value = '';
        return;
    }
    
    companyProofFile = file;
    
    // Update UI
    const uploadArea = document.getElementById('companyProofUploadArea');
    const fileStatus = document.getElementById('companyProofFileStatus');
    const fileName = document.getElementById('companyProofFileName');
    
    if (uploadArea) {
        uploadArea.style.borderColor = 'var(--success-color)';
        uploadArea.style.display = 'none';
    }
    
    if (fileStatus && fileName) {
        fileStatus.style.display = 'block';
        fileName.textContent = file.name;
    }
    
    showAlert('Company proof document selected', 'success');
}

/**
 * Clear company proof file
 */
function clearCompanyProofFile() {
    companyProofFile = null;
    const fileInput = document.getElementById('addCompanyProofFile');
    const uploadArea = document.getElementById('companyProofUploadArea');
    const fileStatus = document.getElementById('companyProofFileStatus');
    
    if (fileInput) fileInput.value = '';
    if (uploadArea) {
        uploadArea.style.display = 'block';
        uploadArea.style.borderColor = 'var(--border-color)';
    }
    if (fileStatus) fileStatus.style.display = 'none';
}

/**
 * Toggle user type specific fields
 */
function toggleUserTypeFields() {
    const userTypeSelect = document.getElementById('addUserType');
    if (!userTypeSelect) return;
    
    const userType = userTypeSelect.value;
    
    // Hide all fields
    const studentFields = document.getElementById('studentFields');
    const companyFields = document.getElementById('companyFields');
    const supervisorFields = document.getElementById('supervisorFields');
    
    if (studentFields) studentFields.style.display = 'none';
    if (companyFields) companyFields.style.display = 'none';
    if (supervisorFields) supervisorFields.style.display = 'none';
    
    // Show relevant fields
    if (userType === 'STUDENT' && studentFields) {
        studentFields.style.display = 'block';
    } else if (userType === 'COMPANY' && companyFields) {
        companyFields.style.display = 'block';
    } else if (userType === 'SUPERVISOR' && supervisorFields) {
        supervisorFields.style.display = 'block';
    }
}

/**
 * Close add user modal
 */
function closeAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.remove();
    }
    // Reset company proof file
    companyProofFile = null;
}

/**
 * Handle add user form submission
 */
async function handleAddUser(event) {
    if (event) {
        event.preventDefault();
    }
    
    const userTypeEl = document.getElementById('addUserType');
    const emailEl = document.getElementById('addUserEmail');
    const passwordEl = document.getElementById('addUserPassword');
    const isActiveEl = document.getElementById('addUserActive');
    
    if (!userTypeEl || !emailEl || !passwordEl) {
        showAlert('Form elements not found. Please refresh the page and try again.', 'error');
        return;
    }
    
    const userType = userTypeEl.value;
    const email = emailEl.value.trim();
    const password = passwordEl.value;
    const isActive = isActiveEl ? isActiveEl.checked : true;
    
    if (!userType || !email || !password) {
        showAlert('Please fill in all required fields (User Type, Email, and Password)', 'error');
        return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAlert('Please enter a valid email address', 'error');
        return;
    }

    if (userType === 'STUDENT' && !email.toLowerCase().endsWith('@students.alquds.edu')) {
        showAlert('Student email must end with @students.alquds.edu', 'error');
        return;
    }
    
    // Validate password length
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long', 'error');
        return;
    }
    
    // Build registration request
    const registerData = {
        email: email,
        password: password,
        userType: userType
    };
    
    // Add profile data based on user type
    if (userType === 'STUDENT') {
        registerData.studentProfile = {
            firstName: document.getElementById('addStudentFirstName').value || '',
            lastName: document.getElementById('addStudentLastName').value || '',
            studentId: document.getElementById('addStudentId').value || '',
            university: document.getElementById('addStudentUniversity').value || '',
            major: document.getElementById('addStudentMajor').value || ''
        };
    } else if (userType === 'COMPANY') {
        const companyName = document.getElementById('addCompanyName').value.trim();
        
        if (!companyName) {
            showAlert('Company name is required', 'error');
            return;
        }
        
        // Validate company proof file is required
        if (!companyProofFile) {
            showAlert('Company verification document is required. Please upload a proof document.', 'error');
            return;
        }
        
        registerData.companyProfile = {
            companyName: companyName,
            industry: document.getElementById('addCompanyIndustry').value || '',
            website: document.getElementById('addCompanyWebsite').value || '',
            phoneNumber: document.getElementById('addCompanyPhone').value || ''
        };
    } else if (userType === 'SUPERVISOR') {
        registerData.supervisorProfile = {
            firstName: document.getElementById('addSupervisorFirstName').value || '',
            lastName: document.getElementById('addSupervisorLastName').value || '',
            universityName: document.getElementById('addSupervisorUniversity').value || '',
            department: document.getElementById('addSupervisorDepartment').value || '',
            position: document.getElementById('addSupervisorPosition').value || '',
            phoneNumber: document.getElementById('addSupervisorPhone').value || ''
        };
    }
    
    try {
        showAlert('Creating user...', 'info');
        
        // If company, upload proof document first
        let proofDocumentUrl = null;
        if (userType === 'COMPANY' && companyProofFile) {
            try {
                showAlert('Uploading company verification document...', 'info');
                const formData = new FormData();
                formData.append('file', companyProofFile);
                
                const uploadResponse = await apiRequest(API_ENDPOINTS.FILES.UPLOAD_COMPANY_PROOF, {
                    method: 'POST',
                    body: formData,
                    headers: {} // Let browser set Content-Type for FormData
                });
                
                if (uploadResponse.success && uploadResponse.data) {
                    proofDocumentUrl = uploadResponse.data.fileUrl || uploadResponse.data.url;
                    if (proofDocumentUrl) {
                        registerData.companyProfile.verificationDocument = proofDocumentUrl;
                        showAlert('Verification document uploaded successfully!', 'success');
                    }
                } else {
                    throw new Error(uploadResponse.message || 'Failed to upload verification document');
                }
            } catch (uploadError) {
                console.error('Error uploading proof document:', uploadError);
                showAlert('Failed to upload verification document: ' + (uploadError.message || 'Unknown error'), 'error');
                return;
            }
        }
        
        // Call registration API
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(registerData)
        });
        
        if (response.success) {
            showAlert('User created successfully!', 'success');
            companyProofFile = null; // Reset file
            closeAddUserModal();
            
            // Reload users list
            await loadUsers();
        } else {
            throw new Error(response.message || 'Failed to create user');
        }
    } catch (error) {
        console.error('Error creating user:', error);
        showAlert(error.message || 'Failed to create user. Please try again.', 'error');
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
window.closeUserModal = closeUserModal;
window.showAddUserModal = showAddUserModal;
window.closeAddUserModal = closeAddUserModal;
window.toggleUserTypeFields = toggleUserTypeFields;
window.handleAddUser = handleAddUser;
window.handleCompanyProofFileSelect = handleCompanyProofFileSelect;
window.clearCompanyProofFile = clearCompanyProofFile;
window.resetFilters = resetFilters;
window.exportUsers = exportUsers;

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('userModal');
    if (event.target === modal) {
        closeUserModal();
    }
};

