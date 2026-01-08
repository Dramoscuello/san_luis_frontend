import api from "@/lib/axios.js";

/**
 * ============================================
 * SERVICIO DE COMENTARIOS DE PROYECTOS
 * ============================================
 * ManejaCRUD para comentarios de proyectos pedagógicos
 */

export const comentariosProyectosService = {

    async getComentariosPorProyecto(proyectoId) {
        const { data } = await api.get(`/proyectos/${proyectoId}/comentarios`);
        return data;
    },

    async crearComentario(proyectoId, contenido) {
        const { data } = await api.post(`/proyectos/${proyectoId}/comentarios`, {
            contenido: contenido
        });
        return data;
    },

    async eliminarComentario(comentarioId) {
        const { data } = await api.delete(`/proyectos/comentarios/${comentarioId}`);
        return data;
    },

    async actualizarComentario(comentarioId, contenido) {
        const { data } = await api.patch(`/proyectos/comentarios/${comentarioId}`, {
            contenido
        });
        return data;
    }
}
