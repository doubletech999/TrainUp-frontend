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
        INTERNSHIPS: '/companies/internships',
        APPLICATIONS: '/companies/applications',
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