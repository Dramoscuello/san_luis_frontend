import api from "@/lib/axios.js";

/**
 * ============================================
 * SERVICIO DE PLANEACIONES DESTACADAS
 * ============================================
 * Maneja las operaciones para marcar planeaciones como destacadas
 */
export const planeacionesDestacadasService = {

    /**
     * Obtiene todas las planeaciones destacadas
     * @returns {Promise<Array>} Lista de planeaciones destacadas
     */
    async getPlaneacionesDestacadas() {
        try {
            const { data } = await api.get('/planeaciones-destacadas/');
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Marca una planeacion como destacada
     * @param {number} planeacionId - ID de la planeacion a destacar
     * @param {string} razon - Razon por la cual se destaca
     * @returns {Promise<Object>} Planeacion destacada creada
     */
    async marcarDestacada(planeacionId, razon) {
        try {
            const { data } = await api.post('/planeaciones-destacadas/', {
                planeacion_id: planeacionId,
                razon: razon
            });
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Elimina una planeacion de destacadas
     * @param {number} id - ID del registro de planeacion destacada
     * @returns {Promise<Object>} Mensaje de confirmacion
     */
    async eliminarDestacada(id) {
        try {
            const { data } = await api.delete(`/planeaciones-destacadas/${id}`);
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualiza una planeacion destacada (razon o visualizaciones)
     * @param {number} id - ID del registro de planeacion destacada
     * @param {Object} updateData - Datos a actualizar
     * @returns {Promise<Object>} Planeacion destacada actualizada
     */
    async actualizarDestacada(id, updateData) {
        try {
            const { data } = await api.patch(`/planeaciones-destacadas/${id}`, updateData);
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Incrementa las visualizaciones de una planeacion destacada
     * @param {number} id - ID del registro de planeacion destacada
     * @returns {Promise<Object>} Planeacion destacada con visualizaciones actualizadas
     */
    async incrementarVisualizaciones(id) {
        try {
            const { data } = await api.patch(`/planeaciones-destacadas/${id}/visualizaciones`);
            return data;
        } catch (error) {
            throw error;
        }
    }
}
