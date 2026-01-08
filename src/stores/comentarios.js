import { defineStore } from 'pinia';
import { ref } from 'vue';
import { comentariosService } from '@/services/comentariosService.js';

/**
 * ============================================
 * STORE DE COMENTARIOS
 * ============================================
 * Maneja el estado de los comentarios de planeaciones
 */
export const useComentariosStore = defineStore('comentarios', () => {

    // ============================================
    // ESTADO
    // ============================================

    // Lista de comentarios de la planeación actual
    const comentarios = ref([]);

    // Estado de carga
    const loading = ref(false);

    // Estado de envío de comentario
    const enviando = ref(false);

    // ID de la planeación actual (para mantener contexto)
    const planeacionActualId = ref(null);

    // ============================================
    // ACCIONES
    // ============================================

    /**
     * Obtiene los comentarios de una planeación
     * @param {number} planeacionId - ID de la planeación
     */
    const getComentarios = async (planeacionId) => {
        loading.value = true;
        planeacionActualId.value = planeacionId;
        try {
            const data = await comentariosService.getComentariosPorPlaneacion(planeacionId);
            comentarios.value = data;
        } catch (error) {
            console.error('Error al obtener comentarios:', error);
            comentarios.value = [];
        } finally {
            loading.value = false;
        }
    };

    /**
     * Crea un nuevo comentario
     * @param {number} planeacionId - ID de la planeación
     * @param {string} contenido - Contenido del comentario
     * @returns {Promise<Object>} Comentario creado
     */
    const crearComentario = async (planeacionId, contenido) => {
        enviando.value = true;
        try {
            const nuevoComentario = await comentariosService.crearComentario(planeacionId, contenido);
            // Agregar al inicio de la lista para mostrar el más reciente primero
            comentarios.value.unshift(nuevoComentario);
            return nuevoComentario;
        } finally {
            enviando.value = false;
        }
    };

    /**
     * Elimina un comentario
     * @param {number} comentarioId - ID del comentario a eliminar
     */
    const eliminarComentario = async (comentarioId) => {
        await comentariosService.eliminarComentario(comentarioId);
        // Eliminar del store local
        const index = comentarios.value.findIndex(c => c.id === comentarioId);
        if (index > -1) {
            comentarios.value.splice(index, 1);
        }
    };

    /**
     * Actualiza el contenido de un comentario
     * @param {number} comentarioId - ID del comentario a actualizar
     * @param {string} contenido - Nuevo contenido
     * @returns {Promise<Object>} Comentario actualizado
     */
    const actualizarComentario = async (comentarioId, contenido) => {
        const comentarioActualizado = await comentariosService.actualizarComentario(comentarioId, contenido);
        // Actualizar en el store local
        const index = comentarios.value.findIndex(c => c.id === comentarioId);
        if (index > -1) {
            comentarios.value[index].contenido = comentarioActualizado.contenido;
        }
        return comentarioActualizado;
    };

    /**
     * Limpia los comentarios (al cerrar modal)
     */
    const limpiarComentarios = () => {
        comentarios.value = [];
        planeacionActualId.value = null;
    };

    // ============================================
    // EXPORTS
    // ============================================

    return {
        // Estado
        comentarios,
        loading,
        enviando,
        planeacionActualId,

        // Acciones
        getComentarios,
        crearComentario,
        eliminarComentario,
        actualizarComentario,
        limpiarComentarios
    };
});
