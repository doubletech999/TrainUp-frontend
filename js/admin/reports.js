// ===== TrainUp - Admin Reports JavaScript =====

let charts = {};
let reportsSummary = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!isLoggedIn() || getUserData().userType !== 'ADMIN') {
        window.location.href = '../../pages/auth/login.html';
        return;
    }

    loadAdminInfo(getUserData());
    await loadReportsData();
    initializeCharts();
    if (reportsSummary) {
        updateCharts(reportsSummary);
    }
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
            reportsSummary = response.data;
            updateMetrics(reportsSummary);
            updateTopCompanies(reportsSummary.topCompanies || []);
            if (Object.keys(charts).length > 0) {
                updateCharts(reportsSummary);
            }
            return reportsSummary;
        } else {
            throw new Error(response.message || 'Failed to load reports data');
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        showAlert(error.message || 'Failed to load reports data', 'error');
        resetReportsUI();
        throw error;
    }
}

function resetReportsUI() {
    reportsSummary = null;
    updateMetrics({});
    updateTopCompanies([]);
    updateCharts({});
}

function updateCharts(data) {
    const usersLabels = data.usersGrowthLabels?.length ? data.usersGrowthLabels : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const usersData = data.usersGrowthData?.length ? data.usersGrowthData : [0, 0, 0, 0];
    if (charts.users && charts.users.data && charts.users.data.datasets) {
        charts.users.data.labels = usersLabels;
        charts.users.data.datasets[0].data = usersData;
        charts.users.update();
    }

    const statusLabels = data.applicationStatusLabels?.length ? data.applicationStatusLabels : ['Pending', 'Accepted', 'Rejected'];
    const statusData = data.applicationStatusData?.length ? data.applicationStatusData : [0, 0, 0];
    if (charts.applications && charts.applications.data && charts.applications.data.datasets) {
        charts.applications.data.labels = statusLabels;
        charts.applications.data.datasets[0].data = statusData;
        charts.applications.update();
    }

    const categoryLabels = data.categoryLabels?.length ? data.categoryLabels : ['Software', 'Design', 'Marketing', 'Engineering'];
    const categoryData = data.categoryData?.length ? data.categoryData : [0, 0, 0, 0];
    if (charts.categories && charts.categories.data && charts.categories.data.datasets) {
        charts.categories.data.labels = categoryLabels;
        charts.categories.data.datasets[0].data = categoryData;
        charts.categories.update();
    }

    const trendLabels = data.monthlyTrendLabels?.length ? data.monthlyTrendLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const trendData = data.monthlyTrendData?.length ? data.monthlyTrendData : [0, 0, 0, 0, 0, 0];
    if (charts.trends && charts.trends.data && charts.trends.data.datasets) {
        charts.trends.data.labels = trendLabels;
        charts.trends.data.datasets[0].data = trendData;
        charts.trends.update();
    }
}

function updateMetrics(data) {
    const usersElement = document.getElementById('metricUsers');
    const internshipsElement = document.getElementById('metricInternships');
    const applicationsElement = document.getElementById('metricApplications');
    const placementsElement = document.getElementById('metricPlacements');
    
    if (usersElement) usersElement.textContent = data.activeUsers || data.totalUsers || 0;
    if (internshipsElement) internshipsElement.textContent = data.activeInternships || 0;
    if (applicationsElement) applicationsElement.textContent = data.totalApplications || 0;
    if (placementsElement) placementsElement.textContent = data.successfulPlacements || 0;

    const usersGrowthElement = document.getElementById('usersGrowth');
    const internshipsGrowthElement = document.getElementById('internshipsGrowth');
    const applicationsGrowthElement = document.getElementById('applicationsGrowth');
    const placementsRateElement = document.getElementById('placementsRate');
    
    if (usersGrowthElement) {
        const growth = Number.isFinite(data.usersGrowth) ? data.usersGrowth : 0;
        usersGrowthElement.textContent = `${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth).toFixed(1)}%`;
        usersGrowthElement.style.color = growth >= 0 ? '#10b981' : '#ef4444';
    }
    if (internshipsGrowthElement) {
        const growth = Number.isFinite(data.internshipsGrowth) ? data.internshipsGrowth : 0;
        internshipsGrowthElement.textContent = `${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth).toFixed(1)}%`;
        internshipsGrowthElement.style.color = growth >= 0 ? '#10b981' : '#ef4444';
    }
    if (applicationsGrowthElement) {
        const growth = Number.isFinite(data.applicationsGrowth) ? data.applicationsGrowth : 0;
        applicationsGrowthElement.textContent = `${growth >= 0 ? '↑' : '↓'} ${Math.abs(growth).toFixed(1)}%`;
        applicationsGrowthElement.style.color = growth >= 0 ? '#10b981' : '#ef4444';
    }
    if (placementsRateElement) {
        const rate = Number.isFinite(data.placementRate) ? data.placementRate : 0;
        placementsRateElement.textContent = `${rate.toFixed(1)}%`;
    }
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
    if (!container) return;

    if (!companies.length) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-building"></i><p>No data available</p></div>';
        return;
    }

    container.innerHTML = companies.map((company, index) => `
        <div style="padding: 1rem; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-md); margin-bottom: 0.75rem; display: flex; align-items: center; gap: 1rem;">
            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color); width: 40px;">#${index + 1}</div>
            <div style="flex: 1;">
                <strong>${company.companyName || company.name || 'Unknown Company'}</strong>
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
    const dateRange = document.getElementById('dateRange')?.value || '30';
    showAlert(`Loading reports for last ${dateRange} days...`, 'info');
    
    try {
        await loadReportsData();
        // Update charts with new date range
        // charts already updated by loadReportsData when successful
        showAlert('Reports updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating reports:', error);
        showAlert('Failed to update reports.', 'error');
    }
}

async function exportReport() {
    const format = prompt('Select export format:\n1. CSV\n2. PDF\n\nEnter 1 or 2:');
    if (!format || (format !== '1' && format !== '2')) {
        return;
    }

    const formatType = format === '1' ? 'csv' : 'pdf';
    const exportType = prompt('What data to export?\n1. Users\n2. Internships\n3. Applications\n4. All data\n\nEnter 1-4:');
    if (!exportType || !['1', '2', '3', '4'].includes(exportType)) {
        return;
    }

    const typeMap = {
        '1': 'users',
        '2': 'internships',
        '3': 'applications',
        '4': 'all'
    };

    const dataType = typeMap[exportType];

    try {
        showAlert(`Exporting ${dataType} as ${formatType.toUpperCase()}...`, 'info');

        const token = getAccessToken();
        const response = await fetch(`${API_CONFIG.BASE_URL}/admin/export/${dataType}?format=${formatType}`, {
            method: 'GET',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });

        if (!response.ok) {
            let errorMessage = 'Failed to export data';
            try {
                const errorBody = await response.json();
                errorMessage = errorBody.message || errorMessage;
            } catch (_) {
                // Ignore parse errors
            }
            throw new Error(errorMessage);
        }

        const blob = await response.blob();
        const disposition = response.headers.get('Content-Disposition');
        let filename = `trainup_${dataType}_${new Date().toISOString().split('T')[0]}.${formatType}`;

        if (disposition) {
            const match = disposition.match(/filename="?(.*?)"?$/);
            if (match && match[1]) {
                filename = match[1];
            }
        }

        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);

        showAlert('Export completed successfully!', 'success');
    } catch (error) {
        console.error('Error exporting data:', error);
        showAlert(error.message || 'Failed to export data', 'error');
    }
}

// Make functions globally available
window.exportReport = exportReport;
window.updateReports = updateReports;

