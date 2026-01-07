import api from "@/lib/axios.js";

export const asignaturasService = {
    async getAsignaturas() {
        try {
            const { data } = await api.get('/asignaturas/');
            return data;
        } catch (error) {
            throw error;
        }
    },

    async updateAsignatura(obj) {
        try {
            const response = await api.patch(`/asignaturas/${obj.id}`, obj);
            return response;
        } catch (e) {
            throw e;
        }
    },

    async deleteAsignatura(asignatura_id) {
        try {
            const response = await api.delete(`/asignaturas/${asignatura_id}`);
            return response;
        } catch (e) {
            throw e;
        }
    },

    async createAsignatura(obj) {
        delete obj.id;
        try {
            const response = await api.post('/asignaturas', obj);
            return response;
        } catch (e) {
            throw e;
        }
    }
}
