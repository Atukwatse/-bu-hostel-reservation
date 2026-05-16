// API Configuration for Django Backend
export const API_CONFIG = {
    BASE_URL: '/api',
    TIMEOUT: 10000,
    
    // Authentication endpoints
    AUTH: {
        LOGIN: '/auth/login/',
        LOGOUT: '/auth/logout/',
        REGISTER: '/auth/register/',
        CURRENT_USER: '/auth/me/',
        CHANGE_PASSWORD: '/users/users/change_password/',
    },
    
    // Hostel endpoints
    HOSTELS: {
        LIST: '/hostels/hostels/',
        DETAIL: (id) => `/hostels/hostels/${id}/`,
        AVAILABLE: '/hostels/hostels/available/',
        ROOMS: (id) => `/hostels/hostels/${id}/rooms/`,
        REVIEWS: (id) => `/hostels/hostels/${id}/reviews/`,
        ADD_REVIEW: (id) => `/hostels/hostels/${id}/add_review/`,
        SEARCH: '/hostels/hostels/search/',
        BY_TYPE: '/hostels/hostels/by_type/',
    },
    
    // Room endpoints
    ROOMS: {
        LIST: '/hostels/rooms/',
        DETAIL: (id) => `/hostels/rooms/${id}/`,
        CREATE: '/hostels/rooms/',
        UPDATE: (id) => `/hostels/rooms/${id}/`,
        DELETE: (id) => `/hostels/rooms/${id}/`,
    },
    
    // User endpoints
    USERS: {
        PROFILE: '/users/users/profile/',
        UPDATE_PROFILE: '/users/users/profile/',
        LOGIN_HISTORY: '/users/users/login_history/',
        STATS: '/users/users/stats/',
        CARETAKERS_CREATE: '/users/users/caretakers/',
    },
    
    // Reservation endpoints
    RESERVATIONS: {
        LIST: '/reservations/reservations/',
        CREATE: '/reservations/reservations/',
        MY_RESERVATIONS: '/reservations/reservations/my_reservations/',
        DETAIL: (id) => `/reservations/reservations/${id}/`,
        CONFIRM: (id) => `/reservations/reservations/${id}/confirm/`,
        CANCEL: (id) => `/reservations/reservations/${id}/cancel/`,
        PAYMENTS: (id) => `/reservations/reservations/${id}/payments/`,
        ADD_PAYMENT: (id) => `/reservations/reservations/${id}/add_payment/`,
    },
    
    // Inquiry endpoints
    INQUIRIES: {
        LIST: '/reservations/inquiries/',
        CREATE: '/reservations/inquiries/',
        DETAIL: (id) => `/reservations/inquiries/${id}/`,
        RESPOND: (id) => `/reservations/inquiries/${id}/respond/`,
    },
    
    // Waiting list endpoints
    WAITING_LIST: {
        LIST: '/reservations/waiting-list/',
        CREATE: '/reservations/waiting-list/',
        MY_ENTRIES: '/reservations/waiting-list/my_entries/',
        DEACTIVATE: (id) => `/reservations/waiting-list/${id}/deactivate/`,
    },
    
    // Review endpoints
    REVIEWS: {
        LIST: '/hostels/reviews/',
        CREATE: '/hostels/reviews/',
        DETAIL: (id) => `/hostels/reviews/${id}/`,
    }
};

class ApiClient {
    constructor() {
        this.baseURL = API_CONFIG.BASE_URL;
        this.token = localStorage.getItem('authToken');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('authToken', token);
    }

    removeToken() {
        this.token = null;
        localStorage.removeItem('authToken');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        const stored = localStorage.getItem('authToken');
        if (stored) {
            this.token = stored;
        }
        if (this.token) {
            headers['Authorization'] = `Token ${this.token}`;
        }
        
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options,
        };

        try {
            const response = await fetch(url, config);
            
            if (response.status === 401) {
                this.removeToken();
                // Only dispatch unauthorized event if it's NOT a login request
                if (!endpoint.includes('/auth/login')) {
                    const event = new CustomEvent('auth:unauthorized');
                    window.dispatchEvent(event);
                }
                
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch (e) {}
                
                throw new Error(errorData.detail || errorData.message || (endpoint.includes('/auth/login') ? 'Invalid credentials' : 'Session expired. Please login again.'));
            }

            if (!response.ok) {
                const text = await response.text().catch(() => '');
                let errorData = {};
                try {
                    errorData = JSON.parse(text);
                } catch (e) {}
                
                let errorMessage = errorData.detail || errorData.message;
                
                if (!errorMessage && Object.keys(errorData).length > 0) {
                    const errorMessages = [];
                    for (const [key, value] of Object.entries(errorData)) {
                        const valStr = Array.isArray(value) ? value.join(', ') : value;
                        errorMessages.push(`${key}: ${valStr}`);
                    }
                    errorMessage = errorMessages.join(' | ');
                }
                
                throw new Error(errorMessage || text || `HTTP ${response.status}`);
            }

            const text = await response.text();
            return text ? JSON.parse(text) : null;
        } catch (error) {
            console.error(`API Error on ${options.method || 'GET'} ${url}:`, error.message || error);
            throw error;
        }
    }

    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url);
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async patch(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE',
        });
    }

    async upload(endpoint, formData, method = 'POST') {
        const url = `${this.baseURL}${endpoint}`;
        const headers = {};
        
        const stored = localStorage.getItem('authToken');
        if (stored) {
            this.token = stored;
        }
        if (this.token) {
            headers['Authorization'] = `Token ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                method: method,
                headers,
                body: formData,
            });

            if (!response.ok) {
                let errorText = await response.text().catch(() => '');
                let errorData = {};
                try {
                    errorData = JSON.parse(errorText);
                } catch (e) {
                    // Not JSON
                }
                
                let errorMessage = errorData.detail || errorData.message || errorData.error;
                
                // If it's a validation error object from Django
                if (!errorMessage && Object.keys(errorData).length > 0) {
                    const errorMessages = [];
                    for (const [key, value] of Object.entries(errorData)) {
                        const valStr = Array.isArray(value) ? value.join(', ') : value;
                        errorMessages.push(`${key}: ${valStr}`);
                    }
                    errorMessage = errorMessages.join(' | ');
                }
                
                throw new Error(errorMessage || `HTTP ${response.status}`);
            }

            const text = await response.text();
            return text ? JSON.parse(text) : null;
        } catch (error) {
            console.error('Upload Error:', error);
            throw error;
        }
    }
}

export const api = new ApiClient();
