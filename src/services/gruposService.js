import api from "@/lib/axios.js";

export const gruposService = {
    async getGruposByGrado(gradoId) {
        try {
            const { data } = await api.get(`/grupos?grado_id=${gradoId}`);
            return data;
        } catch (error) {
            throw error;
        }
    },

    async getGrupo(grupoId) {
        try {
            const { data } = await api.get(`/grupos/${grupoId}`);
            return data;
        } catch (error) {
            throw error;
        }
    },

    async createGrupo(obj) {
        try {
            const response = await api.post('/grupos', obj);
            return response;
        } catch (e) {
            throw e;
        }
    },

    async updateGrupo(obj) {
        try {
            const response = await api.patch(`/grupos/${obj.id}`, obj);
            return response;
        } catch (e) {
            throw e;
        }
    },

    async deleteGrupo(grupoId) {
        try {
            const response = await api.delete(`/grupos/${grupoId}`);
            return response;
        } catch (e) {
            throw e;
        }
    },

    async asignarDirector(grupoId, docenteId) {
        try {
            const response = await api.post(`/grupos/${grupoId}/directores`, { docente_id: docenteId });
            return response;
        } catch (e) {
            throw e;
        }
    },

    async desasignarDirector(grupoId, docenteId) {
        try {
            const response = await api.delete(`/grupos/${grupoId}/directores/${docenteId}`);
            return response;
        } catch (e) {
            throw e;
        }
    }
}
