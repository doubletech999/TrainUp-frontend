// ===== TrainUp - Admin Users Management JavaScript =====

let allUsers = [];
let filteredUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '../../login.html';
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
        const status = user.status || 'ACTIVE';

        return `
            <div class="user-card">
                <div class="user-avatar-large">${initials}</div>
                <div class="user-info">
                    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                        <strong>${fullName}</strong>
                        <span class="user-type-badge ${userType}">${user.userType}</span>
                        <span class="user-status-badge ${status.toLowerCase()}">${status}</span>
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

    details.innerHTML = `
        <div style="display: grid; gap: 1.5rem;">
            <div>
                <h3>Basic Information</h3>
                <div style="display: grid; gap: 0.75rem; margin-top: 1rem;">
                    <div><strong>Email:</strong> ${user.email}</div>
                    <div><strong>User Type:</strong> <span class="user-type-badge ${user.userType.toLowerCase()}">${user.userType}</span></div>
                    <div><strong>Status:</strong> <span class="user-status-badge ${(user.status || 'ACTIVE').toLowerCase()}">${user.status || 'ACTIVE'}</span></div>
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
    document.getElementById('suspendUserBtn').style.display = user.status !== 'SUSPENDED' ? 'inline-flex' : 'none';
    document.getElementById('activateUserBtn').style.display = user.status === 'SUSPENDED' ? 'inline-flex' : 'none';
    document.getElementById('deleteUserBtn').style.display = 'inline-flex';

    // Add event listeners
    document.getElementById('suspendUserBtn').onclick = () => updateUserStatus(userId, 'SUSPENDED');
    document.getElementById('activateUserBtn').onclick = () => updateUserStatus(userId, 'ACTIVE');
    document.getElementById('deleteUserBtn').onclick = () => deleteUser(userId);

    modal.style.display = 'flex';
}

/**
 * Edit user
 */
function editUser(userId) {
    showAlert('Edit functionality coming soon!', 'info');
}

/**
 * Update user status
 */
async function updateUserStatus(userId, status) {
    if (!confirm(`Are you sure you want to ${status.toLowerCase()} this user?`)) return;

    try {
        const response = await apiRequest(`/admin/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });

        if (response.success) {
            showAlert(`User ${status.toLowerCase()} successfully!`, 'success');
            closeUserModal();
            await loadUsers();
        } else {
            throw new Error('Failed to update user status');
        }
    } catch (error) {
        console.error('Error updating user status:', error);
        showAlert('Failed to update user status', 'error');
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
 * Close user modal
 */
function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
}

/**
 * Export users
 */
function exportUsers() {
    showAlert('Export functionality coming soon!', 'info');
}

/**
 * Show add user modal
 */
function showAddUserModal() {
    showAlert('Add user functionality coming soon!', 'info');
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

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('userModal');
    if (event.target === modal) {
        closeUserModal();
    }
};
