import { tokenStorage } from './tokenStorage';

// export const BASE_URL = 'https://ibnotes.abisexport.com';
export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';



// Session manager for handling expired sessions
const handleSessionExpired = () => {
    console.log('⚠️ Session expired - redirecting to login');
    // Clear tokens
    tokenStorage.clearTokens();
    // Redirect to login
    window.location.href = '/login';
};

// Singleton to prevent concurrent refresh requests
let activeRefreshPromise = null;

/**
 * Shared logic for token refreshment and session validation
 * ensures only one request is in flight to prevent token rotation invalidation
 */
const performAuthRefresh = async (refreshToken) => {
    if (activeRefreshPromise) {
        console.log('⏳ [Auth] Reusing active refresh request...');
        return activeRefreshPromise;
    }

    activeRefreshPromise = (async () => {
        try {
            console.log('🔄 [Auth] Sending refresh request...');
            // Backend requires refresh_token in Query Params (validated by 422 error loc: ["query", "refresh_token"])
            // We also send an empty JSON body to prevent potential 500 errors if the server expects a body payload.
            const response = await fetch(`${BASE_URL}/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            console.log(`🔌 [Auth] Response Status: ${response.status}`);
            const responseText = await response.text();

            if (response.ok) {
                const data = JSON.parse(responseText);
                // Store tokens immediately
                await tokenStorage.saveTokens(data.access_token, data.refresh_token, data.session_id);
                console.log('✅ Auth refreshed successfully');
                return data;
            } else {
                console.error(`❌ [Auth] Server rejected (${response.status})`);
                console.error('🔍 [Auth] Error Details:', responseText);
                await tokenStorage.clearTokens();
                throw new Error('SESSION_EXPIRED');
            }
        } catch (error) {
            console.error('❌ Auth refresh failed:', error.message);
            await tokenStorage.clearTokens();
            throw new Error('SESSION_EXPIRED');
        } finally {
            activeRefreshPromise = null;
        }
    })();

    return activeRefreshPromise;
};

// Helper function to refresh tokens (used for retries)
const refreshAccessToken = async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
        console.log('⚠️ [Refresh] No refresh token found');
        handleSessionExpired();
        throw new Error('SESSION_EXPIRED');
    }

    const data = await performAuthRefresh(refreshToken);
    return data.access_token;
};

// Main API request function
const apiRequest = async (endpoint, method = 'GET', body = null, retryCount = 0) => {
    let token = await tokenStorage.getAccessToken();

    const headers = {};
    if (body && !(body instanceof FormData) && !(body instanceof URLSearchParams)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
    };

    if (body) {
        if (body instanceof FormData || body instanceof URLSearchParams) {
            config.body = body;
        } else {
            config.body = JSON.stringify(body);
        }
    }

    const url = `${BASE_URL}${endpoint}`;
    console.log(`🌐 [API Request] ${method} ${url}`);

    try {
        const response = await fetch(url, config);
        console.log(`🔌 [Response Status] ${response.status}`);

        const responseText = await response.text();

        // Handle 401 Unauthorized - try to refresh token
        if (response.status === 401 && retryCount === 0 && !endpoint.includes('/auth/login')) {
            console.warn('🚫 [401] Unauthorized - Attempting token refresh...');

            try {
                await refreshAccessToken();
                console.log('🔄 Retrying request with new token...');
                return await apiRequest(endpoint, method, body, retryCount + 1);
            } catch (refreshError) {
                console.error('❌ Token refresh failed - Session expired');
                handleSessionExpired();
                throw new Error('SESSION_EXPIRED');
            }
        }

        if (!response.ok) {
            let errorMessage = 'Something went wrong';
            try {
                const errorData = JSON.parse(responseText);
                if (errorData.detail) {
                    errorMessage = typeof errorData.detail === 'string'
                        ? errorData.detail
                        : JSON.stringify(errorData.detail);
                }
            } catch (e) {
                errorMessage = responseText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        try {
            return JSON.parse(responseText);
        } catch (e) {
            return responseText;
        }
    } catch (error) {
        console.error(`API Error (${endpoint}):`, error);

        if (error.message === 'SESSION_EXPIRED') {
            handleSessionExpired();
        }

        throw error;
    }
};

// API Service
export const apiService = {
    // Auth
    register: (data) => apiRequest('/auth/register', 'POST', data),

    validateSession: async (refreshToken) => {
        return performAuthRefresh(refreshToken);
    },

    login: (email, password) => {
        const params = new URLSearchParams();
        params.append('username', email);
        params.append('password', password);
        return apiRequest('/auth/login', 'POST', params);
    },

    // Tasks
    getDashboardStats: () => apiRequest('/user-data/dashboard-stats'),
    getTasks: () => apiRequest('/user-data/tasks'),
    createTask: (data) => apiRequest('/user-data/tasks', 'POST', data),
    updateTask: (id, data) => apiRequest(`/user-data/tasks/${id}`, 'PUT', data),
    deleteTask: (id) => apiRequest(`/user-data/tasks/${id}`, 'DELETE'),

    // Notes
    getNotes: () => apiRequest('/user-data/notes'),
    createNote: (data) => apiRequest('/user-data/notes', 'POST', data),
    updateNote: (id, data) => apiRequest(`/user-data/notes/${id}`, 'PUT', data),
    deleteNote: (id) => apiRequest(`/user-data/notes/${id}`, 'DELETE'),

    // Master Data (HODs, Plants, Hatcheries)
    getHods: (search = '') => apiRequest(`/scheduler/search-hod?q=${encodeURIComponent(search)}`),
    createHod: (data) => apiRequest('/master/hod', 'POST', data),
    updateHod: (id, data) => apiRequest(`/master/hod/${id}`, 'PUT', data),
    deleteHod: (id) => apiRequest(`/master/hod/${id}`, 'DELETE'),

    getPlants: (search = '') => apiRequest(`/master/plant${search ? `?search=${search}` : ''}`),
    createPlant: (data) => apiRequest('/master/plant', 'POST', data),
    updatePlant: (id, data) => apiRequest(`/master/plant/${id}`, 'PUT', data),
    deletePlant: (id) => apiRequest(`/master/plant/${id}`, 'DELETE'),

    getHatcheries: (plantId = null) => apiRequest(`/master/hatchery${plantId ? `?plant_id=${plantId}` : ''}`),
    createHatchery: (data) => apiRequest('/master/hatchery', 'POST', data),
    updateHatchery: (id, data) => apiRequest(`/master/hatchery/${id}`, 'PUT', data),
    deleteHatchery: (id) => apiRequest(`/master/hatchery/${id}`, 'DELETE'),

    // Scheduler
    scheduleMessage: (data) => apiRequest('/scheduler/', 'POST', data),
    getSchedules: (status = null) => apiRequest(`/scheduler/${status && status !== 'ALL' ? `?status=${status}` : ''}`),
    getSchedulerStats: () => apiRequest('/scheduler/my-schedulers/stats'),
    updateSchedule: (id, data) => apiRequest(`/scheduler/${id}`, 'PUT', data),
    deleteSchedule: (id) => apiRequest(`/scheduler/${id}`, 'DELETE'),

    // Chatbot
    sendChatMessage: (message, history = []) => apiRequest('/chat/message-ollama', 'POST', { message, history }),
};

export default apiService;
