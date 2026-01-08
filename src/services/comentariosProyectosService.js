import api from "@/lib/axios.js";

/**
 * ============================================
 * SERVICIO DE COMENTARIOS DE PROYECTOS
 * ============================================
 * ManejaCRUD para comentarios de proyectos pedagógicos
 */

export const comentariosProyectosService = {

    async getComentariosPorProyecto(proyectoId) {
        // Ajuste tentativo según patrón del backend observado
        const { data } = await api.get(`/comentarios-proyectos/proyecto/${proyectoId}`);
        return data;
    },

    async crearComentario(proyectoId, contenido) {
        const { data } = await api.post('/comentarios-proyectos/', {
            proyecto_id: proyectoId,
            contenido: contenido
        });
        return data;
    },

    async eliminarComentario(comentarioId) {
        const { data } = await api.delete(`/comentarios-proyectos/${comentarioId}`);
        return data;
    },

    async actualizarComentario(comentarioId, contenido) {
        const { data } = await api.patch(`/comentarios-proyectos/${comentarioId}`, {
            contenido
        });
        return data;
    }
}
