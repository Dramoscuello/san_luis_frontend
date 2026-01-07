import api from "@/lib/axios.js";

export const estudiantesService = {
    async getEstudiantesByGrupo(grupoId) {
        try {
            const { data } = await api.get(`/estudiantes?grupo_id=${grupoId}`);
            return data;
        } catch (error) {
            throw error;
        }
    },

    async getEstudiante(estudianteId) {
        try {
            const { data } = await api.get(`/estudiantes/${estudianteId}`);
            return data;
        } catch (error) {
            throw error;
        }
    },

    async createEstudiante(obj) {
        try {
            const response = await api.post('/estudiantes/', obj);
            return response;
        } catch (e) {
            throw e;
        }
    },

    async updateEstudiante(obj) {
        try {
            const response = await api.patch(`/estudiantes/${obj.id}`, obj);
            return response;
        } catch (e) {
            throw e;
        }
    },

    async deleteEstudiante(estudianteId) {
        try {
            const response = await api.delete(`/estudiantes/${estudianteId}`);
            return response;
        } catch (e) {
            throw e;
        }
    }
}
