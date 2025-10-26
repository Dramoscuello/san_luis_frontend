import api from "@/lib/axios.js";

export const userService = {
    async getInfoUserLogged(username) {
        try {
            const {data} = await api.get(`/user/${username}`);
            return data;
        } catch (error) {
            throw error;
        }
    },
}