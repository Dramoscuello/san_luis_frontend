import api from "@/lib/axios.js";

/**
 * ============================================
 * SERVICIO DE COMENTARIOS
 * ============================================
 * Maneja las operaciones CRUD para comentarios de planeaciones
 * Solo coordinadores/rector pueden crear y eliminar comentarios
 * Docentes solo pueden ver comentarios de sus planeaciones
 */
export const comentariosService = {

    /**
     * Obtiene todos los comentarios de una planeación
     * @param {number} planeacionId - ID de la planeación
     * @returns {Promise<Array>} Lista de comentarios
     */
    async getComentariosPorPlaneacion(planeacionId) {
        try {
            const { data } = await api.get(`/comentarios/planeacion/${planeacionId}`);
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Crea un nuevo comentario en una planeación
     * Solo coordinadores/rector pueden crear comentarios
     * @param {number} planeacionId - ID de la planeación
     * @param {string} comentario - Contenido del comentario
     * @returns {Promise<Object>} Comentario creado
     */
    async crearComentario(planeacionId, comentario) {
        try {
            const { data } = await api.post('/comentarios', {
                planeacion_id: planeacionId,
                contenido: comentario
            });
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Elimina un comentario
     * Solo coordinadores/rector pueden eliminar comentarios
     * @param {number} comentarioId - ID del comentario a eliminar
     * @returns {Promise<Object>} Mensaje de confirmación
     */
    async eliminarComentario(comentarioId) {
        try {
            const { data } = await api.delete(`/comentarios/${comentarioId}`);
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Actualiza el contenido de un comentario
     * Solo coordinadores/rector pueden actualizar comentarios
     * @param {number} comentarioId - ID del comentario a actualizar
     * @param {string} contenido - Nuevo contenido del comentario
     * @returns {Promise<Object>} Comentario actualizado
     */
    async actualizarComentario(comentarioId, contenido) {
        try {
            const { data } = await api.patch(`/comentarios/${comentarioId}`, {
                contenido
            });
            return data;
        } catch (error) {
            throw error;
        }
    }
}
