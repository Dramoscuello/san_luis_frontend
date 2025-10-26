
export const authService = {
    setToken(token) {
        localStorage.setItem('jwt_token', token);
    },

    getToken() {
        return localStorage.getItem('jwt_token');
    },

    removeToken() {
        localStorage.removeItem('jwt_token');
    },

    setUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    removeUser() {
        localStorage.removeItem('user');
    },

    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;

        // Verificar si el token no ha expirado
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const isExpired = payload.exp * 1000 < Date.now();

            if (isExpired) {
                this.clearAuth();
                this.removeUser();
                return false;
            }

            return true;
        } catch (e) {
            return false;
        }
    },

    clearAuth() {
        this.removeToken();
        this.removeUser();
    }
};