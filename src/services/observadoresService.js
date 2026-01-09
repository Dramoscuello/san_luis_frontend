import api from "@/lib/axios.js";

export const observadoresService = {
    async createObservacion(data) {
        try {
            const response = await api.post('/observadores/', data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getObservacionActual(estudianteId) {
        try {
            const response = await api.get(`/observadores/estudiante/${estudianteId}/actual`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async updateObservacion(id, data) {
        try {
            const response = await api.put(`/observadores/${id}`, data);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    async getHistorialObservaciones(estudianteId) {
        try {
            const response = await api.get(`/observadores/estudiante/${estudianteId}/historial`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};
