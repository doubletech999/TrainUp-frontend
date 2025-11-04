// ===== TrainUp - Evaluate Company JavaScript =====

let currentInternship = null;
let ratings = {
    overall: 0,
    workEnvironment: 0,
    learningOpportunities: 0,
    mentorship: 0,
    workLifeBalance: 0
};

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
    
    document.getElementById('evaluationForm').addEventListener('submit', handleSubmit);
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
    const ratingContainers = document.querySelectorAll('.rating-input');
    
    ratingContainers.forEach(container => {
        const stars = container.querySelectorAll('i');
        const ratingType = container.id;
        const label = document.getElementById(`${ratingType}Label`);
        
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                const value = parseInt(star.dataset.value);
                setRating(container, value, label);
                ratings[ratingType] = value;
            });
            
            star.addEventListener('mouseenter', () => {
                const value = parseInt(star.dataset.value);
                highlightStars(container, value);
            });
        });
        
        container.addEventListener('mouseleave', () => {
            const currentRating = parseInt(container.dataset.rating);
            highlightStars(container, currentRating);
        });
    });
}

function setRating(container, value, label) {
    container.dataset.rating = value;
    highlightStars(container, value);
    
    const labels = {
        1: 'Poor',
        2: 'Fair',
        3: 'Good',
        4: 'Very Good',
        5: 'Excellent'
    };
    
    if (label) {
        label.textContent = labels[value] || 'Click to rate';
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

async function handleSubmit(event) {
    event.preventDefault();
    
    clearAllErrors();
    hideAlert();
    
    // Validate ratings
    let isValid = true;
    
    if (ratings.overall === 0 || ratings.overallRating === 0) {
        showFieldError('overallRating', 'Please rate your overall experience');
        isValid = false;
    }
    
    if (ratings.workEnvironment === 0) {
        ratings.workEnvironment = ratings.overall; // Default to overall if not set
    }
    
    if (ratings.learningOpportunities === 0) {
        ratings.learningOpportunities = ratings.overall;
    }
    
    if (ratings.mentorship === 0) {
        ratings.mentorship = ratings.overall;
    }
    
    if (ratings.workLifeBalance === 0) {
        ratings.workLifeBalance = ratings.overall;
    }
    
    // Get form data
    const review = document.getElementById('review').value.trim();
    const pros = document.getElementById('pros').value.trim();
    const cons = document.getElementById('cons').value.trim();
    const advice = document.getElementById('advice').value.trim();
    const recommend = document.querySelector('input[name="recommend"]:checked');
    const anonymous = document.getElementById('anonymous').checked;
    
    // Validate review
    if (!review) {
        showFieldError('review', 'Please write a review');
        isValid = false;
    } else if (review.length < 100) {
        showFieldError('review', 'Review must be at least 100 characters');
        isValid = false;
    }
    
    if (!recommend) {
        showFieldError('recommend', 'Please select if you recommend this company');
        isValid = false;
    }
    
    if (!isValid) {
        showAlert('Please fix the errors in the form', 'error');
        return;
    }
    
    // Prepare evaluation data
    const evaluationData = {
        internshipId: currentInternship.id,
        companyId: currentInternship.company?.id,
        overallRating: ratings.overall || ratings.overallRating,
        workEnvironmentRating: ratings.workEnvironment,
        learningOpportunitiesRating: ratings.learningOpportunities,
        mentorshipRating: ratings.mentorship,
        workLifeBalanceRating: ratings.workLifeBalance,
        review: review,
        pros: pros || null,
        cons: cons || null,
        advice: advice || null,
        wouldRecommend: recommend.value === 'true',
        isAnonymous: anonymous
    };
    
    // Show loading
    setButtonLoading('submitBtn', true, 'Submit Evaluation');
    
    try {
        const response = await apiRequest('/evaluations/company', {
            method: 'POST',
            body: JSON.stringify(evaluationData)
        });
        
        if (response.success) {
            showAlert('Thank you! Your evaluation has been submitted successfully. 🎉', 'success');
            
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
        setButtonLoading('submitBtn', false, 'Submit Evaluation');
    }
}