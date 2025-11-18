// ===== TrainUp - Admin Settings JavaScript =====

document.addEventListener('DOMContentLoaded', () => {
    if (!isLoggedIn() || getUserData().userType !== 'ADMIN') {
        window.location.href = '../../pages/auth/login.html';
        return;
    }

    loadAdminInfo(getUserData());
    loadSettings();
    initializeForms();
});

function loadAdminInfo(userData) {
    const profile = userData.profile || {};
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Administrator';
    const initials = (profile.firstName?.[0] || 'A') + (profile.lastName?.[0] || 'D');
    document.getElementById('userName').textContent = fullName;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('userAvatar').textContent = initials.toUpperCase();
}

async function loadSettings() {
    try {
        const response = await apiRequest('/admin/settings', { method: 'GET' });
        if (response.success && response.data) {
            populateSettings(response.data);
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

function populateSettings(settings) {
    // General settings
    if (settings.general) {
        document.getElementById('siteName').value = settings.general.siteName || 'TrainUp';
        document.getElementById('siteDescription').value = settings.general.siteDescription || '';

        const maintenanceValue = typeof settings.general.maintenanceMode === 'boolean'
            ? String(settings.general.maintenanceMode)
            : 'false';
        const registrationValue = typeof settings.general.registrationEnabled === 'boolean'
            ? String(settings.general.registrationEnabled)
            : 'true';

        document.getElementById('maintenanceMode').value = maintenanceValue;
        document.getElementById('registrationEnabled').value = registrationValue;
    }

    // Email settings
    if (settings.email) {
        document.getElementById('smtpHost').value = settings.email.smtpHost || '';
        document.getElementById('smtpPort').value = settings.email.smtpPort || '587';
        document.getElementById('smtpUser').value = settings.email.smtpUser || '';
        document.getElementById('fromEmail').value = settings.email.fromEmail || '';
    }

    // Notification settings
    if (settings.notifications) {
        document.getElementById('emailNotifications').checked = settings.notifications.email !== false;
        document.getElementById('pushNotifications').checked = settings.notifications.push !== false;
        document.getElementById('smsNotifications').checked = settings.notifications.sms === true;
    }

    // Security settings
    if (settings.security) {
        document.getElementById('sessionTimeout').value = settings.security.sessionTimeout || 30;
        document.getElementById('maxLoginAttempts').value = settings.security.maxLoginAttempts || 5;
        document.getElementById('passwordMinLength').value = settings.security.passwordMinLength || 8;
    }
}

function initializeForms() {
    document.getElementById('generalSettingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveGeneralSettings();
    });

    document.getElementById('emailSettingsForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveEmailSettings();
    });
}

async function saveGeneralSettings() {
    const settings = {
        siteName: document.getElementById('siteName').value,
        siteDescription: document.getElementById('siteDescription').value,
        maintenanceMode: document.getElementById('maintenanceMode').value === 'true',
        registrationEnabled: document.getElementById('registrationEnabled').value === 'true'
    };

    try {
        const response = await apiRequest('/admin/settings/general', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });

        if (response.success) {
            showAlert('General settings saved successfully!', 'success');
        } else {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showAlert('Failed to save general settings', 'error');
    }
}

async function saveEmailSettings() {
    const settings = {
        smtpHost: document.getElementById('smtpHost').value,
        smtpPort: parseInt(document.getElementById('smtpPort').value),
        smtpUser: document.getElementById('smtpUser').value,
        smtpPassword: document.getElementById('smtpPassword').value,
        fromEmail: document.getElementById('fromEmail').value
    };

    try {
        const response = await apiRequest('/admin/settings/email', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });

        if (response.success) {
            showAlert('Email settings saved successfully!', 'success');
        } else {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showAlert('Failed to save email settings', 'error');
    }
}

async function saveNotificationSettings() {
    const settings = {
        email: document.getElementById('emailNotifications').checked,
        push: document.getElementById('pushNotifications').checked,
        sms: document.getElementById('smsNotifications').checked
    };

    try {
        const response = await apiRequest('/admin/settings/notifications', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });

        if (response.success) {
            showAlert('Notification settings saved successfully!', 'success');
        } else {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showAlert('Failed to save notification settings', 'error');
    }
}

async function saveSecuritySettings() {
    const settings = {
        sessionTimeout: parseInt(document.getElementById('sessionTimeout').value),
        maxLoginAttempts: parseInt(document.getElementById('maxLoginAttempts').value),
        passwordMinLength: parseInt(document.getElementById('passwordMinLength').value)
    };

    try {
        const response = await apiRequest('/admin/settings/security', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });

        if (response.success) {
            showAlert('Security settings saved successfully!', 'success');
        } else {
            throw new Error('Failed to save settings');
        }
    } catch (error) {
        console.error('Error saving settings:', error);
        showAlert('Failed to save security settings', 'error');
    }
}

async function testEmail() {
    const email = prompt('Enter the email address to send a test message:');
    if (!email) {
        return;
    }

    const trimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
        showAlert('Please enter a valid email address.', 'warning');
        return;
    }

    showAlert('Sending test email...', 'info');
    try {
        const response = await apiRequest('/admin/settings/test-email', {
            method: 'POST',
            body: JSON.stringify({ testEmail: trimmed })
        });
        if (response.success) {
            showAlert('Test email sent successfully! Check your inbox.', 'success');
        } else {
            throw new Error('Failed to send test email');
        }
    } catch (error) {
        console.error('Error sending test email:', error);
        showAlert(error.message || 'Failed to send test email', 'error');
    }
}

function resetForm(formId) {
    document.getElementById(formId).reset();
    loadSettings();
}

async function performBackup() {
    if (!confirm('Create a system backup? This may take a few minutes.')) return;
    showAlert('Creating backup...', 'info');
    try {
        const response = await apiRequest('/admin/system/backup', { method: 'POST' });
        if (response.success) {
            showAlert('Backup created successfully!', 'success');
        } else {
            throw new Error('Backup failed');
        }
    } catch (error) {
        console.error('Error creating backup:', error);
        showAlert('Failed to create backup', 'error');
    }
}

async function clearCache() {
    if (!confirm('Clear system cache? This will improve performance.')) return;
    showAlert('Clearing cache...', 'info');
    try {
        const response = await apiRequest('/admin/system/clear-cache', { method: 'POST' });
        if (response.success) {
            showAlert('Cache cleared successfully!', 'success');
        } else {
            throw new Error('Failed to clear cache');
        }
    } catch (error) {
        console.error('Error clearing cache:', error);
        showAlert('Failed to clear cache', 'error');
    }
}

// Expose functions used in inline handlers
window.saveNotificationSettings = saveNotificationSettings;
window.saveSecuritySettings = saveSecuritySettings;
window.testEmail = testEmail;
window.resetForm = resetForm;
window.performBackup = performBackup;
window.clearCache = clearCache;

