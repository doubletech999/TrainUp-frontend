// ===== TrainUp - Supervisor Students JavaScript =====

let allStudents = [];
let filteredStudents = [];
let selectedStudent = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isLoggedIn()) {
        window.location.href = '../../login.html';
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

    // Load students
    await loadStudents();
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
 * Load students
 */
async function loadStudents() {
    try {
        const response = await apiRequest('/supervisor/students', {
            method: 'GET'
        });

        if (response.success) {
            allStudents = response.data || [];
            filteredStudents = [...allStudents];
            displayStudents(filteredStudents);
        } else {
            throw new Error('Failed to load students');
        }

    } catch (error) {
        console.error('Error loading students:', error);
        
        const container = document.getElementById('studentsList');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Students</h3>
                <p>Please refresh the page to try again</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Refresh Page
                </button>
            </div>
        `;
    }
}

/**
 * Filter students
 */
function filterStudents() {
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;

    filteredStudents = allStudents.filter(student => {
        const profile = student.studentProfile || {};
        
        // Search filter
        const matchesSearch = !searchQuery || 
            profile.firstName?.toLowerCase().includes(searchQuery) ||
            profile.lastName?.toLowerCase().includes(searchQuery) ||
            profile.studentId?.toLowerCase().includes(searchQuery) ||
            student.email?.toLowerCase().includes(searchQuery);

        // Year filter
        const matchesYear = yearFilter === 'all' || 
            profile.yearOfStudy?.toString() === yearFilter;

        // Status filter (simplified - you may need to enhance based on actual data)
        let matchesStatus = true;
        if (statusFilter !== 'all') {
            // This would need actual application/internship status from backend
            matchesStatus = true; // Placeholder
        }

        return matchesSearch && matchesYear && matchesStatus;
    });

    displayStudents(filteredStudents);
}

/**
 * Display students
 */
function displayStudents(students) {
    const container = document.getElementById('studentsList');
    document.getElementById('studentsCount').textContent = students.length;

    if (students.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-graduate"></i>
                <h3>No Students Found</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }

    container.innerHTML = students.map(student => {
        const profile = student.studentProfile || {};
        const initials = getInitials(profile.firstName, profile.lastName);
        
        return `
            <div class="internship-card" style="cursor: pointer;" onclick="viewStudentDetails('${student.id}')">
                <div class="internship-header">
                    <div class="user-avatar" style="width: 60px; height: 60px; font-size: 1.5rem;">
                        ${initials}
                    </div>
                    <div class="internship-title" style="flex: 1;">
                        <h3>${profile.firstName} ${profile.lastName}</h3>
                        <p class="company-name">
                            ${profile.studentId || 'N/A'} • ${profile.major || 'N/A'} • Year ${profile.yearOfStudy || 'N/A'}
                        </p>
                    </div>
                    <span class="status-badge ${student.isActive ? 'approved' : 'inactive'}">
                        ${student.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                    <div>
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">
                            <i class="fas fa-envelope"></i> Email
                        </strong>
                        <span style="font-size: 0.875rem;">${student.email}</span>
                    </div>
                    <div>
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">
                            <i class="fas fa-phone"></i> Phone
                        </strong>
                        <span style="font-size: 0.875rem;">${profile.phoneNumber || 'N/A'}</span>
                    </div>
                    <div>
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">
                            <i class="fas fa-university"></i> University
                        </strong>
                        <span style="font-size: 0.875rem;">${profile.university || 'N/A'}</span>
                    </div>
                    <div>
                        <strong style="display: block; color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.25rem;">
                            <i class="fas fa-calendar"></i> Registered
                        </strong>
                        <span style="font-size: 0.875rem;">${formatDate(student.createdAt)}</span>
                    </div>
                </div>

                ${profile.bio ? `
                    <p style="color: var(--text-secondary); line-height: 1.6; margin: 1rem 0;">
                        ${profile.bio.substring(0, 150)}${profile.bio.length > 150 ? '...' : ''}
                    </p>
                ` : ''}

                ${profile.skills && profile.skills.length > 0 ? `
                    <div class="internship-tags">
                        ${profile.skills.slice(0, 5).map(skill => 
                            `<span class="tag">${skill}</span>`
                        ).join('')}
                        ${profile.skills.length > 5 ? `
                            <span class="tag" style="background: var(--primary-color); color: white;">
                                +${profile.skills.length - 5} more
                            </span>
                        ` : ''}
                    </div>
                ` : ''}

                <div class="internship-footer" style="margin-top: 1rem;">
                    <div class="internship-actions">
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); viewStudentProgress('${student.id}')">
                            <i class="fas fa-chart-line"></i>
                            View Progress
                        </button>
                        <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); viewStudentDetails('${student.id}')">
                            <i class="fas fa-eye"></i>
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * View student details
 */
async function viewStudentDetails(studentId) {
    selectedStudent = allStudents.find(s => s.id === studentId);
    
    if (!selectedStudent) return;
    
    const profile = selectedStudent.studentProfile || {};
    const initials = getInitials(profile.firstName, profile.lastName);
    
    document.getElementById('studentDetails').innerHTML = `
        <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%); color: white; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <div style="width: 120px; height: 120px; background: white; color: var(--primary-color); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 700; margin: 0 auto 1rem;">
                ${initials}
            </div>
            <h2 style="color: white; margin-bottom: 0.5rem;">${profile.firstName} ${profile.lastName}</h2>
            <p style="opacity: 0.9;">${profile.studentId || 'Student'} • ${profile.major || 'Major'}</p>
        </div>

        <div style="display: grid; gap: 1.5rem;">
            <!-- Personal Information -->
            <div>
                <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                    <i class="fas fa-user"></i> Personal Information
                </h3>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Full Name:</strong>
                        <span>${profile.firstName} ${profile.lastName}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Student ID:</strong>
                        <span>${profile.studentId || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Email:</strong>
                        <span>${selectedStudent.email}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Phone:</strong>
                        <span>${profile.phoneNumber || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                        <strong>Status:</strong>
                        <span class="status-badge ${selectedStudent.isActive ? 'approved' : 'inactive'}">
                            ${selectedStudent.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Academic Information -->
            <div>
                <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                    <i class="fas fa-graduation-cap"></i> Academic Information
                </h3>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>University:</strong>
                        <span>${profile.university || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Major:</strong>
                        <span>${profile.major || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Year of Study:</strong>
                        <span>Year ${profile.yearOfStudy || 'N/A'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                        <strong>GPA:</strong>
                        <span>${profile.gpa || 'N/A'}</span>
                    </div>
                </div>
            </div>

            <!-- Bio -->
            ${profile.bio ? `
                <div>
                    <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                        <i class="fas fa-align-left"></i> About
                    </h3>
                    <p style="line-height: 1.8; color: var(--text-secondary); white-space: pre-wrap;">
                        ${profile.bio}
                    </p>
                </div>
            ` : ''}

            <!-- Skills -->
            ${profile.skills && profile.skills.length > 0 ? `
                <div>
                    <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                        <i class="fas fa-tools"></i> Skills
                    </h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${profile.skills.map(skill => `
                            <span style="background: var(--primary-light); color: var(--primary-color); padding: 0.5rem 1rem; border-radius: var(--radius-full); font-size: 0.875rem; font-weight: 500;">
                                ${skill}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Languages -->
            ${profile.languages && profile.languages.length > 0 ? `
                <div>
                    <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                        <i class="fas fa-language"></i> Languages
                    </h3>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${profile.languages.map(lang => `
                            <span style="background: var(--success-light); color: var(--success-color); padding: 0.5rem 1rem; border-radius: var(--radius-full); font-size: 0.875rem; font-weight: 500;">
                                ${lang}
                            </span>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Registration Date -->
            <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); color: var(--text-secondary); font-size: 0.875rem;">
                <i class="fas fa-calendar-plus"></i> Member since ${formatDate(selectedStudent.createdAt)}
            </div>
        </div>
    `;
    
    // Setup view progress button
    document.getElementById('viewProgressBtn').onclick = () => viewStudentProgress(studentId);
    
    // Show modal
    document.getElementById('studentModal').classList.add('active');
}

/**
 * Close student modal
 * This function is defined here to override the global one for better functionality
 */
function closeStudentModal() {
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.classList.remove('active');
    }
    selectedStudent = null;
}

// Make sure this function is available globally
window.closeStudentModal = closeStudentModal;

/**
 * View student progress
 */
async function viewStudentProgress(studentId) {
    try {
        showAlert('Loading student progress...', 'info');
        
        const response = await apiRequest(`/supervisor/students/${studentId}/progress`, {
            method: 'GET'
        });

        if (response.success) {
            closeStudentModal();
            displayProgressReport(response.data);
        } else {
            showAlert('No progress data available for this student', 'warning');
        }
    } catch (error) {
        console.error('Error loading student progress:', error);
        showAlert('Failed to load student progress', 'error');
    }
}

/**
 * Display progress report
 */
function displayProgressReport(progressData) {
    // This would open a new detailed progress view
    // For now, show alert
    const student = allStudents.find(s => s.id === studentId);
    if (student) {
        showAlert(`Progress report for ${student.profile?.firstName || 'Student'} will be available soon. This feature will show student's internship progress, evaluations, and achievements.`, 'info');
    }
    console.log('Progress data:', progressData);
}

/**
 * Export student data
 */
function exportStudentData() {
    if (filteredStudents.length === 0) {
        showAlert('No students to export', 'warning');
        return;
    }

    // Create CSV content
    let csv = 'Student ID,Name,Email,Phone,University,Major,Year,GPA,Status,Registered\n';
    
    filteredStudents.forEach(student => {
        const profile = student.studentProfile || {};
        const row = [
            profile.studentId || '',
            `${profile.firstName} ${profile.lastName}`,
            student.email,
            profile.phoneNumber || '',
            profile.university || '',
            profile.major || '',
            profile.yearOfStudy || '',
            profile.gpa || '',
            student.isActive ? 'Active' : 'Inactive',
            formatDate(student.createdAt)
        ];
        csv += row.map(field => `"${field}"`).join(',') + '\n';
    });

    // Download CSV
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    showAlert('Student data exported successfully!', 'success');
}

// Make sure these functions are available globally
window.exportStudentData = exportStudentData;
window.viewStudentDetails = viewStudentDetails;
window.viewStudentProgress = viewStudentProgress;
window.filterStudents = filterStudents;