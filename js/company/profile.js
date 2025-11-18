// ===== TrainUp - Company Profile JavaScript =====

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '../../pages/auth/login.html';
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

    // Display profile
    await displayProfile(userData);
});

/**
 * Load company info
 */
function loadCompanyInfo(userData) {
    const profile = userData.profile || {};
    const companyProfile = profile.companyProfile || {};
    
    if (companyProfile.companyName) {
        const initials = companyProfile.companyName.substring(0, 2).toUpperCase();
        document.getElementById('companyName').textContent = companyProfile.companyName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

/**
 * Display profile
 */
async function displayProfile(userData) {
    // Try to fetch latest profile data from API
    try {
        const response = await apiRequest(API_ENDPOINTS.COMPANIES.PROFILE, {
            method: 'GET'
        });
        
        if (response.success && response.data) {
            // Update userData with fresh profile data
            userData.profile = {
                ...userData.profile,
                companyProfile: response.data
            };
            // Update localStorage with fresh data
            localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        // Continue with existing userData if API call fails
    }
    
    const profile = userData.profile || {};
    const companyProfile = profile.companyProfile || {};
    const contactPerson = companyProfile.contactPerson || {};
    
    const initials = companyProfile.companyName ? companyProfile.companyName.substring(0, 2).toUpperCase() : 'C';
    
    const profileHTML = `
        <!-- Profile Header -->
        <div class="content-section" style="background: var(--primary-gradient-elegant); color: white; padding: 3rem 2rem; border-radius: var(--radius-lg); position: relative; overflow: hidden;">
            <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: rgba(255, 255, 255, 0.1); border-radius: 50%;"></div>
            <div style="position: absolute; bottom: -30px; left: -30px; width: 150px; height: 150px; background: rgba(255, 255, 255, 0.08); border-radius: 50%;"></div>
            <div style="position: relative; z-index: 1; text-align: center;">
                <div style="width: 120px; height: 120px; background: white; color: var(--primary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 700; margin: 0 auto 1.5rem; box-shadow: var(--shadow-elegant);">
                    ${initials}
                </div>
                <h2 style="color: white; margin-bottom: 0.5rem; font-size: 2rem;">${companyProfile.companyName || 'Company Name'}</h2>
                <p style="opacity: 0.95; font-size: 1.125rem; font-weight: 500; color: #FFFFFF;">
                    ${companyProfile.industry || 'Industry'} • ${companyProfile.location || 'Location'}
                </p>
            </div>
        </div>

        <!-- Company Information -->
        <div class="content-section">
            <div class="section-header">
                <h2>
                    <i class="fas fa-info-circle"></i>
                    Company Information
                </h2>
            </div>

            <div style="display: grid; gap: 1.5rem;">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                    <div>
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-envelope"></i> Email
                        </strong>
                        <p style="font-size: 1rem; color: var(--text-primary);">${userData.email || 'N/A'}</p>
                    </div>

                    <div>
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-industry"></i> Industry
                        </strong>
                        <p style="font-size: 1rem; color: var(--text-primary);">${companyProfile.industry || 'N/A'}</p>
                    </div>

                    <div>
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-users"></i> Company Size
                        </strong>
                        <p style="font-size: 1rem; color: var(--text-primary);">${companyProfile.companySize || 'N/A'}</p>
                    </div>

                    <div>
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-map-marker-alt"></i> Location
                        </strong>
                        <p style="font-size: 1rem; color: var(--text-primary);">${companyProfile.location || 'N/A'}</p>
                    </div>

                    <div>
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-phone"></i> Phone
                        </strong>
                        <p style="font-size: 1rem; color: var(--text-primary);">${companyProfile.phoneNumber || 'N/A'}</p>
                    </div>

                    ${companyProfile.website ? `
                        <div>
                            <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                                <i class="fas fa-globe"></i> Website
                            </strong>
                            <a href="${companyProfile.website}" target="_blank" style="color: var(--primary-color); font-size: 1rem;">
                                ${companyProfile.website}
                                <i class="fas fa-external-link-alt" style="margin-left: 0.25rem; font-size: 0.75rem;"></i>
                            </a>
                        </div>
                    ` : ''}
                </div>

                ${companyProfile.description ? `
                    <div style="margin-top: 1rem;">
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                            <i class="fas fa-align-left"></i> Company Description
                        </strong>
                        <p style="line-height: 1.8; color: var(--text-primary);">${companyProfile.description}</p>
                    </div>
                ` : ''}
            </div>
        </div>

        <!-- Contact Person -->
        ${contactPerson.name ? `
            <div class="content-section">
                <div class="section-header">
                    <h2>
                        <i class="fas fa-user-tie"></i>
                        Contact Person
                    </h2>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
                    <div>
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                            Name
                        </strong>
                        <p style="font-size: 1rem; color: var(--text-primary);">${contactPerson.name}</p>
                    </div>

                    ${contactPerson.position ? `
                        <div>
                            <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                                Position
                            </strong>
                            <p style="font-size: 1rem; color: var(--text-primary);">${contactPerson.position}</p>
                        </div>
                    ` : ''}

                    ${contactPerson.email ? `
                        <div>
                            <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                                Email
                            </strong>
                            <p style="font-size: 1rem; color: var(--text-primary);">${contactPerson.email}</p>
                        </div>
                    ` : ''}

                    ${contactPerson.phone ? `
                        <div>
                            <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">
                                Phone
                            </strong>
                            <p style="font-size: 1rem; color: var(--text-primary);">${contactPerson.phone}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        ` : ''}

        <!-- Account Information -->
        <div class="content-section">
            <div class="section-header">
                <h2>
                    <i class="fas fa-user-shield"></i>
                    Account Information
                </h2>
            </div>

            <div style="display: grid; gap: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                    <div>
                        <strong style="display: block; margin-bottom: 0.25rem;">Member Since</strong>
                        <span style="color: var(--text-secondary); font-size: 0.9rem;">${formatDate(userData.createdAt)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('profileContent').innerHTML = profileHTML;
}

/**
 * Edit company profile
 */
function editCompanyProfile() {
    window.location.href = 'edit-profile.html';
}

/**
 * Format date
 */
function formatDate(date) {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Make functions globally available
window.editCompanyProfile = editCompanyProfile;


