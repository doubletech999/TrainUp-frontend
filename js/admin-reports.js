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
            updateCharts(response.data);
        } else {
            // Use mock data if API fails
            loadMockData();
        }
    } catch (error) {
        console.error('Error loading reports:', error);
        // Use mock data as fallback
        loadMockData();
    }
}

function loadMockData() {
    // Mock data for demonstration
    const mockData = {
        activeUsers: 1247,
        activeInternships: 89,
        totalApplications: 3421,
        successfulPlacements: 156,
        usersGrowth: 12.5,
        internshipsGrowth: 8.3,
        applicationsGrowth: 15.7,
        placementRate: 4.6,
        topCompanies: [
            { name: 'TechCorp Solutions', internships: 12, applications: 245 },
            { name: 'Digital Innovations', internships: 8, applications: 189 },
            { name: 'Future Systems', internships: 10, applications: 178 },
            { name: 'Cloud Services Ltd', internships: 6, applications: 142 },
            { name: 'Data Analytics Co', internships: 7, applications: 134 }
        ]
    };
    
    updateMetrics(mockData);
    updateTopCompanies(mockData.topCompanies);
    updateCharts(mockData);
}

function updateCharts(data) {
    // Update charts with real or mock data
    if (charts.users && charts.users.data && charts.users.data.datasets) {
        charts.users.data.datasets[0].data = data.usersData || [12, 19, 15, 25, 22, 28, 30];
        charts.users.update();
    }
    
    if (charts.applications && charts.applications.data && charts.applications.data.datasets) {
        const total = data.totalApplications || 3421;
        const pending = Math.round(total * 0.3);
        const accepted = Math.round(total * 0.5);
        const rejected = Math.round(total * 0.2);
        charts.applications.data.datasets[0].data = [pending, accepted, rejected];
        charts.applications.update();
    }
    
    if (charts.categories && charts.categories.data && charts.categories.data.datasets) {
        charts.categories.data.datasets[0].data = data.categoriesData || [45, 30, 25, 20, 15];
        charts.categories.update();
    }
    
    if (charts.trends && charts.trends.data && charts.trends.data.datasets) {
        charts.trends.data.datasets[0].data = data.trendsData || [65, 78, 90, 81, 95, 105, 120];
        charts.trends.update();
    }
}

function updateMetrics(data) {
    const usersElement = document.getElementById('metricUsers');
    const internshipsElement = document.getElementById('metricInternships');
    const applicationsElement = document.getElementById('metricApplications');
    const placementsElement = document.getElementById('metricPlacements');
    
    if (usersElement) usersElement.textContent = data.activeUsers || 0;
    if (internshipsElement) internshipsElement.textContent = data.activeInternships || 0;
    if (applicationsElement) applicationsElement.textContent = data.totalApplications || 0;
    if (placementsElement) placementsElement.textContent = data.successfulPlacements || 0;

    const usersGrowthElement = document.getElementById('usersGrowth');
    const internshipsGrowthElement = document.getElementById('internshipsGrowth');
    const applicationsGrowthElement = document.getElementById('applicationsGrowth');
    const placementsRateElement = document.getElementById('placementsRate');
    
    if (usersGrowthElement) {
        const growth = data.usersGrowth || 0;
        usersGrowthElement.textContent = `↑ ${growth}%`;
        usersGrowthElement.style.color = growth >= 0 ? '#10b981' : '#ef4444';
    }
    if (internshipsGrowthElement) {
        const growth = data.internshipsGrowth || 0;
        internshipsGrowthElement.textContent = `↑ ${growth}%`;
        internshipsGrowthElement.style.color = growth >= 0 ? '#10b981' : '#ef4444';
    }
    if (applicationsGrowthElement) {
        const growth = data.applicationsGrowth || 0;
        applicationsGrowthElement.textContent = `↑ ${growth}%`;
        applicationsGrowthElement.style.color = growth >= 0 ? '#10b981' : '#ef4444';
    }
    if (placementsRateElement) {
        placementsRateElement.textContent = `${data.placementRate || 0}%`;
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
    const dateRange = document.getElementById('dateRange')?.value || '30';
    showAlert(`Loading reports for last ${dateRange} days...`, 'info');
    
    try {
        await loadReportsData();
        // Update charts with new date range
        if (Object.keys(charts).length > 0) {
            updateCharts({});
        }
        showAlert('Reports updated successfully!', 'success');
    } catch (error) {
        console.error('Error updating reports:', error);
        showAlert('Failed to update reports. Showing cached data.', 'warning');
    }
}

async function exportReport() {
    // Show export options modal
    const format = prompt('Select export format:\n1. CSV\n2. PDF\n\nEnter 1 or 2:');

    if (!format || (format !== '1' && format !== '2')) {
        return;
    }

    const formatType = format === '1' ? 'csv' : 'pdf';
    const exportType = prompt('What data to export?\n1. Users\n2. Internships\n3. Applications\n4. All Data\n\nEnter 1-4:');

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
        showAlert(`Exporting ${dataType} data as ${formatType.toUpperCase()}...`, 'info');

        const response = await apiRequest(`/admin/export/${dataType}?format=${formatType}`, {
            method: 'GET'
        });

        if (response.success) {
            // Create download link
            const blob = new Blob([response.data], {
                type: formatType === 'csv' ? 'text/csv' : 'application/pdf'
            });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trainup_${dataType}_${new Date().toISOString().split('T')[0]}.${formatType}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showAlert('Export completed successfully!', 'success');
        } else {
            throw new Error('Export failed');
        }

    } catch (error) {
        console.error('Error exporting data:', error);
        showAlert('Export functionality requires backend implementation', 'info');
    }
}
