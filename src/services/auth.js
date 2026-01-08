
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

    /**
     * Decodifica el payload del JWT token
     * @returns {Object|null} El payload decodificado o null si hay error
     */
    getTokenPayload() {
        try {
            const token = this.getToken();
            if (!token) return null;
            return JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            console.error('Error decodificando token:', e);
            return null;
        }
    },

    /**
     * Obtiene el rol del usuario desde el JWT token
     * El token puede tener el rol en 'rol' o 'role' dependiendo del backend
     * @returns {string|null} El rol en minúsculas o null
     */
    getUserRole() {
        // Primero intentar obtener del token JWT
        const payload = this.getTokenPayload();
        if (payload) {
            // El backend puede usar 'rol', 'role', o 'sub' con info extra
            const rol = payload.rol || payload.role;
            if (rol) {
                return rol.toLowerCase();
            }
        }

        // Fallback: obtener del localStorage (por si se guardó completo)
        const user = this.getUser();
        if (user && typeof user === 'object' && user.rol) {
            return user.rol.toLowerCase();
        }

        return null;
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