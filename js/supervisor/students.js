// ===== TrainUp - Supervisor Students JavaScript =====

let allStudents = [];
let filteredStudents = [];
let selectedStudent = null;
let currentProgressData = null; // Store current progress data for export

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
        
        <!-- Loading evaluations section -->
        <div id="evaluationsSection" style="margin-top: 1.5rem;">
            <div style="text-align: center; padding: 2rem;">
                <i class="fas fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary-color);"></i>
                <p style="margin-top: 1rem; color: var(--text-secondary);">Loading evaluations...</p>
            </div>
        </div>
    `;
    
    // Load evaluations
    await loadStudentEvaluations(studentId);
    
    // Setup view progress button
    document.getElementById('viewProgressBtn').onclick = () => viewStudentProgress(studentId);
    
    const verifyBtn = document.getElementById('verifyStudentBtn');
    if (verifyBtn) {
        if (selectedStudent.isVerified === false) {
            verifyBtn.style.display = 'inline-flex';
            verifyBtn.onclick = () => verifyStudentEmail(studentId);
        } else {
            verifyBtn.style.display = 'none';
            verifyBtn.onclick = null;
        }
    }
    
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
 * Load student evaluations (monthly and final)
 */
async function loadStudentEvaluations(studentId) {
    const evaluationsSection = document.getElementById('evaluationsSection');
    if (!evaluationsSection) return;
    
    try {
        // Get student applications to find active internships
        const progressResponse = await apiRequest(`/supervisor/students/${studentId}/progress`, {
            method: 'GET'
        });
        
        if (!progressResponse.success || !progressResponse.data || progressResponse.data.length === 0) {
            evaluationsSection.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No active internships found for this student</p>
                </div>
            `;
            return;
        }
        
        const applications = progressResponse.data.filter(app => 
            app.status === 'ACCEPTED' || app.status === 'IN_PROGRESS'
        );
        
        if (applications.length === 0) {
            evaluationsSection.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No active internships found for this student</p>
                </div>
            `;
            return;
        }
        
        // Load evaluations for each application
        let evaluationsHTML = '';
        
        for (const app of applications) {
            // Load monthly evaluations
            const monthlyResponse = await getMonthlyEvaluationsByApplication(app.id);
            const monthlyEvaluations = monthlyResponse.success ? monthlyResponse.data : [];
            
            // Load final evaluation
            let finalEvaluation = null;
            try {
                const finalResponse = await getFinalEvaluationByApplication(app.id);
                if (finalResponse.success && finalResponse.data) {
                    finalEvaluation = finalResponse.data;
                }
            } catch (e) {
                // Final evaluation doesn't exist yet
            }
            
            // Check if can submit final evaluation
            let canSubmitFinal = false;
            try {
                const canSubmitResponse = await canSubmitFinalEvaluation(app.id);
                canSubmitFinal = canSubmitResponse.success && canSubmitResponse.data === true;
            } catch (e) {
                // Cannot submit
            }
            
            evaluationsHTML += `
                <div style="margin-top: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                    <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                        <i class="fas fa-briefcase"></i> ${app.internship?.title || 'Internship'}
                    </h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                        ${app.internship?.companyName || 'Company'}
                    </p>
                    
                    <!-- Monthly Evaluations -->
                    <div style="margin-bottom: 2rem;">
                        <h4 style="margin-bottom: 1rem; color: var(--text-primary);">
                            <i class="fas fa-calendar-check"></i> Monthly Evaluations
                        </h4>
                        ${monthlyEvaluations.length === 0 ? `
                            <div style="padding: 1rem; background: white; border-radius: var(--radius-md); text-align: center; color: var(--text-secondary);">
                                <i class="fas fa-inbox" style="opacity: 0.5; margin-bottom: 0.5rem;"></i>
                                <p>No monthly evaluations received yet</p>
                            </div>
                        ` : `
                            <div style="display: grid; gap: 1rem;">
                                ${monthlyEvaluations.map(eval => `
                                    <div style="padding: 1rem; background: white; border-radius: var(--radius-md); border-left: 4px solid var(--primary-color);">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                            <strong style="color: var(--primary-color);">Month ${eval.monthNumber}</strong>
                                            <span class="status-badge ${eval.status === 'SUBMITTED' ? 'approved' : 'pending'}">
                                                ${eval.status}
                                            </span>
                                        </div>
                                        ${eval.overallRating ? `
                                            <div style="margin: 0.5rem 0;">
                                                <strong>Overall Rating:</strong> ${eval.overallRating}/5
                                            </div>
                                        ` : ''}
                                        ${eval.progressSummary ? `
                                            <div style="margin: 0.5rem 0; color: var(--text-secondary);">
                                                <strong>Progress:</strong> ${eval.progressSummary.substring(0, 100)}${eval.progressSummary.length > 100 ? '...' : ''}
                                            </div>
                                        ` : ''}
                                        <div style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.5rem;">
                                            <i class="fas fa-calendar"></i> ${formatDate(eval.createdAt)}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                    </div>
                    
                    <!-- Final Evaluation -->
                    <div>
                        <h4 style="margin-bottom: 1rem; color: var(--text-primary);">
                            <i class="fas fa-flag-checkered"></i> Final Evaluation
                        </h4>
                        ${finalEvaluation ? `
                            <div style="padding: 1rem; background: white; border-radius: var(--radius-md); border-left: 4px solid var(--success-color);">
                                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                                    <strong style="color: var(--success-color);">Final Evaluation Submitted</strong>
                                    <span class="status-badge approved">SUBMITTED</span>
                                </div>
                                ${finalEvaluation.overallRating ? `
                                    <div style="margin: 0.5rem 0;">
                                        <strong>Overall Rating:</strong> ${finalEvaluation.overallRating}/5
                                    </div>
                                ` : ''}
                                ${finalEvaluation.overallPerformance ? `
                                    <div style="margin: 0.5rem 0; color: var(--text-secondary);">
                                        <strong>Performance:</strong> ${finalEvaluation.overallPerformance.substring(0, 100)}${finalEvaluation.overallPerformance.length > 100 ? '...' : ''}
                                    </div>
                                ` : ''}
                                <div style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.5rem;">
                                    <i class="fas fa-calendar"></i> ${formatDate(finalEvaluation.submittedAt)}
                                </div>
                            </div>
                        ` : canSubmitFinal ? `
                            <div style="padding: 1rem; background: rgba(245, 158, 11, 0.1); border-radius: var(--radius-md); border-left: 4px solid #f59e0b;">
                                <p style="margin-bottom: 1rem; color: var(--text-primary);">
                                    <i class="fas fa-exclamation-circle"></i> 
                                    All monthly evaluations have been received. You can now submit the final evaluation.
                                </p>
                                <button class="btn btn-primary btn-sm" onclick="openFinalEvaluationModal('${app.id}', '${app.internship?.title || 'Internship'}')">
                                    <i class="fas fa-flag-checkered"></i>
                                    Submit Final Evaluation
                                </button>
                            </div>
                        ` : `
                            <div style="padding: 1rem; background: white; border-radius: var(--radius-md); text-align: center; color: var(--text-secondary);">
                                <i class="fas fa-clock" style="opacity: 0.5; margin-bottom: 0.5rem;"></i>
                                <p>Waiting for all monthly evaluations to be submitted</p>
                                <p style="font-size: 0.875rem; margin-top: 0.5rem;">
                                    ${monthlyEvaluations.length} / ${app.internship?.duration || 'N/A'} evaluations received
                                </p>
                            </div>
                        `}
                    </div>
                </div>
            `;
        }
        
        evaluationsSection.innerHTML = `
            <div style="margin-top: 2rem;">
                <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                    <i class="fas fa-clipboard-check"></i> Evaluations
                </h3>
                ${evaluationsHTML}
            </div>
        `;
        
    } catch (error) {
        console.error('Error loading evaluations:', error);
        evaluationsSection.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--error-color);">
                <i class="fas fa-exclamation-circle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                <p>Failed to load evaluations. Please try again.</p>
            </div>
        `;
    }
}

