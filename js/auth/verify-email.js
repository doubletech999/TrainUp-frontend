// ===== TrainUp - Email Verification Handler =====

document.addEventListener('DOMContentLoaded', async () => {
    const statusContainer = document.getElementById('verificationStatus');
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
        statusContainer.innerHTML = buildStatusHTML({
            icon: 'fas fa-exclamation-triangle',
            iconColor: 'var(--danger-color)',
            title: 'Verification token missing',
            message: 'Please use the verification link sent to your email.'
        });
        return;
    }

    try {
        const response = await apiRequest(`${API_ENDPOINTS.AUTH.VERIFY_EMAIL}?token=${encodeURIComponent(token)}`, {
            method: 'GET'
        });

        if (response.success) {
            statusContainer.innerHTML = buildStatusHTML({
                icon: 'fas fa-check-circle',
                iconColor: 'var(--success-color)',
                title: 'Email Verified!',
                message: 'Your account is now active. You can login using your credentials.',
                showLoginButton: true
            });
        } else {
            throw new Error(response.message || 'Verification failed.');
        }
    } catch (error) {
        console.error('Email verification error:', error);
        statusContainer.innerHTML = buildStatusHTML({
            icon: 'fas fa-times-circle',
            iconColor: 'var(--danger-color)',
            title: 'Verification failed',
            message: error.message || 'Unable to verify your email. Please request a new verification link from the login page.',
            showRetryLink: true
        });
    }
});

function buildStatusHTML({ icon, iconColor, title, message, showLoginButton = false, showRetryLink = false }) {
    return `
        <div style="text-align: center; padding: 3rem 1rem;">
            <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(37, 99, 235, 0.08); margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
                <i class="${icon}" style="font-size: 2.5rem; color: ${iconColor};"></i>
            </div>
            <h2>${title}</h2>
            <p class="subtitle" style="line-height: 1.6;">${message}</p>
            ${showLoginButton ? `
                <a href="login.html" class="btn btn-primary" style="margin-top: 1rem;">
                    <i class="fas fa-sign-in-alt"></i>
                    Go to Login
                </a>
            ` : ''}
            ${showRetryLink ? `
                <div style="margin-top: 2rem;">
                    <a href="login.html" style="color: var(--primary-color); font-weight: 600;">
                        Request a new verification email
                    </a>
                </div>
            ` : ''}
        </div>
    `;
}

