// ===== TrainUp - Company Evaluate Intern JavaScript =====

let currentApplication = null;
let currentStudent = null;
let currentInternship = null;
let selectedMonth = null;
let monthlyEvaluations = [];
let ratings = {
    overall: 0,
    technical: 0,
    communication: 0,
    professionalism: 0,
    workEthic: 0,
    teamwork: 0,
    problemSolving: 0
};

document.addEventListener('DOMContentLoaded', async () => {
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

    loadCompanyInfo(userData);

    // Get application ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const applicationId = urlParams.get('id');

    if (!applicationId) {
        showAlert('Invalid application ID', 'error');
        setTimeout(() => window.location.href = 'applications.html', 2000);
        return;
    }

    await loadApplicationDetails(applicationId);
    initializeRatingInputs();

    const form = document.getElementById('evaluationFormElement');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

function loadCompanyInfo(userData) {
    const profile = userData.profile || {};
    const companyProfile = profile.companyProfile || {};
    
    if (companyProfile.companyName) {
        const initials = companyProfile.companyName.substring(0, 2).toUpperCase();
        const companyNameEl = document.getElementById('companyName');
        const userEmailEl = document.getElementById('userEmail');
        const userAvatarEl = document.getElementById('userAvatar');
        
        if (companyNameEl) companyNameEl.textContent = companyProfile.companyName;
        if (userEmailEl) userEmailEl.textContent = userData.email;
        if (userAvatarEl) userAvatarEl.textContent = initials;
    }
}

async function loadApplicationDetails(applicationId) {
    try {
        // Get company applications to find the specific one
        const response = await apiRequest('/applications/company-applications', {
            method: 'GET'
        });

        if (response.success) {
            const applications = response.data || [];
            currentApplication = applications.find(app => app.id === applicationId);

            if (!currentApplication) {
                throw new Error('Application not found');
            }

            currentStudent = currentApplication.student;
            currentInternship = currentApplication.internship;

            if (!currentStudent || !currentInternship) {
                throw new Error('Application data incomplete');
            }

            displayInternInfo();
            await loadMonthlyEvaluations();
            displayMonths();

            const loadingState = document.getElementById('loadingState');
            const evaluationForm = document.getElementById('evaluationForm');
            
            if (loadingState) loadingState.style.display = 'none';
            if (evaluationForm) evaluationForm.style.display = 'block';
        } else {
            throw new Error('Failed to load application details');
        }

    } catch (error) {
        console.error('Error loading application:', error);
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <h3>Error Loading Details</h3>
                    <p>${error.message}</p>
                    <a href="applications.html" class="btn btn-primary">
                        Back to Applications
                    </a>
                </div>
            `;
        }
    }
}

function displayInternInfo() {
    if (!currentStudent || !currentInternship) return;

    const studentName = `${currentStudent.firstName || ''} ${currentStudent.lastName || ''}`.trim() || 'Student';
    const studentInitials = getInitials(currentStudent.firstName || 'S', currentStudent.lastName || 't');
    const internshipTitle = currentInternship.title || 'Internship';

    const internInfoEl = document.getElementById('internInfo');
    if (internInfoEl) {
        internInfoEl.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%); border-radius: var(--radius-lg); color: white;">
                <div style="width: 80px; height: 80px; background: white; color: var(--primary-color); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; flex-shrink: 0;">
                    ${studentInitials}
                </div>
                <div style="flex: 1;">
                    <h2 style="color: white; margin-bottom: 0.5rem;">${studentName}</h2>
                    <p style="opacity: 0.9; margin-bottom: 0.5rem;">${internshipTitle}</p>
                    <p style="opacity: 0.8; font-size: 0.875rem;">
                        ${currentStudent.university ? `<i class="fas fa-university"></i> ${currentStudent.university} • ` : ''}
                        ${currentStudent.major ? `<i class="fas fa-graduation-cap"></i> ${currentStudent.major}` : ''}
                    </p>
                </div>
            </div>
        `;
    }
}

function initializeRatingInputs() {
    // Overall rating
    const overallStars = document.querySelectorAll('[data-rating="overall"]');
    overallStars.forEach(star => {
        star.addEventListener('click', () => {
            const value = parseInt(star.dataset.value);
            setOverallRating(value);
        });

        star.addEventListener('mouseenter', () => {
            const value = parseInt(star.dataset.value);
            highlightOverallStars(value);
        });
    });

    const summaryEl = document.querySelector('.evaluation-summary');
    if (summaryEl) {
        summaryEl.addEventListener('mouseleave', () => {
            highlightOverallStars(ratings.overall);
        });
    }

    // Detailed ratings
    document.querySelectorAll('.rating-stars[data-rating]').forEach(container => {
        const ratingType = container.dataset.rating;
        const stars = container.querySelectorAll('i');

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                setRating(ratingType, value);
            });

            star.addEventListener('mouseenter', () => {
                const value = parseInt(star.dataset.value);
                highlightStars(container, value);
            });
        });

        container.addEventListener('mouseleave', () => {
            highlightStars(container, ratings[ratingType] || 0);
        });
    });
}

