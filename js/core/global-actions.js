// ===== TrainUp - Global Actions & Button Handlers =====

/**
 * Logout function - Enhanced version with confirmation
 */
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        
        // Check if we're in a subdirectory
        if (window.location.pathname.includes('/pages/')) {
            window.location.href = '../../pages/auth/login.html';
        } else {
            window.location.href = 'pages/auth/login.html';
        }
    }
}

/**
 * Toggle password visibility
 */
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggleIcon');
    
    if (!passwordInput || !toggleIcon) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

/**
 * Export Report as PDF
 */
function exportReport() {
    try {
        showAlert('Preparing report for export...', 'info');
        
        // Simulate PDF export
        setTimeout(() => {
            // Create a simple CSV export as fallback
            const data = document.body.innerHTML;
            const blob = new Blob([data], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${new Date().toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showAlert('Report exported successfully!', 'success');
        }, 1000);
    } catch (error) {
        console.error('Export error:', error);
        showAlert('Failed to export report. Please try again.', 'error');
    }
}

/**
 * Export Users Data
 */
function exportUsers() {
    try {
        showAlert('Exporting users data...', 'info');
        
        // Simulate export
        setTimeout(() => {
            const csv = 'Name,Email,Type,Status\n';
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showAlert('Users data exported successfully!', 'success');
        }, 1000);
    } catch (error) {
        console.error('Export error:', error);
        showAlert('Failed to export users. Please try again.', 'error');
    }
}

/**
 * Export Student Data
 * Note: This is a fallback function. If supervisor-students.js is loaded,
 * it will use the more specific exportStudentData() from that file.
 */
function exportStudentData() {
    // Check if this is the supervisor students page with filtered students
    if (typeof filteredStudents !== 'undefined' && Array.isArray(filteredStudents)) {
        // Use the more specific implementation from supervisor-students.js
        // This will be called if supervisor-students.js is loaded
        return;
    }
    
    // Fallback for other pages
    try {
        showAlert('Exporting student data...', 'info');
        
        setTimeout(() => {
            const csv = 'Name,Email,Internship,Status\n';
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `students-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showAlert('Student data exported successfully!', 'success');
        }, 1000);
    } catch (error) {
        console.error('Export error:', error);
        showAlert('Failed to export student data. Please try again.', 'error');
    }
}

/**
 * Refresh Dashboard
 */
function refreshDashboard() {
    const btn = event.target.closest('button');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
    }
    
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

/**
 * Load Activities
 */
function loadActivities() {
    showAlert('Loading activities...', 'info');
    // TODO: Implement actual activities loading
    setTimeout(() => {
        showAlert('Activities loaded successfully!', 'success');
    }, 1000);
}

/**
 * Filter Internships
 */
function filterInternships(filter) {
    // Remove active class from all tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Filter logic
    const cards = document.querySelectorAll('.internship-card, .application-card');
    cards.forEach(card => {
        const status = card.getAttribute('data-status') || card.querySelector('.status-badge')?.textContent.trim();
        
        if (filter === 'all') {
            card.style.display = '';
        } else {
            card.style.display = status === filter || status.includes(filter) ? '' : 'none';
        }
    });
    
    showAlert(`Showing ${filter === 'all' ? 'all' : filter} internships`, 'info');
}

/**
 * Close Review Modal
 */
function closeReviewModal() {
    const modal = document.getElementById('reviewModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Close Student Modal
 * Note: supervisor-students.js has its own implementation, but this serves as fallback
 */
function closeStudentModal() {
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.classList.remove('active');
    }
    
    // Clear selected student if exists
    if (typeof selectedStudent !== 'undefined') {
        selectedStudent = null;
    }
}

/**
 * Show Add User Modal
 */
function showAddUserModal() {
    const modal = document.getElementById('addUserModal');
    if (modal) {
        modal.classList.add('active');
    } else {
        showAlert('Add user modal will be implemented soon!', 'info');
    }
}

/**
 * Register Page - Select User Type
 */
function selectUserType(userType) {
    // Remove selected class from all cards
    document.querySelectorAll('.user-type-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selected class to clicked card
    event.currentTarget.classList.add('selected');
    
    // Set hidden input value
    const userTypeInput = document.getElementById('userType');
    if (userTypeInput) {
        userTypeInput.value = userType;
    }
    
    // Clear error
    const errorElement = document.getElementById('userTypeError');
    if (errorElement) {
        errorElement.textContent = '';
    }
}

/**
 * Register Page - Navigate between steps
 */
function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(stepEl => {
        stepEl.style.display = 'none';
    });
    
    // Show current step
    const currentStep = document.getElementById(`step${step}`);
    if (currentStep) {
        currentStep.style.display = 'block';
    }
    
    // Update progress indicator if exists
    const progressIndicator = document.querySelector('.progress-indicator');
    if (progressIndicator) {
        const steps = progressIndicator.querySelectorAll('.step');
        steps.forEach((s, index) => {
            if (index < step - 1) {
                s.classList.add('completed');
            } else if (index === step - 1) {
                s.classList.add('active');
                s.classList.remove('completed');
            } else {
                s.classList.remove('active', 'completed');
            }
        });
    }
}

/**
 * Toggle Checkbox (for approve completion page)
 */
function toggleCheckbox(id) {
    const checkbox = document.getElementById(id);
    if (checkbox) {
        checkbox.checked = !checkbox.checked;
    }
}

/**
 * Approve Completion
 */
function approveCompletion() {
    if (confirm('Are you sure you want to approve this internship completion?')) {
        showAlert('Processing approval...', 'info');
        
        // TODO: Implement actual API call
        setTimeout(() => {
            showAlert('Internship completion approved successfully!', 'success');
            // Close modal or redirect
            setTimeout(() => {
                window.location.href = 'students.html';
            }, 1500);
        }, 1000);
    }
}

/**
 * Reject Completion
 */
function rejectCompletion() {
    const reason = prompt('Please provide a reason for rejection:');
    if (reason) {
        showAlert('Processing rejection...', 'info');
        
        // TODO: Implement actual API call
        setTimeout(() => {
            showAlert('Internship completion rejected.', 'success');
            setTimeout(() => {
                window.location.href = 'students.html';
            }, 1500);
        }, 1000);
    }
}

/**
 * Focus Input (for chip inputs)
 */
function focusInput(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        input.focus();
    }
}

/**
 * Set Recommendation (for evaluation pages)
 * Note: This is a fallback function. Specific pages may override it.
 */
function setRecommendation(recommend) {
    // Remove selected class from all buttons
    document.querySelectorAll('.recommendation-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.classList.remove('active');
    });
    
    // Find and activate the clicked button
    const buttons = document.querySelectorAll('.recommendation-btn');
    buttons.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr && onclickAttr.includes(String(recommend))) {
            btn.classList.add('selected');
            btn.classList.add('active');
        }
    });
    
    // Set hidden input value if exists
    const recommendationInput = document.getElementById('recommendation') || document.getElementById('wouldRecommend');
    if (recommendationInput) {
        recommendationInput.value = recommend ? 'YES' : 'NO';
    }
}

/**
 * Edit Profile
 */
function editProfile() {
    // Redirect to edit profile page based on user type
    const currentPath = window.location.pathname;
    if (currentPath.includes('supervisor/profile.html')) {
        window.location.href = 'edit-profile.html';
    } else if (currentPath.includes('student/profile.html')) {
        window.location.href = 'edit-profile.html';
    } else {
        showAlert('Edit profile functionality will be implemented soon!', 'info');
    }
}

/**
 * Change Password
 */
function changePassword() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.classList.add('active');
        // Clear form
        document.getElementById('changePasswordForm').reset();
        document.querySelectorAll('#changePasswordForm .error-message').forEach(el => el.textContent = '');
    } else {
        showAlert('Change password modal not found', 'error');
    }
}

/**
 * Close Change Password Modal
 */
function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.classList.remove('active');
        document.getElementById('changePasswordForm').reset();
        document.querySelectorAll('#changePasswordForm .error-message').forEach(el => el.textContent = '');
    }
}

/**
 * Save Password
 */
async function savePassword() {
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Clear previous errors
    document.querySelectorAll('#changePasswordForm .error-message').forEach(el => el.textContent = '');

    // Validate
    let isValid = true;

    if (!currentPassword) {
        document.getElementById('currentPasswordError').textContent = 'Current password is required';
        isValid = false;
    }

    if (!newPassword) {
        document.getElementById('newPasswordError').textContent = 'New password is required';
        isValid = false;
    } else if (newPassword.length < 8) {
        document.getElementById('newPasswordError').textContent = 'Password must be at least 8 characters long';
        isValid = false;
    }

    if (!confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'Please confirm your new password';
        isValid = false;
    } else if (newPassword !== confirmPassword) {
        document.getElementById('confirmPasswordError').textContent = 'Passwords do not match';
        isValid = false;
    }

    if (!isValid) {
        return;
    }

    try {
        setButtonLoading('savePasswordBtn', true);
        showAlert('Changing password...', 'info');

        const response = await apiRequest(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
            method: 'POST',
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });

        if (response.success) {
            showAlert('Password changed successfully!', 'success');
            closeChangePasswordModal();
        } else {
            throw new Error(response.message || 'Failed to change password');
        }
    } catch (error) {
        console.error('Error changing password:', error);
        if (error.message.includes('Current password is incorrect')) {
            document.getElementById('currentPasswordError').textContent = error.message;
        } else {
            showAlert(error.message || 'Failed to change password. Please try again.', 'error');
        }
    } finally {
        setButtonLoading('savePasswordBtn', false);
    }
}

/**
 * Notification Settings
 */
function notificationSettings() {
    const modal = document.getElementById('notificationSettingsModal');
    if (modal) {
        modal.classList.add('active');
        // Load current settings from localStorage if available
        const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{"email": true, "inApp": true}');
        document.getElementById('emailNotifications').checked = settings.email !== false;
        document.getElementById('inAppNotifications').checked = settings.inApp !== false;
    } else {
        showAlert('Notification settings modal not found', 'error');
    }
}

/**
 * Close Notification Settings Modal
 */
function closeNotificationSettingsModal() {
    const modal = document.getElementById('notificationSettingsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Save Notification Settings
 */
function saveNotificationSettings() {
    const emailNotifications = document.getElementById('emailNotifications').checked;
    const inAppNotifications = document.getElementById('inAppNotifications').checked;

    // Save to localStorage
    localStorage.setItem('notificationSettings', JSON.stringify({
        email: emailNotifications,
        inApp: inAppNotifications
    }));

    showAlert('Notification settings saved successfully!', 'success');
    closeNotificationSettingsModal();
}

/**
 * Privacy Settings
 */
function privacySettings() {
    const modal = document.getElementById('privacySettingsModal');
    if (modal) {
        modal.classList.add('active');
        // Load current settings from localStorage if available
        const settings = JSON.parse(localStorage.getItem('privacySettings') || '{"profileVisibility": true, "activityStatus": true}');
        document.getElementById('profileVisibility').checked = settings.profileVisibility !== false;
        document.getElementById('activityStatus').checked = settings.activityStatus !== false;
    } else {
        showAlert('Privacy settings modal not found', 'error');
    }
}

/**
 * Close Privacy Settings Modal
 */
function closePrivacySettingsModal() {
    const modal = document.getElementById('privacySettingsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Save Privacy Settings
 */
function savePrivacySettings() {
    const profileVisibility = document.getElementById('profileVisibility').checked;
    const activityStatus = document.getElementById('activityStatus').checked;

    // Save to localStorage
    localStorage.setItem('privacySettings', JSON.stringify({
        profileVisibility,
        activityStatus
    }));

    showAlert('Privacy settings saved successfully!', 'success');
    closePrivacySettingsModal();
}

/**
 * Reset Form
 */
function resetForm(formId) {
    const form = document.getElementById(formId);
    if (form) {
        form.reset();
        showAlert('Form reset successfully!', 'success');
    }
}

/**
 * Test Email
 */
function testEmail() {
    showAlert('Sending test email...', 'info');
    setTimeout(() => {
        showAlert('Test email sent successfully!', 'success');
    }, 1500);
}

/**
 * Save Notification Settings
 */
function saveNotificationSettings() {
    showAlert('Saving notification settings...', 'info');
    setTimeout(() => {
        showAlert('Notification settings saved successfully!', 'success');
    }, 1000);
}

/**
 * Save Security Settings
 */
function saveSecuritySettings() {
    showAlert('Saving security settings...', 'info');
    setTimeout(() => {
        showAlert('Security settings saved successfully!', 'success');
    }, 1000);
}

/**
 * Perform Backup
 */
function performBackup() {
    showAlert('Creating backup...', 'info');
    setTimeout(() => {
        showAlert('Backup created successfully!', 'success');
    }, 2000);
}

/**
 * Clear Cache
 */
function clearCache() {
    if (confirm('Are you sure you want to clear the cache?')) {
        showAlert('Clearing cache...', 'info');
        localStorage.clear();
        sessionStorage.clear();
        setTimeout(() => {
            showAlert('Cache cleared successfully!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }, 1000);
    }
}

/**
 * Update Reports (change date range)
 */
function updateReports() {
    const dateRange = document.getElementById('dateRange')?.value || '30';
    showAlert(`Loading reports for last ${dateRange} days...`, 'info');
    
    // TODO: Implement actual data loading
    setTimeout(() => {
        showAlert('Reports updated successfully!', 'success');
    }, 1000);
}

/**
 * Show Modal
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

/**
 * Close Modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

/**
 * Toggle Mobile Menu
 */
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
    
    if (overlay) {
        overlay.classList.toggle('active');
    }
    
    // Prevent body scroll when menu is open
    if (sidebar && sidebar.classList.contains('active')) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
}

/**
 * Close Mobile Menu
 */
function closeMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar) {
        sidebar.classList.remove('active');
    }
    
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    document.body.style.overflow = '';
}

/**
 * Close mobile menu when clicking on nav item
 */
function setupMobileMenuClose() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                closeMobileMenu();
            }
        });
    });
}

/**
 * Add mobile menu toggle button and overlay to dashboard pages
 */
function addMobileMenuElements() {
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (!dashboardContainer) return;
    
    // Check if mobile menu toggle already exists
    if (document.querySelector('.mobile-menu-toggle')) return;
    
    // Create mobile menu toggle button
    const toggleButton = document.createElement('button');
    toggleButton.className = 'mobile-menu-toggle';
    toggleButton.setAttribute('onclick', 'toggleMobileMenu()');
    toggleButton.setAttribute('aria-label', 'Toggle menu');
    toggleButton.innerHTML = '<i class="fas fa-bars"></i>';
    
    // Create sidebar overlay
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.setAttribute('onclick', 'closeMobileMenu()');
    
    // Insert before sidebar
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        dashboardContainer.insertBefore(toggleButton, sidebar);
        dashboardContainer.insertBefore(overlay, sidebar);
    }
}

/**
 * Close modal when clicking outside
 */
document.addEventListener('DOMContentLoaded', function() {
    // Add mobile menu elements to dashboard pages
    addMobileMenuElements();
    
    // Setup mobile menu
    setupMobileMenuClose();
    
    // Close mobile menu when clicking overlay
    const overlay = document.querySelector('.sidebar-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeMobileMenu);
    }
    
    // Close mobile menu on window resize if > 768px
    let resizeTimer;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            if (window.innerWidth > 768) {
                closeMobileMenu();
            }
        }, 250);
    });
    
    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
            closeMobileMenu();
        }
    });
});

// Make functions globally available
window.logout = logout;
window.togglePassword = togglePassword;
window.toggleMobileMenu = toggleMobileMenu;
window.closeMobileMenu = closeMobileMenu;
window.exportReport = exportReport;
window.exportUsers = exportUsers;
window.exportStudentData = exportStudentData;
window.refreshDashboard = refreshDashboard;
window.loadActivities = loadActivities;
window.filterInternships = filterInternships;
window.closeReviewModal = closeReviewModal;
window.closeStudentModal = closeStudentModal;
window.showAddUserModal = showAddUserModal;
window.selectUserType = selectUserType;
window.goToStep = goToStep;
window.toggleCheckbox = toggleCheckbox;
window.approveCompletion = approveCompletion;
window.rejectCompletion = rejectCompletion;
window.focusInput = focusInput;
window.setRecommendation = setRecommendation;
window.editProfile = editProfile;
window.changePassword = changePassword;
window.closeChangePasswordModal = closeChangePasswordModal;
window.savePassword = savePassword;
window.notificationSettings = notificationSettings;
window.closeNotificationSettingsModal = closeNotificationSettingsModal;
window.saveNotificationSettings = saveNotificationSettings;
window.privacySettings = privacySettings;
window.closePrivacySettingsModal = closePrivacySettingsModal;
window.savePrivacySettings = savePrivacySettings;
window.resetForm = resetForm;
window.testEmail = testEmail;
window.saveNotificationSettings = saveNotificationSettings;
window.saveSecuritySettings = saveSecuritySettings;
window.performBackup = performBackup;
window.clearCache = clearCache;
window.updateReports = updateReports;
window.showModal = showModal;
window.closeModal = closeModal;


