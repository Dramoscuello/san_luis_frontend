import api from "@/lib/axios.js";

export const gradosService = {
    async getGradosBySede(sedeId) {
        try {
            const { data } = await api.get(`/grados?sede_id=${sedeId}`);
            console.log(data);
            return data;
        } catch (error) {
            throw error;
        }
    },

    async getGrado(gradoId) {
        try {
            const { data } = await api.get(`/grados/${gradoId}`);
            console.log(data);
            return data;
        } catch (error) {
            throw error;
        }
    },

    async createGrado(obj) {
        try {
            const response = await api.post('/grados', obj);
            return response;
        } catch (e) {
            throw e;
        }
    },

    async updateGrado(obj) {
        try {
            const response = await api.patch(`/grados/${obj.id}`, obj);
            return response;
        } catch (e) {
            throw e;
        }
    },

    async deleteGrado(gradoId) {
        try {
            const response = await api.delete(`/grados/${gradoId}`);
            return response;
        } catch (e) {
            throw e;
        }
    }
}
