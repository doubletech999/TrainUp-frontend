// ===== TrainUp - Admin Reports JavaScript =====

let charts = {};

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn() || getUserData().userType !== 'ADMIN') {
        window.location.href = '../../login.html';
        return;
    }

    loadAdminInfo(getUserData());
    await loadReportsData();
    initializeCharts();
});

function loadAdminInfo(userData) {
    const profile = userData.profile || {};
    const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Administrator';
    const initials = (profile.firstName?.[0] || 'A') + (profile.lastName?.[0] || 'D');
    document.getElementById('userName').textContent = fullName;
    document.getElementById('userEmail').textContent = userData.email;
    document.getElementById('userAvatar').textContent = initials.toUpperCase();
}

async function loadReportsData() {
    try {
        const response = await apiRequest('/admin/reports/summary', { method: 'GET' });
        if (response.success && response.data) {
            updateMetrics(response.data);
            updateTopCompanies(response.data.topCompanies || []);
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        showAlert('Failed to load reports data', 'error');
    }
}

function updateMetrics(data) {
    document.getElementById('metricUsers').textContent = data.activeUsers || 0;
    document.getElementById('metricInternships').textContent = data.activeInternships || 0;
    document.getElementById('metricApplications').textContent = data.totalApplications || 0;
    document.getElementById('metricPlacements').textContent = data.successfulPlacements || 0;

    document.getElementById('usersGrowth').textContent = `↑ ${data.usersGrowth || 0}%`;
    document.getElementById('internshipsGrowth').textContent = `↑ ${data.internshipsGrowth || 0}%`;
    document.getElementById('applicationsGrowth').textContent = `↑ ${data.applicationsGrowth || 0}%`;
    document.getElementById('placementsRate').textContent = `${data.placementRate || 0}%`;
}

function initializeCharts() {
    // Users Growth Chart
    charts.users = new Chart(document.getElementById('usersChart'), {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'New Users',
                data: [12, 19, 15, 25],
                borderColor: '#4f46e5',
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Applications Status Chart
    charts.applications = new Chart(document.getElementById('applicationsChart'), {
        type: 'doughnut',
        data: {
            labels: ['Pending', 'Accepted', 'Rejected'],
            datasets: [{
                data: [30, 50, 20],
                backgroundColor: ['#f59e0b', '#10b981', '#ef4444']
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Categories Chart
    charts.categories = new Chart(document.getElementById('categoriesChart'), {
        type: 'bar',
        data: {
            labels: ['Software', 'Design', 'Marketing', 'Engineering'],
            datasets: [{
                label: 'Internships',
                data: [45, 30, 25, 20],
                backgroundColor: '#4f46e5'
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    // Trends Chart
    charts.trends = new Chart(document.getElementById('trendsChart'), {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Applications',
                data: [65, 78, 90, 81, 95, 105],
                borderColor: '#10b981',
                fill: true,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function updateTopCompanies(companies) {
    const container = document.getElementById('topCompanies');
    if (companies.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-building"></i><p>No data available</p></div>';
        return;
    }

    container.innerHTML = companies.map((company, index) => `
        <div style="padding: 1rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 1rem;">
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); width: 40px;">#${index + 1}</div>
            <div style="flex: 1;">
                <strong>${company.name}</strong>
                <div style="font-size: 0.9rem; color: var(--text-secondary);">${company.internships || 0} internships posted</div>
            </div>
            <div style="text-align: right;">
                <div style="font-size: 1.25rem; font-weight: 700;">${company.applications || 0}</div>
                <div style="font-size: 0.85rem; color: var(--text-secondary);">applications</div>
            </div>
        </div>
    `).join('');
}

async function updateReports() {
    showAlert('Updating reports...', 'info');
    await loadReportsData();
    showAlert('Reports updated successfully!', 'success');
}

function exportReport() {
    showAlert('Export functionality coming soon!', 'info');
}