/**
 * View student progress
 */
async function viewStudentProgress(studentId) {
    try {
        showAlert('Loading student progress...', 'info');
        
        const response = await apiRequest(`/supervisor/students/${studentId}/progress`, {
            method: 'GET'
        });

        if (response.success && response.data) {
            closeStudentModal();
            displayProgressReport(studentId, response.data);
        } else {
            showAlert('No progress data available for this student', 'warning');
        }
    } catch (error) {
        console.error('Error loading student progress:', error);
        showAlert(error.message || 'Failed to load student progress', 'error');
    }
}

async function verifyStudentEmail(studentId) {
    const notes = prompt('Optional: add notes for this verification (leave blank to skip).');
    const payload = {};
    if (notes && notes.trim()) {
        payload.notes = notes.trim();
    }

    try {
        showAlert('Verifying student...', 'info');
        const response = await apiRequest(API_ENDPOINTS.SUPERVISOR.VERIFY_STUDENT(studentId), {
            method: 'PUT',
            body: JSON.stringify(payload)
        });

        if (response.success) {
            showAlert('Student verified successfully!', 'success');
            closeStudentModal();
            await loadStudents();
        } else {
            throw new Error(response.message || 'Failed to verify student');
        }
    } catch (error) {
        console.error('Error verifying student:', error);
        showAlert(error.message || 'Failed to verify student', 'error');
    }
}

