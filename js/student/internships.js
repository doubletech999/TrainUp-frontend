// ===== TrainUp - Internships Page JavaScript =====

let allInternships = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    if (!isLoggedIn()) {
        window.location.href = '../../pages/auth/login.html';
        return;
    }

    const userData = getUserData();
    
    // Load user info
    loadUserInfo(userData);

    // Load internships
    await loadInternships();
});

/**
 * Load user info in sidebar
 */
function loadUserInfo(userData) {
    const profile = userData.profile;
    
    if (profile && userData.userType === 'STUDENT') {
        const fullName = `${profile.firstName} ${profile.lastName}`;
        const initials = getInitials(profile.firstName, profile.lastName);
        
        document.getElementById('userName').textContent = fullName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

/**
 * Load all internships
 */
async function loadInternships() {
    try {
        const response = await getAllInternships();

        if (response.success) {
            allInternships = response.data || [];
            displayInternships(allInternships);
        } else {
            showAlert('Failed to load internships', 'error');
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
    document.getElementById('internshipCount').textContent = internships.length;

    if (internships.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-briefcase"></i>
                <h3>No Internships Found</h3>
                <p>Try adjusting your filters or check back later</p>
            </div>
        `;
        return;
    }

    container.innerHTML = internships.map(internship => `
        <div class="internship-card" data-id="${internship.id}">
            <div class="internship-header">
                <div class="company-logo">
                    ${internship.company?.logo ? 
                        `<img src="${internship.company.logo}" alt="Logo">` :
                        internship.company?.name ? internship.company.name.charAt(0) :
                        `<i class="fas fa-building"></i>`
                    }
                </div>
                <div class="internship-title">
                    <h3>${internship.title}</h3>
                    <p class="company-name">${internship.company?.name || 'Company'}</p>
                </div>
                <span class="status-badge active">Active</span>
            </div>

            <p style="margin-bottom: 1rem; color: var(--text-secondary);">
                ${internship.description.substring(0, 150)}${internship.description.length > 150 ? '...' : ''}
            </p>

            <div class="internship-meta">
                <div class="meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${internship.location}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${internship.duration} months</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>Deadline: ${formatDate(internship.applicationDeadline)}</span>
                </div>
                ${internship.isPaid ? `
                    <div class="meta-item">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>${internship.stipend ? `$${internship.stipend}` : 'Paid'}</span>
                    </div>
                ` : `
                    <div class="meta-item">
                        <i class="fas fa-hand-holding-heart"></i>
                        <span>Unpaid</span>
                    </div>
                `}
            </div>

            ${internship.skills && internship.skills.length > 0 ? `
                <div class="internship-tags">
                    ${internship.skills.slice(0, 5).map(skill => 
                        `<span class="tag">${skill}</span>`
                    ).join('')}
                    ${internship.skills.length > 5 ? 
                        `<span class="tag">+${internship.skills.length - 5} more</span>` : 
                        ''
                    }
                </div>
            ` : ''}

            <div class="internship-footer">
                <div class="meta-item">
                    <i class="fas fa-eye"></i>
                    <span>${internship.views || 0} views</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-users"></i>
                    <span>${internship.applicationsCount || 0} applicants</span>
                </div>
                <div class="internship-actions">
                    <a href="internship-details.html?id=${internship.id}" class="btn btn-outline btn-sm">
                        <i class="fas fa-info-circle"></i>
                        View Details
                    </a>
                    <a href="internship-details.html?id=${internship.id}" class="btn btn-primary btn-sm">
                        <i class="fas fa-paper-plane"></i>
                        Apply Now
                    </a>
                </div>
            </div>
        </div>
    `).join('');
}

/**
 * Filter internships
 */
function filterInternships() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    const paidFilter = document.getElementById('paidFilter').value;

    let filtered = allInternships;

    // Search filter
    if (searchTerm) {
        filtered = filtered.filter(internship => 
            internship.title.toLowerCase().includes(searchTerm) ||
            internship.company?.name.toLowerCase().includes(searchTerm) ||
            internship.description.toLowerCase().includes(searchTerm) ||
            (internship.skills && internship.skills.some(skill => 
                skill.toLowerCase().includes(searchTerm)
            ))
        );
    }

    // Category filter
    if (category) {
        filtered = filtered.filter(internship => 
            internship.category === category
        );
    }

    // Paid filter
    if (paidFilter === 'paid') {
        filtered = filtered.filter(internship => internship.isPaid);
    } else if (paidFilter === 'unpaid') {
        filtered = filtered.filter(internship => !internship.isPaid);
    }

    displayInternships(filtered);
}
