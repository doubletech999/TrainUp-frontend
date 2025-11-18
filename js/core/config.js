// ===== TrainUp - API Configuration =====

// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:8080/api/v1',
    TIMEOUT: 10000,
};

// API Endpoints
const API_ENDPOINTS = {
    // Authentication
    AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        VERIFY_EMAIL: '/auth/verify-email',
        FORGOT_PASSWORD: '/auth/forgot-password',
        RESET_PASSWORD: '/auth/reset-password',
        CHANGE_PASSWORD: '/auth/change-password',
    },
    
    // Students
    STUDENTS: {
        PROFILE: '/students/me',
        UPDATE_PROFILE: '/students/me',
        INTERNSHIPS: '/internships',
        APPLICATIONS: '/applications',
    },
    
    // Companies
    COMPANIES: {
        PROFILE: '/companies/me',
        UPDATE_PROFILE: '/companies/me',
        INTERNSHIPS: '/internships/my-internships',
        APPLICATIONS: '/applications/company-applications',
    },
    
    // Internships
    INTERNSHIPS: {
        GET_ALL: '/internships',
        GET_BY_ID: (id) => `/internships/${id}`,
        CREATE: '/internships',
        UPDATE: (id) => `/internships/${id}`,
        DELETE: (id) => `/internships/${id}`,
        MY_INTERNSHIPS: '/internships/my-internships',
        PAGINATED: '/internships/paginated',
        BY_CATEGORY: (category) => `/internships/category/${category}`,
        BY_LOCATION: (location) => `/internships/location/${location}`,
        LATEST: '/internships/latest',
        TRENDING: '/internships/trending',
        STATS: '/internships/stats',
    },
    
    // Applications
    APPLICATIONS: {
        CREATE: '/applications',
        MY_APPLICATIONS: '/applications/my-applications',
        COMPANY_APPLICATIONS: '/applications/company-applications',
        SHORTLISTED: '/applications/shortlisted',
        UPDATE_STATUS: (id) => `/applications/${id}/status`,
        WITHDRAW: (id) => `/applications/${id}/withdraw`,
        DELETE: (id) => `/applications/${id}`,
    },
    
    // Evaluations
    EVALUATIONS: {
        COMPANY_EVALUATE: '/evaluations/company',
        STUDENT_EVALUATE: '/evaluations/student',
        MY_EVALUATIONS: '/evaluations/student/my-evaluations',
        COMPANY_EVALUATIONS: '/evaluations/company/my-evaluations',
        BY_APPLICATION: (id) => `/evaluations/application/${id}`,
    },
    
    // Messages
    MESSAGES: {
        CONVERSATIONS: '/messages/conversations',
        CONVERSATION: (id) => `/messages/conversations/${id}`,
        SEND: '/messages',
        MARK_READ: (id) => `/messages/conversations/${id}/read`,
    },
    
    // Notifications
    NOTIFICATIONS: {
        GET_ALL: '/notifications',
        UNREAD_COUNT: '/notifications/unread-count',
        RECENT: '/notifications/recent',
        MARK_READ: (id) => `/notifications/${id}/read`,
        MARK_ALL_READ: '/notifications/mark-all-read',
        CLEAR_ALL: '/notifications/clear-all',
    },
    
    // Search
    SEARCH: {
        INTERNSHIPS: '/search/internships',
        RECOMMENDATIONS: '/search/recommendations',
    },
    
    // Dashboard
    DASHBOARD: {
        STUDENT: '/dashboard/student',
        COMPANY: '/dashboard/company',
        ADMIN: '/dashboard/admin',
    },
    
    // Supervisor
    SUPERVISOR: {
        PROFILE: '/supervisor/me',
        UPDATE_PROFILE: '/supervisor/me',
        VERIFY_COMPANY: (id) => `/supervisor/companies/${id}/verify`,
        VERIFIED_COMPANIES: '/supervisor/companies/verified',
        PENDING_COMPANIES: '/supervisor/companies/pending',
        STATISTICS: '/supervisor/statistics',
        REVIEW_INTERNSHIP: (id) => `/supervisor/internships/${id}/review`,
        PENDING_INTERNSHIPS: '/supervisor/internships/pending',
        ALL_STUDENTS: '/supervisor/students',
        STUDENT_PROGRESS: (id) => `/supervisor/students/${id}/progress`,
        APPROVE_COMPLETION: (id) => `/supervisor/applications/${id}/approve-completion`,
        VERIFY_STUDENT: (id) => `/supervisor/students/${id}/verify`,
    },
    
    // Admin
    ADMIN: {
        USERS: '/admin/users',
        UPDATE_USER_STATUS: (id) => `/admin/users/${id}/status`,
        VERIFY_USER: (id) => `/admin/users/${id}/verify`,
        DELETE_USER: (id) => `/admin/users/${id}`,
        COMPANIES: '/admin/companies',
        VERIFY_COMPANY: (id) => `/admin/companies/${id}/verify`,
        UPDATE_COMPANY_STATUS: (id) => `/admin/companies/${id}/status`,
        DELETE_COMPANY: (id) => `/admin/companies/${id}`,
        INTERNSHIPS: '/admin/internships',
        APPROVE_INTERNSHIP: (id) => `/admin/internships/${id}/approve`,
        REJECT_INTERNSHIP: (id) => `/admin/internships/${id}/reject`,
        ARCHIVE_INTERNSHIP: (id) => `/admin/internships/${id}/archive`,
        REPORTS_SUMMARY: '/admin/reports/summary',
        EXPORT: (type) => `/admin/export/${type}`,
        SETTINGS: '/admin/settings',
        UPDATE_GENERAL_SETTINGS: '/admin/settings/general',
        UPDATE_EMAIL_SETTINGS: '/admin/settings/email',
        UPDATE_NOTIFICATION_SETTINGS: '/admin/settings/notifications',
        UPDATE_SECURITY_SETTINGS: '/admin/settings/security',
        TEST_EMAIL: '/admin/settings/test-email',
        BACKUP: '/admin/system/backup',
        CLEAR_CACHE: '/admin/system/clear-cache',
    },
    
    // Files
    FILES: {
        UPLOAD_CV: '/files/upload-cv',
        UPLOAD_LOGO: '/files/upload-logo',
        UPLOAD_COMPANY_PROOF: '/files/upload-company-proof',
        DOWNLOAD: (type, filename) => `/files/download/${type}/${filename}`,
        DELETE_CV: '/files/delete-cv',
    },
};

// User Types
const USER_TYPES = {
    STUDENT: 'STUDENT',
    COMPANY: 'COMPANY',
    SUPERVISOR: 'SUPERVISOR',
    ADMIN: 'ADMIN',
};

// Local Storage Keys
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'trainup_access_token',
    REFRESH_TOKEN: 'trainup_refresh_token',
    USER_DATA: 'trainup_user_data',
    REMEMBER_ME: 'trainup_remember_me',
};

// HTTP Status Codes
const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    SERVER_ERROR: 500,
};