function setOverallRating(value) {
    ratings.overall = value;
    highlightOverallStars(value);
    const displayEl = document.getElementById('overallRatingDisplay');
    if (displayEl) {
        displayEl.textContent = value + '.0 ⭐';
    }
}

function highlightOverallStars(count) {
    const stars = document.querySelectorAll('[data-rating="overall"]');
    stars.forEach((star, index) => {
        if (index < count) {
            star.classList.remove('far');
            star.classList.add('fas');
        } else {
            star.classList.remove('fas');
            star.classList.add('far');
        }
    });
}

function setRating(ratingType, value) {
    ratings[ratingType] = value;
    const container = document.querySelector(`[data-rating="${ratingType}"]`);
    if (container) {
        highlightStars(container, value);
    }
    const valueEl = document.getElementById(`${ratingType}Value`);
    if (valueEl) {
        valueEl.textContent = value + '.0';
    }
}

function highlightStars(container, count) {
    const stars = container.querySelectorAll('i');
    stars.forEach((star, index) => {
        if (index < count) {
            star.classList.remove('far');
            star.classList.add('fas', 'active');
        } else {
            star.classList.remove('fas', 'active');
            star.classList.add('far');
        }
    });
}

function setRecommendation(value) {
    const recommendEl = document.getElementById('wouldRecommend');
    if (recommendEl) {
        recommendEl.value = value;
    }

    // Update UI
    document.querySelectorAll('.recommendation-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const clickedBtn = document.querySelector(`.recommendation-btn[onclick*="${value}"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }

    const errorEl = document.getElementById('wouldRecommendError');
    if (errorEl) {
        errorEl.textContent = '';
    }
}

// Make setRecommendation available globally
window.setRecommendation = setRecommendation;

/**
 * Load monthly evaluations for this application
 */
async function loadMonthlyEvaluations() {
    try {
        const response = await getMonthlyEvaluationsByApplication(currentApplication.id);
        if (response.success) {
            monthlyEvaluations = response.data || [];
        }
    } catch (error) {
        console.error('Error loading monthly evaluations:', error);
        monthlyEvaluations = [];
    }
}

/**
 * Display months for evaluation
 */
function displayMonths() {
    if (!currentInternship || !currentInternship.duration) return;
    
    const monthsContainer = document.getElementById('monthsContainer');
    if (!monthsContainer) return;
    
    const duration = currentInternship.duration;
    const startDate = currentInternship.startDate ? new Date(currentInternship.startDate) : new Date();
    const today = new Date();
    
    let monthsHTML = '';
    
    for (let monthNum = 1; monthNum <= duration; monthNum++) {
        // Calculate the month's evaluation date (last 4 days of the month)
        const monthStart = new Date(startDate);
        monthStart.setMonth(startDate.getMonth() + (monthNum - 1));
        monthStart.setDate(1);
        
        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthStart.getMonth() + 1);
        monthEnd.setDate(0); // Last day of the month
        
        const evaluationStartDate = new Date(monthEnd);
        evaluationStartDate.setDate(monthEnd.getDate() - 3); // Last 4 days
        
        // Check if evaluation already exists
        const existingEvaluation = monthlyEvaluations.find(eval => eval.monthNumber === monthNum);
        
        // Check if evaluation period has started
        const isEvaluationPeriod = today >= evaluationStartDate && today <= monthEnd;
        const isPastMonth = today > monthEnd;
        const isFutureMonth = today < monthStart;
        
        // Calculate time remaining
        let timeRemaining = '';
        let status = '';
        let isDisabled = false;
        
        if (existingEvaluation) {
            status = 'completed';
            timeRemaining = 'Completed';
        } else if (isEvaluationPeriod) {
            status = 'available';
            const daysRemaining = Math.ceil((monthEnd - today) / (1000 * 60 * 60 * 24)) + 1;
            timeRemaining = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
        } else if (isPastMonth) {
            status = 'pending';
            timeRemaining = 'Evaluation period passed';
            isDisabled = true;
        } else {
            status = 'pending';
            const daysUntilStart = Math.ceil((evaluationStartDate - today) / (1000 * 60 * 60 * 24));
            if (daysUntilStart > 0) {
                timeRemaining = `${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''} until evaluation`;
            } else {
                timeRemaining = 'Evaluation starts soon';
            }
            isDisabled = true;
        }
        
        monthsHTML += `
            <div class="month-card ${isDisabled ? 'disabled' : ''} ${selectedMonth === monthNum ? 'active' : ''}" 
                 onclick="${!isDisabled ? `selectMonth(${monthNum})` : ''}">
                <div class="month-number">Month ${monthNum}</div>
                <div class="month-label">${getMonthName(monthStart)}</div>
                <div class="month-status ${status}">
                    ${status === 'completed' ? '<i class="fas fa-check-circle"></i> ' : ''}
                    ${status === 'available' ? '<i class="fas fa-clock"></i> ' : ''}
                    ${status === 'pending' ? '<i class="fas fa-hourglass-half"></i> ' : ''}
                    ${timeRemaining}
                </div>
                ${!isDisabled && !existingEvaluation ? `
                    <button class="evaluate-btn active" onclick="event.stopPropagation(); startEvaluation(${monthNum})">
                        <i class="fas fa-edit"></i> Evaluate
                    </button>
                ` : existingEvaluation ? `
                    <button class="evaluate-btn disabled" disabled>
                        <i class="fas fa-check"></i> Already Evaluated
                    </button>
                ` : `
                    <button class="evaluate-btn disabled" disabled>
                        <i class="fas fa-lock"></i> Not Available
                    </button>
                `}
            </div>
        `;
    }
    
    monthsContainer.innerHTML = monthsHTML;
}