/**
 * Display progress report
 */
function displayProgressReport(studentId, progressData) {
    const student = allStudents.find(s => s.id === studentId);
    const studentName = student?.studentProfile 
        ? `${student.studentProfile.firstName || ''} ${student.studentProfile.lastName || ''}`.trim() 
        : 'Student';
    
    const applications = Array.isArray(progressData) ? progressData : [];
    
    // Store progress data for export
    currentProgressData = {
        studentId: studentId,
        student: student,
        applications: applications
    };
    
    // Create progress report modal HTML
    const progressModalHTML = `
        <div class="modal active" id="progressModal" style="z-index: 10000;">
            <div class="modal-content" style="max-width: 1000px; max-height: 90vh;">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-chart-line"></i>
                        Progress Report - ${studentName}
                    </h2>
                    <button class="modal-close" onclick="closeProgressModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body" style="max-height: calc(90vh - 150px); overflow-y: auto;">
                    ${applications.length === 0 ? `
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <h3>No Progress Data</h3>
                            <p>This student hasn't applied to any internships yet.</p>
                        </div>
                    ` : `
                        <div style="display: grid; gap: 1.5rem;">
                            ${applications.map((app, index) => {
                                const statusClass = (app.status || '').toLowerCase().replace('_', '-');
                                const statusColors = {
                                    'submitted': { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' },
                                    'under-review': { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
                                    'shortlisted': { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' },
                                    'accepted': { bg: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' },
                                    'rejected': { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' },
                                    'withdrawn': { bg: 'rgba(107, 114, 128, 0.1)', color: '#6b7280' }
                                };
                                const statusColor = statusColors[statusClass] || statusColors['submitted'];
                                
                                return `
                                    <div class="card" style="border-left: 4px solid ${statusColor.color};">
                                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                                            <div>
                                                <h3 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">
                                                    ${app.internship?.title || 'Internship'}
                                                </h3>
                                                <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                                                    ${app.internship?.companyName || 'Company'}
                                                </p>
                                            </div>
                                            <span class="status-badge" style="background: ${statusColor.bg}; color: ${statusColor.color}; padding: 0.5rem 1rem; border-radius: var(--radius-md); font-weight: 600; font-size: 0.875rem;">
                                                ${app.status || 'SUBMITTED'}
                                            </span>
                                        </div>
                                        
                                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
                                            ${app.appliedAt ? `
                                                <div>
                                                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Applied Date</div>
                                                    <div style="font-weight: 600; color: var(--text-primary);">
                                                        ${new Date(app.appliedAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ` : ''}
                                            ${app.internship?.startDate ? `
                                                <div>
                                                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Start Date</div>
                                                    <div style="font-weight: 600; color: var(--text-primary);">
                                                        ${new Date(app.internship.startDate).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ` : ''}
                                            ${app.internship?.duration ? `
                                                <div>
                                                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">Duration</div>
                                                    <div style="font-weight: 600; color: var(--text-primary);">
                                                        ${app.internship.duration}
                                                    </div>
                                                </div>
                                            ` : ''}
                                        </div>
                                        
                                        ${app.companyNotes ? `
                                            <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                                                <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem;">Company Notes</div>
                                                <div style="color: var(--text-secondary); line-height: 1.6;">
                                                    ${app.companyNotes}
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    `}
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeProgressModal()">
                        Close
                    </button>
                    ${applications.length > 0 ? `
                        <button class="btn btn-primary" onclick="exportProgressReport('${studentId}')">
                            <i class="fas fa-download"></i>
                            Export Report
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Remove existing progress modal if any
    const existingModal = document.getElementById('progressModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', progressModalHTML);
    
    // Close modal when clicking outside
    const modal = document.getElementById('progressModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeProgressModal();
            }
        });
    }
}

/**
 * Close progress modal
 */
function closeProgressModal() {
    const modal = document.getElementById('progressModal');
    if (modal) {
        modal.remove();
    }
    // Clear progress data when modal is closed
    currentProgressData = null;
}

/**
 * Export progress report
 */
async function exportProgressReport(studentId) {
    try {
        // Get progress data if not already loaded
        let progressData = currentProgressData;
        
        if (!progressData || progressData.studentId !== studentId) {
            showAlert('Loading data for export...', 'info');
            
            const response = await apiRequest(`/supervisor/students/${studentId}/progress`, {
                method: 'GET'
            });
            
            if (!response.success || !response.data) {
                showAlert('No data available to export', 'warning');
                return;
            }
            
            const student = allStudents.find(s => s.id === studentId);
            progressData = {
                studentId: studentId,
                student: student,
                applications: Array.isArray(response.data) ? response.data : []
            };
        }
        
        const student = progressData.student;
        const applications = progressData.applications;
        
        if (applications.length === 0) {
            showAlert('No applications to export', 'warning');
            return;
        }
        
        const studentName = student?.studentProfile 
            ? `${student.studentProfile.firstName || ''}_${student.studentProfile.lastName || ''}`.trim().replace(/\s+/g, '_')
            : 'Student';
        
        // Create CSV content
        let csv = `Student Progress Report\n`;
        csv += `Student: ${student?.studentProfile?.firstName || ''} ${student?.studentProfile?.lastName || ''}\n`;
        csv += `Email: ${student?.email || 'N/A'}\n`;
        csv += `Student ID: ${student?.studentProfile?.studentId || 'N/A'}\n`;
        csv += `University: ${student?.studentProfile?.university || 'N/A'}\n`;
        csv += `Major: ${student?.studentProfile?.major || 'N/A'}\n`;
        csv += `Report Generated: ${new Date().toLocaleString()}\n\n`;
        
        csv += `Internship Applications\n`;
        csv += `Application ID,Internship Title,Company,Status,Applied Date,Start Date,Duration,Company Notes\n`;
        
        applications.forEach(app => {
            const row = [
                app.id || '',
                app.internship?.title || 'N/A',
                app.internship?.companyName || 'N/A',
                app.status || 'N/A',
                app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A',
                app.internship?.startDate ? new Date(app.internship.startDate).toLocaleDateString() : 'N/A',
                app.internship?.duration || 'N/A',
                (app.companyNotes || '').replace(/"/g, '""') // Escape quotes in CSV
            ];
            csv += row.map(field => `"${field}"`).join(',') + '\n';
        });
        
        // Add summary
        csv += `\nSummary\n`;
        csv += `Total Applications: ${applications.length}\n`;
        
        const statusCounts = {};
        applications.forEach(app => {
            const status = app.status || 'UNKNOWN';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        
        Object.entries(statusCounts).forEach(([status, count]) => {
            csv += `${status}: ${count}\n`;
        });
        
        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Progress_Report_${studentName}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        showAlert('Progress report exported successfully!', 'success');
        
    } catch (error) {
        console.error('Error exporting progress report:', error);
        showAlert('Failed to export progress report. Please try again.', 'error');
    }
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

/**
 * Open final evaluation modal
 */
function openFinalEvaluationModal(applicationId, internshipTitle) {
    const modalHTML = `
        <div class="modal active" id="finalEvaluationModal" style="z-index: 10001;">
            <div class="modal-content" style="max-width: 800px; max-height: 90vh;">
                <div class="modal-header">
                    <h2>
                        <i class="fas fa-flag-checkered"></i>
                        Submit Final Evaluation - ${internshipTitle}
                    </h2>
                    <button class="modal-close" onclick="closeFinalEvaluationModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="modal-body" style="max-height: calc(90vh - 200px); overflow-y: auto;">
                    <form id="finalEvaluationForm" onsubmit="submitFinalEvaluationForm(event, '${applicationId}')">
                        <div style="display: grid; gap: 1.5rem;">
                            <!-- Ratings -->
                            <div>
                                <h3 style="margin-bottom: 1rem;">Ratings (1-5)</h3>
                                <div style="display: grid; gap: 1rem;">
                                    <div class="form-group">
                                        <label>Overall Rating *</label>
                                        <select id="overallRating" required>
                                            <option value="">Select rating</option>
                                            <option value="1">1 - Poor</option>
                                            <option value="2">2 - Below Average</option>
                                            <option value="3">3 - Average</option>
                                            <option value="4">4 - Good</option>
                                            <option value="5">5 - Excellent</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Technical Skills *</label>
                                        <select id="technicalSkills" required>
                                            <option value="">Select rating</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                            <option value="5">5</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Soft Skills *</label>
                                        <select id="softSkills" required>
                                            <option value="">Select rating</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                            <option value="5">5</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Professionalism *</label>
                                        <select id="professionalism" required>
                                            <option value="">Select rating</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                            <option value="5">5</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Work Ethic *</label>
                                        <select id="workEthic" required>
                                            <option value="">Select rating</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                            <option value="5">5</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Communication *</label>
                                        <select id="communication" required>
                                            <option value="">Select rating</option>
                                            <option value="1">1</option>
                                            <option value="2">2</option>
                                            <option value="3">3</option>
                                            <option value="4">4</option>
                                            <option value="5">5</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Feedback -->
                            <div>
                                <h3 style="margin-bottom: 1rem;">Feedback</h3>
                                <div style="display: grid; gap: 1rem;">
                                    <div class="form-group">
                                        <label>Overall Performance *</label>
                                        <textarea id="overallPerformance" rows="4" required placeholder="Describe the student's overall performance..."></textarea>
                                    </div>
                                    <div class="form-group">
                                        <label>Strengths</label>
                                        <textarea id="strengths" rows="3" placeholder="List the student's strengths..."></textarea>
                                    </div>
                                    <div class="form-group">
                                        <label>Areas for Improvement</label>
                                        <textarea id="areasForImprovement" rows="3" placeholder="Suggest areas for improvement..."></textarea>
                                    </div>
                                    <div class="form-group">
                                        <label>Final Comments</label>
                                        <textarea id="finalComments" rows="3" placeholder="Additional comments..."></textarea>
                                    </div>
                                    <div class="form-group">
                                        <label>Recommendations</label>
                                        <textarea id="recommendations" rows="3" placeholder="Recommendations for the student..."></textarea>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Academic Assessment -->
                            <div>
                                <h3 style="margin-bottom: 1rem;">Academic Assessment</h3>
                                <div style="display: grid; gap: 1rem;">
                                    <div class="form-group">
                                        <label>Academic Progress *</label>
                                        <textarea id="academicProgress" rows="3" required placeholder="Describe the student's academic progress..."></textarea>
                                    </div>
                                    <div class="form-group">
                                        <label>Learning Outcomes *</label>
                                        <textarea id="learningOutcomes" rows="3" required placeholder="Describe the learning outcomes achieved..."></textarea>
                                    </div>
                                    <div class="form-group">
                                        <label>Meets Academic Requirements *</label>
                                        <select id="meetsAcademicRequirements" required>
                                            <option value="">Select</option>
                                            <option value="true">Yes</option>
                                            <option value="false">No</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="closeFinalEvaluationModal()">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="document.getElementById('finalEvaluationForm').requestSubmit()">
                        <i class="fas fa-check"></i>
                        Submit Final Evaluation
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('finalEvaluationModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Close modal when clicking outside
    const modal = document.getElementById('finalEvaluationModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeFinalEvaluationModal();
            }
        });
    }
}

/**
 * Submit final evaluation form
 */
async function submitFinalEvaluationForm(event, applicationId) {
    event.preventDefault();
    
    try {
        const formData = {
            applicationId: applicationId,
            overallRating: parseInt(document.getElementById('overallRating').value),
            technicalSkills: parseInt(document.getElementById('technicalSkills').value),
            softSkills: parseInt(document.getElementById('softSkills').value),
            professionalism: parseInt(document.getElementById('professionalism').value),
            workEthic: parseInt(document.getElementById('workEthic').value),
            communication: parseInt(document.getElementById('communication').value),
            overallPerformance: document.getElementById('overallPerformance').value,
            strengths: document.getElementById('strengths').value || null,
            areasForImprovement: document.getElementById('areasForImprovement').value || null,
            finalComments: document.getElementById('finalComments').value || null,
            recommendations: document.getElementById('recommendations').value || null,
            academicProgress: document.getElementById('academicProgress').value,
            learningOutcomes: document.getElementById('learningOutcomes').value,
            meetsAcademicRequirements: document.getElementById('meetsAcademicRequirements').value === 'true'
        };
        
        showAlert('Submitting final evaluation...', 'info');
        
        const response = await submitFinalEvaluation(formData);
        
        if (response.success) {
            showAlert('Final evaluation submitted successfully!', 'success');
            closeFinalEvaluationModal();
            
            // Reload student details to show the new evaluation
            if (selectedStudent) {
                await viewStudentDetails(selectedStudent.id);
            }
        } else {
            throw new Error(response.message || 'Failed to submit final evaluation');
        }
    } catch (error) {
        console.error('Error submitting final evaluation:', error);
        showAlert(error.message || 'Failed to submit final evaluation. Please try again.', 'error');
    }
}

/**
 * Close final evaluation modal
 */
function closeFinalEvaluationModal() {
    const modal = document.getElementById('finalEvaluationModal');
    if (modal) {
        modal.remove();
    }
}

// Make sure these functions are available globally
window.exportStudentData = exportStudentData;
window.viewStudentDetails = viewStudentDetails;
window.viewStudentProgress = viewStudentProgress;
window.filterStudents = filterStudents;
window.closeProgressModal = closeProgressModal;
window.exportProgressReport = exportProgressReport;
window.openFinalEvaluationModal = openFinalEvaluationModal;
window.submitFinalEvaluationForm = submitFinalEvaluationForm;
window.closeFinalEvaluationModal = closeFinalEvaluationModal;
