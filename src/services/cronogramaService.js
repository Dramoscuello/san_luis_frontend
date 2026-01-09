import api from "@/lib/axios.js";

export const cronogramaService = {
    async getCronograma(anio = new Date().getFullYear()) {
        try {
            const { data } = await api.get(`/cronogramas/me?anio=${anio}`);
            return data;
        } catch (error) {
            // Si es 404, retornamos null para manejar el estado "sin cronograma"
            if (error.response && error.response.status === 404) {
                return null;
            }
            throw error;
        }
    },

    async getCronogramaDocente(docenteId, anio = new Date().getFullYear()) {
        try {
            // Endpoint solicitado por usuario: /cronogramas/docente/{docente_id}?anio={anio}
            // Si el backend usa otro path (ej: /usuario/), ajustar aquí.
            const { data } = await api.get(`/cronogramas/docente/${docenteId}?anio=${anio}`);
            return data;
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return null;
            }
            throw error;
        }
    },

    async createCronograma(obj) {
        try {
            const { data } = await api.post('/cronogramas/', obj);
            return data;
        } catch (error) {
            throw error;
        }
    },

    async updateCronograma(id, obj) {
        try {
            const { data } = await api.patch(`/cronogramas/${id}`, obj);
            return data;
        } catch (error) {
            throw error;
        }
    }
};