/**
 * Get month name
 */
function getMonthName(date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return months[date.getMonth()];
}

/**
 * Select month
 */
function selectMonth(monthNum) {
    selectedMonth = monthNum;
    displayMonths();
}

/**
 * Start evaluation for selected month
 */
function startEvaluation(monthNum) {
    selectedMonth = monthNum;
    
    // Hide months selection, show evaluation form
    const monthlySection = document.getElementById('monthlySelectionSection');
    const evaluationForm = document.getElementById('evaluationFormElement');
    const backBtn = document.getElementById('backToMonthsBtn');
    const submitBtnLabel = document.getElementById('submitBtnLabel');
    const attendanceSection = document.getElementById('attendanceSection');
    
    if (monthlySection) monthlySection.style.display = 'none';
    if (evaluationForm) {
        evaluationForm.style.display = 'block';
        // Scroll to top of form
        evaluationForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    if (backBtn) backBtn.style.display = 'inline-flex';
    if (submitBtnLabel) submitBtnLabel.textContent = `Submit Month ${monthNum} Evaluation`;
    if (attendanceSection) attendanceSection.style.display = 'block';
    
    // Hide recommendation section for monthly evaluations
    const recommendationSection = document.getElementById('recommendationSection');
    const futureOpportunitiesSection = document.getElementById('futureOpportunitiesSection');
    if (recommendationSection) recommendationSection.style.display = 'none';
    if (futureOpportunitiesSection) futureOpportunitiesSection.style.display = 'none';
    
    // Update form title to show selected month
    const pageTitle = document.querySelector('.page-header h1 span');
    if (pageTitle) {
        pageTitle.textContent = `Evaluate Intern - Month ${monthNum}`;
    }
}

/**
 * Go back to month selection
 */
function backToMonthSelection() {
    selectedMonth = null;
    
    const monthlySection = document.getElementById('monthlySelectionSection');
    const evaluationForm = document.getElementById('evaluationFormElement');
    const backBtn = document.getElementById('backToMonthsBtn');
    const submitBtnLabel = document.getElementById('submitBtnLabel');
    const attendanceSection = document.getElementById('attendanceSection');
    
    if (monthlySection) monthlySection.style.display = 'block';
    if (evaluationForm) evaluationForm.style.display = 'none';
    if (backBtn) backBtn.style.display = 'none';
    if (submitBtnLabel) submitBtnLabel.textContent = 'Submit Evaluation';
    if (attendanceSection) attendanceSection.style.display = 'none';
    
    // Show recommendation section again
    const recommendationSection = document.getElementById('recommendationSection');
    const futureOpportunitiesSection = document.getElementById('futureOpportunitiesSection');
    if (recommendationSection) recommendationSection.style.display = 'block';
    if (futureOpportunitiesSection) futureOpportunitiesSection.style.display = 'block';
    
    // Reset form
    const form = document.getElementById('evaluationFormElement');
    if (form) form.reset();
    
    ratings = {
        overall: 0,
        technical: 0,
        communication: 0,
        professionalism: 0,
        workEthic: 0,
        teamwork: 0,
        problemSolving: 0
    };
    
    // Reset rating displays
    const overallDisplay = document.getElementById('overallRatingDisplay');
    if (overallDisplay) overallDisplay.textContent = '-';
    
    document.querySelectorAll('.rating-value').forEach(el => el.textContent = '-');
    document.querySelectorAll('.rating-stars i').forEach(star => {
        star.classList.remove('fas', 'active');
        star.classList.add('far');
    });
    
    // Reset recommendation buttons
    document.querySelectorAll('.recommendation-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Update page title
    const pageTitle = document.querySelector('.page-header h1 span');
    if (pageTitle) {
        pageTitle.textContent = 'Evaluate Intern';
    }
}

// Make functions available globally
window.selectMonth = selectMonth;
window.startEvaluation = startEvaluation;
window.backToMonthSelection = backToMonthSelection;

async function handleSubmit(event) {
    event.preventDefault();

    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

    // Validate ratings
    let isValid = true;

    if (ratings.overall === 0) {
        showAlert('Please rate overall performance', 'error');
        isValid = false;
    }

    // Validate required fields
    const overallComments = document.getElementById('overallComments');
    if (!overallComments || !overallComments.value.trim()) {
        const errorEl = document.getElementById('overallCommentsError');
        if (errorEl) errorEl.textContent = 'Overall comments are required';
        isValid = false;
    }
    
    // Validate attendance fields for monthly evaluations
    if (selectedMonth) {
        const attendanceDays = document.getElementById('attendanceDays');
        const totalWorkingDays = document.getElementById('totalWorkingDays');
        
        if (!attendanceDays || !attendanceDays.value || parseInt(attendanceDays.value) < 0) {
            const errorEl = document.getElementById('attendanceDaysError');
            if (errorEl) errorEl.textContent = 'Attendance days is required';
            isValid = false;
        }
        
        if (!totalWorkingDays || !totalWorkingDays.value || parseInt(totalWorkingDays.value) < 1) {
            const errorEl = document.getElementById('totalWorkingDaysError');
            if (errorEl) errorEl.textContent = 'Total working days is required';
            isValid = false;
        }
        
        if (attendanceDays && totalWorkingDays && 
            parseInt(attendanceDays.value) > parseInt(totalWorkingDays.value)) {
            const errorEl = document.getElementById('attendanceDaysError');
            if (errorEl) errorEl.textContent = 'Attendance days cannot exceed total working days';
            isValid = false;
        }
    }

    // Only validate recommendation for final evaluation (not monthly)
    if (!selectedMonth) {
        const wouldRecommend = document.getElementById('wouldRecommend');
        if (!wouldRecommend || wouldRecommend.value === '') {
            const errorEl = document.getElementById('wouldRecommendError');
            if (errorEl) errorEl.textContent = 'Please select your recommendation';
            isValid = false;
        }
    }

    if (!isValid) {
        showAlert('Please complete all required fields', 'error');
        return;
    }

    // Check if this is a monthly evaluation
    if (selectedMonth) {
        // Calculate evaluation month (first day of the selected month)
        const startDate = currentInternship.startDate ? new Date(currentInternship.startDate) : new Date();
        const evaluationMonthDate = new Date(startDate);
        evaluationMonthDate.setMonth(startDate.getMonth() + (selectedMonth - 1));
        evaluationMonthDate.setDate(1);
        
        // Format as YYYY-MM-DD
        const evaluationMonth = evaluationMonthDate.toISOString().split('T')[0];
        
        // Prepare monthly evaluation data
        const evaluationData = {
            applicationId: currentApplication.id,
            evaluationMonth: evaluationMonth,
            overallRating: ratings.overall,
            technicalSkills: ratings.technical || 0,
            softSkills: ratings.teamwork || 0,
            professionalism: ratings.professionalism || 0,
            workEthic: ratings.workEthic || 0,
            communication: ratings.communication || 0,
            strengths: document.getElementById('strengths')?.value.trim() || null,
            areasForImprovement: document.getElementById('areasForImprovement')?.value.trim() || null,
            comments: overallComments?.value.trim() || null,
            monthlySummary: overallComments?.value.trim() || null,
            attendanceDays: parseInt(document.getElementById('attendanceDays')?.value || '0'),
            totalWorkingDays: parseInt(document.getElementById('totalWorkingDays')?.value || '20'),
            tasksCompleted: document.getElementById('keyAchievements')?.value.trim() || null,
            projectsInvolved: document.getElementById('projectsCompleted')?.value.trim() || null
        };
        
        // Submit monthly evaluation
        try {
            const response = await apiRequest('/monthly-evaluations', {
                method: 'POST',
                body: JSON.stringify(evaluationData)
            });
            
            if (response.success) {
                showAlert(`Monthly evaluation for Month ${selectedMonth} submitted successfully!`, 'success');
                await loadMonthlyEvaluations();
                backToMonthSelection();
                displayMonths();
            } else {
                showAlert(response.message || 'Failed to submit monthly evaluation', 'error');
            }
        } catch (error) {
            console.error('Error submitting monthly evaluation:', error);
            showAlert(error.message || 'Failed to submit monthly evaluation. Please try again.', 'error');
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (submitBtnText) submitBtnText.style.display = 'inline';
            if (submitBtnLoader) submitBtnLoader.style.display = 'none';
        }
        return;
    }
    
    // Prepare regular evaluation data according to CreateEvaluationRequest
    const evaluationData = {
        applicationId: currentApplication.id,
        overallRating: ratings.overall,
        technicalSkills: ratings.technical || null,
        softSkills: ratings.teamwork || null, // Using teamwork as soft skills
        professionalism: ratings.professionalism || null,
        workEthic: ratings.workEthic || null,
        communication: ratings.communication || null,
        strengths: document.getElementById('strengths')?.value.trim() || null,
        areasForImprovement: document.getElementById('areasForImprovement')?.value.trim() || null,
        comments: overallComments?.value.trim() || null,
        wouldRecommend: wouldRecommend.value === 'true'
    };

    // Show loading
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitBtnLoader = document.getElementById('submitBtnLoader');

    if (submitBtn) submitBtn.disabled = true;
    if (submitBtnText) submitBtnText.style.display = 'none';
    if (submitBtnLoader) submitBtnLoader.style.display = 'inline-block';

    try {
        const response = await apiRequest('/evaluations/company', {
            method: 'POST',
            body: JSON.stringify(evaluationData)
        });

        if (response.success) {
            showAlert('Thank you! Your evaluation has been submitted successfully', 'success');

            setTimeout(() => {
                window.location.href = 'applications.html';
            }, 2000);
        } else {
            showAlert(response.message || 'Failed to submit evaluation', 'error');
        }

    } catch (error) {
        console.error('Error submitting evaluation:', error);
        showAlert(error.message || 'Failed to submit evaluation. Please try again.', 'error');

    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitBtnText) submitBtnText.style.display = 'inline';
        if (submitBtnLoader) submitBtnLoader.style.display = 'none';
    }
}

