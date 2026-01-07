import api from "@/lib/axios.js";

export const sedesService = {
    async getSedes() {
        try {
            const { data } = await api.get('/sedes');
            return data;
        }
        catch (error) {
            throw error;
        }
    },

    async updateSede(obj) {
        try {
            const response = await api.patch(`sedes/${obj.id}`, obj);
            return response;
        } catch (e) {
            throw e;
        }
    },

    async deleteSede(sede_id) {
        try {
            const response = await api.delete(`sedes/${sede_id}`);
            return response;
        } catch (e) {
            throw e;
        }
    },

    async createSede(obj) {
        delete obj.id;
        try {
            const response = await api.post(`/sedes`, obj);
            return response;
        } catch (e) {
            throw e;
        }
    }
}