// ===== TrainUp - Evaluate Company JavaScript =====

let currentInternship = null;
let ratings = {
    overall: 0,
    workEnvironment: 0,
    mentorship: 0,
    learningOpportunities: 0,
    companyCulture: 0,
    organization: 0,
    careerGrowth: 0
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn()) {
        window.location.href = '../../pages/auth/login.html';
        return;
    }

    const userData = getUserData();

    if (userData.userType !== 'STUDENT') {
        showAlert('Access denied. Students only.', 'error');
        setTimeout(() => logout(), 2000);
        return;
    }

    loadUserInfo(userData);

    // Get internship ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const internshipId = urlParams.get('id');

    if (!internshipId) {
        showAlert('Invalid internship ID', 'error');
        setTimeout(() => window.location.href = 'evaluations.html', 2000);
        return;
    }

    await loadInternshipDetails(internshipId);
    initializeRatingInputs();

    document.getElementById('evaluationFormElement').addEventListener('submit', handleSubmit);
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

async function loadInternshipDetails(internshipId) {
    try {
        const response = await apiRequest(`/internships/${internshipId}`, {
            method: 'GET'
        });

        if (response.success) {
            currentInternship = response.data;
            displayCompanyInfo();

            document.getElementById('loadingState').style.display = 'none';
            document.getElementById('evaluationForm').style.display = 'block';
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
                <a href="evaluations.html" class="btn btn-primary">
                    Back to Evaluations
                </a>
            </div>
        `;
    }
}

function displayCompanyInfo() {
    const company = currentInternship.company || {};
    const companyName = company.name || 'Company';
    const companyInitials = companyName.substring(0, 2).toUpperCase();

    document.getElementById('companyInfo').innerHTML = `
        <div style="display: flex; align-items: center; gap: 1.5rem; padding: 1.5rem; background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%); border-radius: var(--radius-lg); color: white;">
            <div style="width: 80px; height: 80px; background: white; color: var(--primary-color); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 700; flex-shrink: 0;">
                ${companyInitials}
            </div>
            <div style="flex: 1;">
                <h2 style="color: white; margin-bottom: 0.5rem;">${companyName}</h2>
                <p style="opacity: 0.9; margin-bottom: 0.5rem;">${currentInternship.title}</p>
                <p style="opacity: 0.8; font-size: 0.875rem;">
                    <i class="fas fa-map-marker-alt"></i> ${currentInternship.location} •
                    <i class="fas fa-clock"></i> ${currentInternship.duration} months
                </p>
            </div>
        </div>
    `;
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

    document.querySelector('.evaluation-summary').addEventListener('mouseleave', () => {
        highlightOverallStars(ratings.overall);
    });

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
            highlightStars(container, ratings[ratingType]);
        });
    });
}

function setOverallRating(value) {
    ratings.overall = value;
    highlightOverallStars(value);
    document.getElementById('overallRatingDisplay').textContent = value + '.0 ⭐';
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
    highlightStars(document.querySelector(`[data-rating="${ratingType}"]`), value);
    document.getElementById(`${ratingType}Value`).textContent = value + '.0';
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
    document.getElementById('wouldRecommend').value = value;

    // Update UI
    document.querySelectorAll('.recommendation-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active class to clicked button
    const clickedBtn = document.querySelector(`.recommendation-btn[onclick="setRecommendation(${value})"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }

    // Clear error
    document.getElementById('wouldRecommendError').textContent = '';
}

async function handleSubmit(event) {
    event.preventDefault();

    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.textContent = '');

    // Validate ratings
    let isValid = true;

    if (ratings.overall === 0) {
        showAlert('Please rate your overall experience', 'error');
        isValid = false;
    }

    // Validate required fields
    const overallComments = document.getElementById('overallComments').value.trim();
    if (!overallComments) {
        document.getElementById('overallCommentsError').textContent = 'Overall comments are required';
        isValid = false;
    }

    const wouldRecommend = document.getElementById('wouldRecommend').value;
    if (wouldRecommend === '') {
        document.getElementById('wouldRecommendError').textContent = 'Please select your recommendation';
        isValid = false;
    }

    if (!isValid) {
        showAlert('Please complete all required fields', 'error');
        return;
    }

    // Prepare evaluation data
    const evaluationData = {
        internshipId: currentInternship.id,
        companyId: currentInternship.company?.id,

        // Ratings
        overallRating: ratings.overall,
        workEnvironment: ratings.workEnvironment || 0,
        mentorship: ratings.mentorship || 0,
        learningOpportunities: ratings.learningOpportunities || 0,
        companyCulture: ratings.companyCulture || 0,
        organization: ratings.organization || 0,
        careerGrowth: ratings.careerGrowth || 0,

        // Feedback
        positiveAspects: document.getElementById('positiveAspects').value.trim() || null,
        areasForImprovement: document.getElementById('areasForImprovement').value.trim() || null,
        overallComments: overallComments,

        // Experience
        keyLearnings: document.getElementById('keyLearnings').value.trim() || null,
        projectsWorkedOn: document.getElementById('projectsWorkedOn').value.trim() || null,

        // Recommendation
        wouldRecommend: wouldRecommend === 'true',
        recommendationReason: document.getElementById('recommendationReason').value.trim() || null,

        // Future opportunities
        interestedInFullTime: document.getElementById('interestedInFullTime').checked
    };

    // Show loading
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitBtnLoader = document.getElementById('submitBtnLoader');

    submitBtn.disabled = true;
    submitBtnText.style.display = 'none';
    submitBtnLoader.style.display = 'inline-block';

    try {
        const response = await apiRequest('/evaluations/company', {
            method: 'POST',
            body: JSON.stringify(evaluationData)
        });

        if (response.success) {
            showAlert('Thank you! Your evaluation has been submitted successfully', 'success');

            setTimeout(() => {
                window.location.href = 'evaluations.html';
            }, 2000);
        } else {
            showAlert(response.message || 'Failed to submit evaluation', 'error');
        }

    } catch (error) {
        console.error('Error submitting evaluation:', error);
        showAlert(error.message || 'Failed to submit evaluation. Please try again.', 'error');

    } finally {
        submitBtn.disabled = false;
        submitBtnText.style.display = 'inline';
        submitBtnLoader.style.display = 'none';
    }
}

