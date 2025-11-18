// ===== TrainUp - Approve Completion JavaScript =====

let currentInternship = null;
let internshipId = null;
let studentData = null;

document.addEventListener('DOMContentLoaded', async () => {
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

    loadSupervisorInfo(userData);

    // Get internship ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    internshipId = urlParams.get('id');

    if (!internshipId) {
        showAlert('Invalid internship ID', 'error');
        setTimeout(() => window.location.href = 'students.html', 2000);
        return;
    }

    await loadInternshipDetails();

    document.getElementById('approvalForm').addEventListener('submit', handleApproval);
});

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

async function loadInternshipDetails() {
    try {
        const response = await apiRequest(`/supervisor/internships/${internshipId}/completion`, {
            method: 'GET'
        });

        if (response.success) {
            currentInternship = response.data.internship;
            studentData = response.data.student;
            const companyEvaluation = response.data.companyEvaluation;

            displayStudentInfo();
            displayProgressTimeline();

            if (companyEvaluation) {
                displayCompanyEvaluation(companyEvaluation);
            }

            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('completionContent').style.display = 'block';
        } else {
            throw new Error('Failed to load internship details');
        }

    } catch (error) {
        console.error('Error loading internship:', error);
        document.getElementById('loadingState').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Details</h3>
                <p>${error.message}</p>
                <a href="students.html" class="btn btn-primary">
                    Back to Students
                </a>
            </div>
        `;
    }
}

function displayStudentInfo() {
    const student = studentData || {};
    const internship = currentInternship || {};
    const company = internship.company || {};

    const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim();
    const studentInitials = getInitials(student.firstName, student.lastName);

    document.getElementById('studentInfo').innerHTML = `
        <div style="display: flex; gap: 1.5rem; align-items: start;">
            <div style="width: 80px; height: 80px; background: var(--primary-color); color: white; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; flex-shrink: 0;">
                ${studentInitials}
            </div>
            <div style="flex: 1;">
                <h2 style="margin-bottom: 0.5rem;">${studentName}</h2>
                <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                    <i class="fas fa-envelope"></i> ${student.email || 'N/A'} •
                    <i class="fas fa-id-card"></i> ${student.studentId || 'N/A'}
                </p>
                <div style="background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%); color: white; padding: 1rem; border-radius: var(--radius-md);">
                    <h3 style="color: white; margin-bottom: 0.5rem;">${internship.title || 'Internship'}</h3>
                    <p style="opacity: 0.9; font-size: 0.875rem;">
                        <i class="fas fa-building"></i> ${company.name || 'Company'} •
                        <i class="fas fa-map-marker-alt"></i> ${internship.location || 'N/A'} •
                        <i class="fas fa-clock"></i> ${internship.duration || 0} months
                    </p>
                    <p style="opacity: 0.9; font-size: 0.875rem; margin-top: 0.5rem;">
                        <i class="fas fa-calendar"></i>
                        ${formatDate(internship.startDate)} - ${formatDate(internship.endDate)}
                    </p>
                </div>
            </div>
        </div>
    `;
}

function displayProgressTimeline() {
    const internship = currentInternship || {};

    const timeline = [
        {
            icon: 'fa-check-circle',
            title: 'Application Accepted',
            date: internship.acceptedDate,
            status: 'completed'
        },
        {
            icon: 'fa-play-circle',
            title: 'Internship Started',
            date: internship.startDate,
            status: 'completed'
        },
        {
            icon: 'fa-tasks',
            title: 'In Progress',
            date: null,
            status: internship.status === 'COMPLETED' ? 'completed' : 'in_progress'
        },
        {
            icon: 'fa-flag-checkered',
            title: 'Internship Ended',
            date: internship.endDate,
            status: internship.status === 'COMPLETED' ? 'completed' : 'pending'
        },
        {
            icon: 'fa-star',
            title: 'Company Evaluation',
            date: internship.evaluatedDate,
            status: internship.evaluatedDate ? 'completed' : 'pending'
        },
        {
            icon: 'fa-graduation-cap',
            title: 'Supervisor Approval',
            date: null,
            status: 'pending'
        }
    ];

    document.getElementById('progressTimeline').innerHTML = timeline.map(item => `
        <div class="timeline-item">
            <div class="timeline-icon ${item.status}">
                <i class="fas ${item.icon}"></i>
            </div>
            <div class="timeline-content">
                <strong>${item.title}</strong>
                ${item.date ? `
                    <p style="color: var(--text-secondary); font-size: 0.875rem; margin-top: 0.25rem;">
                        ${formatDate(item.date)}
                    </p>
                ` : ''}
                ${item.status === 'in_progress' ? `
                    <span style="background: var(--warning-color); color: white; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; display: inline-block; margin-top: 0.5rem;">
                        In Progress
                    </span>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function displayCompanyEvaluation(evaluation) {
    document.getElementById('companyEvaluationSection').style.display = 'block';

    const rating = evaluation.overallRating || 0;

    document.getElementById('companyEvaluation').innerHTML = `
        <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: var(--radius-md); border-left: 4px solid var(--success-color);">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                    <h3 style="margin-bottom: 0.5rem;">Overall Performance</h3>
                    <p style="color: var(--text-secondary); font-size: 0.875rem;">
                        Evaluated by ${evaluation.evaluator?.name || 'Company'}
                    </p>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">
                        ${rating.toFixed(1)}
                    </div>
                    <div style="color: #FCD34D; font-size: 1.25rem;">
                        ${'★'.repeat(Math.round(rating))}${'☆'.repeat(5 - Math.round(rating))}
                    </div>
                </div>
            </div>

            ${evaluation.comments ? `
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-primary); border-radius: var(--radius-sm);">
                    <strong style="display: block; margin-bottom: 0.5rem;">
                        <i class="fas fa-comment"></i> Comments
                    </strong>
                    <p style="color: var(--text-secondary); line-height: 1.6;">
                        ${evaluation.comments}
                    </p>
                </div>
            ` : ''}

            ${evaluation.wouldRecommend !== undefined ? `
                <div style="margin-top: 1rem; padding: 1rem; background: ${evaluation.wouldRecommend ? '#D1FAE5' : '#FEE2E2'}; border-radius: var(--radius-sm);">
                    <i class="fas ${evaluation.wouldRecommend ? 'fa-check-circle' : 'fa-times-circle'}"
                       style="color: ${evaluation.wouldRecommend ? '#065F46' : '#991B1B'};"></i>
                    <strong style="margin-left: 0.5rem; color: ${evaluation.wouldRecommend ? '#065F46' : '#991B1B'};">
                        ${evaluation.wouldRecommend ? 'Recommended for future opportunities' : 'Not recommended'}
                    </strong>
                </div>
            ` : ''}
        </div>
    `;

    // Auto-check company evaluation requirement
    if (evaluation) {
        document.getElementById('req3').checked = true;
        document.querySelector('[onclick="toggleCheckbox(\'req3\')"]').classList.add('checked');
    }
}

function toggleCheckbox(checkboxId) {
    const checkbox = document.getElementById(checkboxId);
    checkbox.checked = !checkbox.checked;

    const item = checkbox.closest('.checklist-item');
    if (checkbox.checked) {
        item.classList.add('checked');
    } else {
        item.classList.remove('checked');
    }
}

async function handleApproval(event) {
    event.preventDefault();

    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

    // Validate
    let isValid = true;

    const supervisorComments = document.getElementById('supervisorComments').value.trim();
    if (!supervisorComments) {
        document.getElementById('supervisorCommentsError').textContent = 'Supervisor comments are required';
        isValid = false;
    }

    const certifyCompletion = document.getElementById('certifyCompletion').checked;
    if (!certifyCompletion) {
        document.getElementById('certifyCompletionError').textContent = 'You must certify the completion';
        isValid = false;
    }

    if (!isValid) {
        showAlert('Please complete all required fields', 'error');
        return;
    }

    // Prepare approval data
    const approvalData = {
        internshipId: internshipId,
        supervisorComments: supervisorComments,
        grade: document.getElementById('grade').value || null,
        recommendations: document.getElementById('recommendations').value.trim() || null,
        approved: true,
        completionChecklist: {
            completedDuration: document.getElementById('req1').checked,
            submittedReports: document.getElementById('req2').checked,
            companyEvaluationReceived: document.getElementById('req3').checked,
            attendanceMet: document.getElementById('req4').checked,
            objectivesAchieved: document.getElementById('req5').checked
        }
    };

    // Show loading
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitBtnLoader = document.getElementById('submitBtnLoader');

    submitBtn.disabled = true;
    submitBtnText.style.display = 'none';
    submitBtnLoader.style.display = 'inline-block';

    try {
        const response = await apiRequest(`/supervisor/internships/${internshipId}/complete`, {
            method: 'PUT',
            body: JSON.stringify(approvalData)
        });

        if (response.success) {
            showAlert('Internship completion approved successfully!', 'success');

            setTimeout(() => {
                window.location.href = 'students.html';
            }, 2000);
        } else {
            showAlert(response.message || 'Failed to approve completion', 'error');
        }

    } catch (error) {
        console.error('Error approving completion:', error);
        showAlert(error.message || 'Failed to approve completion. Please try again.', 'error');

    } finally {
        submitBtn.disabled = false;
        submitBtnText.style.display = 'inline';
        submitBtnLoader.style.display = 'none';
    }
}

async function rejectCompletion() {
    const reason = prompt('Please provide a reason for rejecting the completion (required):');

    if (!reason || reason.trim() === '') {
        showAlert('Rejection reason is required', 'error');
        return;
    }

    if (!confirm('Are you sure you want to reject this internship completion?')) {
        return;
    }

    try {
        showAlert('Processing rejection...', 'info');

        const response = await apiRequest(`/supervisor/internships/${internshipId}/complete`, {
            method: 'PUT',
            body: JSON.stringify({
                internshipId: internshipId,
                approved: false,
                supervisorComments: reason
            })
        });

        if (response.success) {
            showAlert('Completion rejected successfully', 'success');

            setTimeout(() => {
                window.location.href = 'students.html';
            }, 2000);
        } else {
            showAlert(response.message || 'Failed to reject completion', 'error');
        }

    } catch (error) {
        console.error('Error rejecting completion:', error);
        showAlert(error.message || 'Failed to reject completion', 'error');
    }
}

// Make functions globally available
window.toggleCheckbox = toggleCheckbox;
window.handleApproval = handleApproval;
window.rejectCompletion = rejectCompletion;

