import api from "@/lib/axios.js";

export const areasService = {
    async getAreas() {
        try {
            const { data } = await api.get('/areas');
            return data;
        } catch (error) {
            throw error;
        }
    },

    async updateArea(obj) {
        try {
            const response = await api.patch(`/areas/${obj.id}`, obj);
            return response;
        } catch (e) {
            throw e;
        }
    },

    async deleteArea(area_id) {
        try {
            const response = await api.delete(`/areas/${area_id}`);
            return response;
        } catch (e) {
            throw e;
        }
    },

    async createArea(obj) {
        delete obj.id;
        try {
            const response = await api.post('/areas', obj);
            return response;
        } catch (e) {
            throw e;
        }
    }
}
