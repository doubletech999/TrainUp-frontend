// ===== TrainUp - Reset Password =====

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('resetPasswordForm');
    const alertBox = document.getElementById('alertMessage');
    const successState = document.getElementById('resetSuccessState');
    const wrapper = document.getElementById('resetWrapper');

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
        showAlertMessage('Reset token is missing. Please use the link from your email.', 'error');
        form.style.display = 'none';
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        clearErrors();

        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword.length < 6) {
            showFieldError('newPassword', 'Password must be at least 6 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            showFieldError('confirmPassword', 'Passwords do not match.');
            return;
        }

        toggleLoading(true);

        try {
            const response = await apiRequest(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
                method: 'POST',
                body: JSON.stringify({
                    token,
                    newPassword
                })
            });

            if (response.success) {
                form.style.display = 'none';
                alertBox.style.display = 'none';
                successState.style.display = 'block';
            } else {
                showAlertMessage(response.message || 'Failed to reset password. Please try again.', 'error');
            }
        } catch (error) {
            console.error('Reset password error:', error);
            showAlertMessage(error.message || 'An error occurred. Please try again.', 'error');
        } finally {
            toggleLoading(false);
        }
    });

    function toggleLoading(isLoading) {
        const submitBtn = document.getElementById('resetSubmitBtn');
        const submitText = document.getElementById('resetSubmitText');
        const submitLoader = document.getElementById('resetSubmitLoader');

        submitBtn.disabled = isLoading;
        submitText.style.display = isLoading ? 'none' : 'inline-flex';
        submitLoader.style.display = isLoading ? 'inline-block' : 'none';
    }

    function showFieldError(fieldId, message) {
        const errorElement = document.getElementById(`${fieldId}Error`);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        alertBox.style.display = 'none';
    }

    function showAlertMessage(message, type = 'error') {
        alertBox.className = `alert alert-${type}`;
        alertBox.textContent = message;
        alertBox.style.display = 'block';
    }
});

