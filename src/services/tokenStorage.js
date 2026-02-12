// Token storage using localStorage (secure storage for web)
export const tokenStorage = {
    // Save tokens
    saveTokens: async (accessToken, refreshToken, sessionId = null) => {
        try {
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            if (sessionId) {
                localStorage.setItem('session_id', sessionId);
            }
        } catch (error) {
            console.error('Error saving tokens:', error);
        }
    },

    // Get access token
    getAccessToken: async () => {
        try {
            return localStorage.getItem('access_token');
        } catch (error) {
            console.error('Error getting access token:', error);
            return null;
        }
    },

    // Get refresh token
    getRefreshToken: async () => {
        try {
            return localStorage.getItem('refresh_token');
        } catch (error) {
            console.error('Error getting refresh token:', error);
            return null;
        }
    },

    // Get session ID
    getSessionId: async () => {
        try {
            return localStorage.getItem('session_id');
        } catch (error) {
            console.error('Error getting session ID:', error);
            return null;
        }
    },

    // Clear all tokens
    clearTokens: async () => {
        try {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('session_id');
        } catch (error) {
            console.error('Error clearing tokens:', error);
        }
    },
};
