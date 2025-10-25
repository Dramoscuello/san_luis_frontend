import api from "@/lib/axios.js";

export const loginService = {
    async login(credentials) {
        try {
            const formData = new URLSearchParams();
            formData.append('username', credentials.username);
            formData.append('password', credentials.password);

            const response = await api.post('/auth', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            });

            return response.data;
        } catch (error) {
            throw error;
        }
    },
}