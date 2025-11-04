// ===== TrainUp - Student Evaluations JavaScript =====

let allEvaluations = [];
let pendingCompanies = [];
let currentFilter = 'all';

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

    loadUserInfo(userData);
    await loadEvaluations();
    await loadPendingCompanies();
});

function loadUserInfo(userData) {
    const profile = userData.profile;
    
    if (profile) {
        const fullName = `${profile.firstName} ${profile.lastName}`;
        const initials = getInitials(profile.firstName, profile.lastName);
        
        document.getElementById('userName').textContent = fullName;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userAvatar').textContent = initials;
    }
}

async function loadEvaluations() {
    try {
        const response = await apiRequest('/evaluations/my-evaluations', {
            method: 'GET'
        });

        if (response.success) {
            allEvaluations = response.data || [];
            updateRatingSummary();
            displayEvaluations(allEvaluations);
        } else {
            throw new Error('Failed to load evaluations');
        }

    } catch (error) {
        console.error('Error loading evaluations:', error);
        
        document.getElementById('evaluationsList').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-circle"></i>
                <h3>Error Loading Evaluations</h3>
                <p>Please refresh the page to try again</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    Refresh Page
                </button>
            </div>
        `;
    }
}

async function loadPendingCompanies() {
    try {
        const response = await apiRequest('/evaluations/pending-companies', {
            method: 'GET'
        });

        if (response.success && response.data && response.data.length > 0) {
            pendingCompanies = response.data;
            displayPendingCompanies();
        }

    } catch (error) {
        console.error('Error loading pending companies:', error);
    }
}

function updateRatingSummary() {
    const companyEvals = allEvaluations.filter(e => e.evaluatorType === 'COMPANY');
    const supervisorEvals = allEvaluations.filter(e => e.evaluatorType === 'SUPERVISOR');
    
    const totalRatings = allEvaluations.map(e => e.overallRating).filter(r => r);
    const avgRating = totalRatings.length > 0 
        ? (totalRatings.reduce((a, b) => a + b, 0) / totalRatings.length).toFixed(1)
        : '-';
    
    document.getElementById('overallRating').textContent = avgRating;
    document.getElementById('totalEvaluations').textContent = allEvaluations.length;
    document.getElementById('companyEvaluations').textContent = companyEvals.length;
    document.getElementById('supervisorEvaluations').textContent = supervisorEvals.length;
}

function filterEvaluations(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    let filtered = allEvaluations;
    
    if (filter === 'COMPANY' || filter === 'SUPERVISOR') {
        filtered = allEvaluations.filter(e => e.evaluatorType === filter);
    } else if (filter === 'PENDING') {
        displayPendingCompanies();
        document.getElementById('evaluationsList').style.display = 'none';
        document.getElementById('companiesToEvaluate').style.display = 'block';
        return;
    }
    
    document.getElementById('evaluationsList').style.display = 'block';
    document.getElementById('companiesToEvaluate').style.display = 'none';
    displayEvaluations(filtered);
}

function displayEvaluations(evaluations) {
    const container = document.getElementById('evaluationsList');
    document.getElementById('evaluationsCount').textContent = evaluations.length;

    if (evaluations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <h3>No Evaluations Yet</h3>
                <p>Complete internships to receive evaluations from companies and supervisors</p>
            </div>
        `;
        return;
    }

    container.innerHTML = evaluations.map(evaluation => {
        const rating = evaluation.overallRating || 0;
        const badge = getPerformanceBadge(rating);
        const isCompany = evaluation.evaluatorType === 'COMPANY';
        
        return `
            <div class="evaluation-card">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
                            <h3 style="margin: 0;">
                                ${isCompany ? evaluation.company?.name || 'Company' : 'Academic Supervisor'}
                            </h3>
                            ${badge}
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                            <i class="fas ${isCompany ? 'fa-building' : 'fa-user-tie'}"></i>
                            <span>${isCompany ? 'Company Evaluation' : 'Supervisor Evaluation'}</span>
                            <span>•</span>
                            <i class="fas fa-calendar"></i>
                            <span>${formatDate(evaluation.evaluationDate)}</span>
                        </div>
                    </div>
                    
                    <div style="text-align: right;">
                        <div class="rating-stars">
                            ${getRatingStars(rating)}
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">
                            ${rating.toFixed(1)} / 5.0
                        </div>
                    </div>
                </div>

                ${evaluation.internship ? `
                    <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 1rem;">
                        <strong style="display: block; margin-bottom: 0.25rem;">
                            <i class="fas fa-briefcase"></i> Internship Position
                        </strong>
                        <span>${evaluation.internship.title}</span>
                    </div>
                ` : ''}

                <!-- Rating Breakdown -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin: 1rem 0;">
                    ${evaluation.technicalSkills ? `
                        <div style="text-align: center; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.25rem;">
                                ${evaluation.technicalSkills}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">Technical Skills</div>
                        </div>
                    ` : ''}
                    ${evaluation.communication ? `
                        <div style="text-align: center; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.25rem;">
                                ${evaluation.communication}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">Communication</div>
                        </div>
                    ` : ''}
                    ${evaluation.teamwork ? `
                        <div style="text-align: center; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.25rem;">
                                ${evaluation.teamwork}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">Teamwork</div>
                        </div>
                    ` : ''}
                    ${evaluation.professionalism ? `
                        <div style="text-align: center; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.25rem;">
                                ${evaluation.professionalism}
                            </div>
                            <div style="font-size: 0.75rem; color: var(--text-secondary);">Professionalism</div>
                        </div>
                    ` : ''}
                </div>

                ${evaluation.comments ? `
                    <div style="margin-top: 1rem; padding: 1rem; background: #F0F9FF; border-left: 4px solid var(--info-color); border-radius: var(--radius-md);">
                        <strong style="display: block; margin-bottom: 0.5rem; color: var(--info-color);">
                            <i class="fas fa-comment"></i> Feedback
                        </strong>
                        <p style="color: var(--text-secondary); line-height: 1.6; white-space: pre-wrap;">
                            ${evaluation.comments}
                        </p>
                    </div>
                ` : ''}

                ${evaluation.strengths || evaluation.areasForImprovement ? `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 1rem;">
                        ${evaluation.strengths ? `
                            <div style="padding: 1rem; background: #D1FAE5; border-radius: var(--radius-md); border-left: 4px solid var(--success-color);">
                                <strong style="display: block; margin-bottom: 0.5rem; color: var(--success-color);">
                                    <i class="fas fa-check-circle"></i> Strengths
                                </strong>
                                <p style="color: #065F46; line-height: 1.6; font-size: 0.875rem;">
                                    ${evaluation.strengths}
                                </p>
                            </div>
                        ` : ''}
                        ${evaluation.areasForImprovement ? `
                            <div style="padding: 1rem; background: #FEF3C7; border-radius: var(--radius-md); border-left: 4px solid var(--warning-color);">
                                <strong style="display: block; margin-bottom: 0.5rem; color: var(--warning-color);">
                                    <i class="fas fa-exclamation-triangle"></i> Areas for Improvement
                                </strong>
                                <p style="color: #92400E; line-height: 1.6; font-size: 0.875rem;">
                                    ${evaluation.areasForImprovement}
                                </p>
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <div style="display: flex; justify-content: flex-end; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <button class="btn btn-outline btn-sm" onclick="viewEvaluationDetails('${evaluation.id}')">
                        <i class="fas fa-eye"></i>
                        View Full Details
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function displayPendingCompanies() {
    const container = document.getElementById('pendingCompaniesList');
    const section = document.getElementById('companiesToEvaluate');
    
    if (pendingCompanies.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    container.innerHTML = pendingCompanies.map(company => {
        const companyName = company.companyName || 'Company';
        const initials = companyName.substring(0, 2).toUpperCase();
        
        return `
            <div class="internship-card">
                <div class="internship-header">
                    <div class="company-logo" style="font-size: 1.5rem;">
                        ${initials}
                    </div>
                    <div class="internship-title">
                        <h3>${companyName}</h3>
                        <p class="company-name">
                            ${company.internshipTitle || 'Completed Internship'} • 
                            Completed ${formatDate(company.completionDate)}
                        </p>
                    </div>
                    <span class="status-badge submitted">Pending Review</span>
                </div>

                <p style="margin: 1rem 0; color: var(--text-secondary);">
                    You've completed your internship with this company. Share your experience to help other students!
                </p>

                <div style="display: flex; justify-content: flex-end; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <button class="btn btn-outline btn-sm" onclick="skipEvaluation('${company.internshipId}')">
                        Skip for Now
                    </button>
                    <a href="evaluate-company.html?id=${company.internshipId}" class="btn btn-primary btn-sm">
                        <i class="fas fa-star"></i>
                        Write Review
                    </a>
                </div>
            </div>
        `;
    }).join('');
}

function getRatingStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="fas fa-star empty"></i>';
        }
    }
    return stars;
}

function getPerformanceBadge(rating) {
    if (rating >= 4.5) {
        return '<span class="evaluation-badge excellent"><i class="fas fa-trophy"></i> Excellent</span>';
    } else if (rating >= 3.5) {
        return '<span class="evaluation-badge good"><i class="fas fa-thumbs-up"></i> Good</span>';
    } else if (rating >= 2.5) {
        return '<span class="evaluation-badge average"><i class="fas fa-minus-circle"></i> Average</span>';
    } else {
        return '<span class="evaluation-badge poor"><i class="fas fa-arrow-down"></i> Needs Improvement</span>';
    }
}

function viewEvaluationDetails(evaluationId) {
    const evaluation = allEvaluations.find(e => e.id === evaluationId);
    
    if (!evaluation) return;
    
    const isCompany = evaluation.evaluatorType === 'COMPANY';
    const rating = evaluation.overallRating || 0;
    
    document.getElementById('evaluationDetails').innerHTML = `
        <div style="text-align: center; padding: 2rem; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%); color: white; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⭐</div>
            <h2 style="color: white; margin-bottom: 0.5rem;">${rating.toFixed(1)} / 5.0</h2>
            <p style="opacity: 0.9;">${isCompany ? 'Company Evaluation' : 'Supervisor Evaluation'}</p>
        </div>

        <div style="display: grid; gap: 1.5rem;">
            <div>
                <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                    <i class="fas fa-info-circle"></i> Evaluation Details
                </h3>
                <div style="display: grid; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Evaluated By:</strong>
                        <span>${isCompany ? evaluation.company?.name || 'Company' : 'Academic Supervisor'}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
                        <strong>Date:</strong>
                        <span>${formatDate(evaluation.evaluationDate)}</span>
                    </div>
                    ${evaluation.internship ? `
                        <div style="display: flex; justify-content: space-between; padding: 0.5rem 0;">
                            <strong>Internship:</strong>
                            <span>${evaluation.internship.title}</span>
                        </div>
                    ` : ''}
                </div>
            </div>

            <div>
                <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                    <i class="fas fa-chart-bar"></i> Performance Ratings
                </h3>
                <div style="display: grid; gap: 1rem;">
                    ${evaluation.technicalSkills ? `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Technical Skills</span>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div class="rating-stars" style="font-size: 1rem;">
                                    ${getRatingStars(evaluation.technicalSkills)}
                                </div>
                                <strong>${evaluation.technicalSkills}/5</strong>
                            </div>
                        </div>
                    ` : ''}
                    ${evaluation.communication ? `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Communication</span>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div class="rating-stars" style="font-size: 1rem;">
                                    ${getRatingStars(evaluation.communication)}
                                </div>
                                <strong>${evaluation.communication}/5</strong>
                            </div>
                        </div>
                    ` : ''}
                    ${evaluation.teamwork ? `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Teamwork</span>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div class="rating-stars" style="font-size: 1rem;">
                                    ${getRatingStars(evaluation.teamwork)}
                                </div>
                                <strong>${evaluation.teamwork}/5</strong>
                            </div>
                        </div>
                    ` : ''}
                    ${evaluation.professionalism ? `
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span>Professionalism</span>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div class="rating-stars" style="font-size: 1rem;">
                                    ${getRatingStars(evaluation.professionalism)}
                                </div>
                                <strong>${evaluation.professionalism}/5</strong>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>

            ${evaluation.comments || evaluation.strengths || evaluation.areasForImprovement ? `
                <div>
                    <h3 style="margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--primary-color);">
                        <i class="fas fa-comments"></i> Detailed Feedback
                    </h3>
                    ${evaluation.comments ? `
                        <div style="margin-bottom: 1rem;">
                            <strong style="display: block; margin-bottom: 0.5rem;">General Comments:</strong>
                            <p style="line-height: 1.8; color: var(--text-secondary); white-space: pre-wrap;">
                                ${evaluation.comments}
                            </p>
                        </div>
                    ` : ''}
                    ${evaluation.strengths ? `
                        <div style="margin-bottom: 1rem;">
                            <strong style="display: block; margin-bottom: 0.5rem; color: var(--success-color);">Strengths:</strong>
                            <p style="line-height: 1.8; color: var(--text-secondary);">
                                ${evaluation.strengths}
                            </p>
                        </div>
                    ` : ''}
                    ${evaluation.areasForImprovement ? `
                        <div>
                            <strong style="display: block; margin-bottom: 0.5rem; color: var(--warning-color);">Areas for Improvement:</strong>
                            <p style="line-height: 1.8; color: var(--text-secondary);">
                                ${evaluation.areasForImprovement}
                            </p>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        </div>
    `;
    
    document.getElementById('evaluationModal').classList.add('active');
}

function closeEvaluationModal() {
    document.getElementById('evaluationModal').classList.remove('active');
}

async function skipEvaluation(internshipId) {
    if (!confirm('Are you sure you want to skip this evaluation? You can come back and evaluate later.')) {
        return;
    }
    
    pendingCompanies = pendingCompanies.filter(c => c.internshipId !== internshipId);
    displayPendingCompanies();
    showAlert('Evaluation skipped. You can evaluate later from your completed internships.', 'info');
}