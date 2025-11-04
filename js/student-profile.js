// ===== TrainUp - Student Profile View JavaScript =====

let currentUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) {
        window.location.href = '../../login.html';
        return;
    }

    const userData = getUserData();
    
    if (userData.userType !== 'STUDENT') {
        showAlert('Access denied. Students only.', 'error');
        setTimeout(() => logout(), 2000);
        return;
    }

    currentUser = userData;
    loadUserInfo(userData);
    displayProfile();
});

function loadUserInfo(userData) {
    const profile = userData.profile;
    
    if (profile) {
        const fullName = `${profile.firstName} ${profile.lastName}`;
        const initials = getInitials(profile.firstName, profile.lastName);
        
        document.getElementById('studentName').textContent = fullName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

function displayProfile() {
    const profile = currentUser.profile;
    
    if (!profile) {
        document.getElementById('profileContent').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-slash"></i>
                <h3>Profile Not Found</h3>
                <p>Please complete your profile to get started</p>
                <a href="edit-profile.html" class="btn btn-primary">Complete Profile</a>
            </div>
        `;
        return;
    }

    const fullName = `${profile.firstName} ${profile.lastName}`;
    const initials = getInitials(profile.firstName, profile.lastName);

    document.getElementById('profileContent').innerHTML = `
        <div style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%); color: white; padding: 3rem; border-radius: var(--radius-lg); margin-bottom: 2rem; text-align: center;">
            <div style="width: 120px; height: 120px; background: white; color: var(--primary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 700; margin: 0 auto 1rem;">
                ${initials}
            </div>
            <h1 style="color: white; margin-bottom: 0.5rem;">${fullName}</h1>
            <p style="opacity: 0.9; margin-bottom: 0.5rem;">${profile.major || 'Student'} • ${profile.university || 'University'}</p>
            <p style="opacity: 0.8; font-size: 0.875rem;">
                <i class="fas fa-id-card"></i> ${profile.studentId || 'N/A'}
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; margin-top: 1.5rem; flex-wrap: wrap;">
                <a href="edit-profile.html" class="btn" style="background: white; color: var(--primary-color);">
                    <i class="fas fa-edit"></i>
                    Edit Profile
                </a>
                ${profile.cvUrl ? `
                    <a href="${profile.cvUrl}" target="_blank" class="btn btn-outline" style="border-color: white; color: white;">
                        <i class="fas fa-file-pdf"></i>
                        View CV
                    </a>
                ` : ''}
            </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
            <div class="content-section">
                <h2 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-user" style="color: var(--primary-color);"></i>
                    Personal Information
                </h2>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Full Name</strong>
                        <span>${fullName}</span>
                    </div>
                    <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Student ID</strong>
                        <span>${profile.studentId || 'Not provided'}</span>
                    </div>
                    <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Email</strong>
                        <span>${currentUser.email}</span>
                    </div>
                    <div style="padding: 0.75rem 0;">
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Phone</strong>
                        <span>${profile.phoneNumber || 'Not provided'}</span>
                    </div>
                </div>
            </div>

            <div class="content-section">
                <h2 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-graduation-cap" style="color: var(--primary-color);"></i>
                    Academic Information
                </h2>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">University</strong>
                        <span>${profile.university || 'Not provided'}</span>
                    </div>
                    <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Major</strong>
                        <span>${profile.major || 'Not provided'}</span>
                    </div>
                    <div style="padding: 0.75rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">Year of Study</strong>
                        <span>${profile.yearOfStudy ? `Year ${profile.yearOfStudy}` : 'Not provided'}</span>
                    </div>
                    <div style="padding: 0.75rem 0;">
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">GPA</strong>
                        <span>${profile.gpa || 'Not provided'}</span>
                    </div>
                </div>
            </div>
        </div>

        ${profile.bio ? `
            <div class="content-section" style="margin-top: 1.5rem;">
                <h2 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-quote-left" style="color: var(--primary-color);"></i>
                    About Me
                </h2>
                <p style="line-height: 1.8; color: var(--text-secondary); white-space: pre-wrap;">${profile.bio}</p>
            </div>
        ` : ''}

        ${profile.skills && profile.skills.length > 0 ? `
            <div class="content-section" style="margin-top: 1.5rem;">
                <h2 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-tools" style="color: var(--primary-color);"></i>
                    Skills
                </h2>
                <div style="display: flex; flex-wrap: wrap; gap: 0.75rem;">
                    ${profile.skills.map(skill => `
                        <span style="background: var(--primary-light); color: var(--primary-color); padding: 0.625rem 1.25rem; border-radius: var(--radius-full); font-weight: 500;">
                            ${skill}
                        </span>
                    `).join('')}
                </div>
            </div>
        ` : ''}

        ${(profile.linkedinUrl || profile.githubUrl) ? `
            <div class="content-section" style="margin-top: 1.5rem;">
                <h2 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                    <i class="fas fa-link" style="color: var(--primary-color);"></i>
                    Social Links
                </h2>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    ${profile.linkedinUrl ? `
                        <a href="${profile.linkedinUrl}" target="_blank" class="btn btn-outline">
                            <i class="fab fa-linkedin"></i>
                            LinkedIn Profile
                        </a>
                    ` : ''}
                    ${profile.githubUrl ? `
                        <a href="${profile.githubUrl}" target="_blank" class="btn btn-outline">
                            <i class="fab fa-github"></i>
                            GitHub Profile
                        </a>
                    ` : ''}
                </div>
            </div>
        ` : ''}

        <div class="content-section" style="margin-top: 1.5rem;">
            <h2 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-file-pdf" style="color: var(--primary-color);"></i>
                CV/Resume
            </h2>
            ${profile.cvUrl ? `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); border-left: 4px solid var(--success-color);">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <i class="fas fa-check-circle" style="font-size: 2rem; color: var(--success-color);"></i>
                        <div>
                            <strong style="display: block; margin-bottom: 0.25rem;">CV Uploaded</strong>
                            <span style="color: var(--text-secondary); font-size: 0.875rem;">Your CV is ready to use</span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <a href="${profile.cvUrl}" target="_blank" class="btn btn-outline btn-sm">
                            <i class="fas fa-eye"></i>
                            View
                        </a>
                        <a href="edit-profile.html" class="btn btn-primary btn-sm">
                            <i class="fas fa-upload"></i>
                            Update
                        </a>
                    </div>
                </div>
            ` : `
                <div style="text-align: center; padding: 3rem; background: var(--bg-secondary); border-radius: var(--radius-md); border: 2px dashed var(--border-color);">
                    <i class="fas fa-file-upload" style="font-size: 3rem; color: var(--text-light); margin-bottom: 1rem;"></i>
                    <h3 style="margin-bottom: 0.5rem;">No CV Uploaded</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Upload your CV to apply for internships</p>
                    <a href="edit-profile.html" class="btn btn-primary">
                        <i class="fas fa-upload"></i>
                        Upload CV
                    </a>
                </div>
            `}
        </div>

        <div class="content-section" style="margin-top: 1.5rem;">
            <h2 style="margin-bottom: 1rem; display: flex; align-items: center; gap: 0.75rem;">
                <i class="fas fa-chart-pie" style="color: var(--primary-color);"></i>
                Profile Completion
            </h2>
            ${getProfileCompletionWidget(profile)}
        </div>
    `;
}

function getProfileCompletionWidget(profile) {
    const requiredFields = {
        'firstName': 'First Name',
        'lastName': 'Last Name',
        'studentId': 'Student ID',
        'university': 'University',
        'major': 'Major',
        'yearOfStudy': 'Year of Study',
        'phoneNumber': 'Phone Number',
        'bio': 'Bio',
        'skills': 'Skills',
        'cvUrl': 'CV/Resume'
    };

    let completedFields = 0;
    const missingFields = [];

    for (const [field, label] of Object.entries(requiredFields)) {
        if (profile[field] && (Array.isArray(profile[field]) ? profile[field].length > 0 : true)) {
            completedFields++;
        } else {
            missingFields.push(label);
        }
    }

    const completionPercent = Math.round((completedFields / Object.keys(requiredFields).length) * 100);
    const color = completionPercent >= 80 ? 'var(--success-color)' : 
                  completionPercent >= 50 ? 'var(--warning-color)' : 'var(--danger-color)';

    return `
        <div style="padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <span style="font-weight: 600;">Your Progress</span>
                <span style="font-weight: 700; color: ${color}; font-size: 1.25rem;">${completionPercent}%</span>
            </div>
            
            <div style="background: var(--border-color); height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 1rem;">
                <div style="background: ${color}; height: 100%; width: ${completionPercent}%; transition: width 0.5s;"></div>
            </div>

            ${completionPercent < 100 ? `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <strong style="display: block; margin-bottom: 0.75rem; font-size: 0.875rem;">Missing:</strong>
                    <div style="display: grid; gap: 0.5rem;">
                        ${missingFields.map(field => `
                            <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                                <i class="fas fa-circle" style="font-size: 6px;"></i>
                                <span>${field}</span>
                            </div>
                        `).join('')}
                    </div>
                    <a href="edit-profile.html" class="btn btn-primary btn-sm" style="margin-top: 1rem; width: 100%;">
                        Complete Profile
                    </a>
                </div>
            ` : `
                <div style="text-align: center; padding: 1rem; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius-md); color: var(--success-color);">
                    <i class="fas fa-check-circle"></i> Profile Complete!
                </div>
            `}
        </div>
    `;
}