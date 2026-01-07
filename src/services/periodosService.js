import api from "@/lib/axios.js";

export const periodosService = {
    async getPeriodos() {
        try {
            const { data } = await api.get('/periodos/');
            return data;
        } catch (error) {
            throw error;
        }
    },

    async getPeriodoActivo() {
        try {
            const { data } = await api.get('/periodos/activo');
            return data;
        } catch (error) {
            throw error;
        }
    },

    async getPeriodo(periodoId) {
        try {
            const { data } = await api.get(`/periodos/${periodoId}`);
            return data;
        } catch (error) {
            throw error;
        }
    },

    async updatePeriodo(periodoId, obj) {
        try {
            const response = await api.patch(`/periodos/${periodoId}`, obj);
            return response;
        } catch (e) {
            throw e;
        }
    }
}
