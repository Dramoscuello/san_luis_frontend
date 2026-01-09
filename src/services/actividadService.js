import api from "@/lib/axios.js";

export const actividadService = {
    // Create
    async createActividad(obj) {
        try {
            const { data } = await api.post('/cronogramas/actividades', obj);
            return data;
        } catch (error) {
            throw error;
        }
    },

    // Update (PATCH)
    async updateActividad(id, obj) {
        try {
            const { data } = await api.patch(`/cronogramas/actividades/${id}`, obj);
            return data;
        } catch (error) {
            throw error;
        }
    },

    // Delete
    async deleteActividad(id) {
        try {
            await api.delete(`/cronogramas/actividades/${id}`);
            return true;
        } catch (error) {
            throw error;
        }
    },

    // Upload Evidencia
    async uploadEvidencia(formData) {
        try {
            const { data } = await api.post('/cronogramas/evidencias', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return data;
        } catch (error) {
            throw error;
        }
    },

    // Delete Evidencia
    async deleteEvidencia(id) {
        try {
            await api.delete(`/cronogramas/evidencias/${id}`);
            return true;
        } catch (error) {
            throw error;
        }
    }
};
