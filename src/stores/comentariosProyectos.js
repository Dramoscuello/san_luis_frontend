import { defineStore } from 'pinia';
import { ref } from 'vue';
import { comentariosProyectosService } from '@/services/comentariosProyectosService.js';

export const useComentariosProyectosStore = defineStore('comentariosProyectos', () => {

    const comentarios = ref([]);
    const loading = ref(false);
    const enviando = ref(false);

    const getComentarios = async (proyectoId) => {
        loading.value = true;
        try {
            const data = await comentariosProyectosService.getComentariosPorProyecto(proyectoId);
            comentarios.value = data;
        } catch (error) {
            console.error('Error al obtener comentarios de proyecto:', error);
            comentarios.value = [];
        } finally {
            loading.value = false;
        }
    };

    const crearComentario = async (proyectoId, contenido) => {
        enviando.value = true;
        try {
            const nuevo = await comentariosProyectosService.crearComentario(proyectoId, contenido);
            comentarios.value.unshift(nuevo);
            return nuevo;
        } finally {
            enviando.value = false;
        }
    };

    const eliminarComentario = async (id) => {
        await comentariosProyectosService.eliminarComentario(id);
        const index = comentarios.value.findIndex(c => c.id === id);
        if (index > -1) comentarios.value.splice(index, 1);
    };

    const actualizarComentario = async (id, contenido) => {
        const actualizado = await comentariosProyectosService.actualizarComentario(id, contenido);
        const index = comentarios.value.findIndex(c => c.id === id);
        if (index > -1) {
            comentarios.value[index] = actualizado;
        }
        return actualizado;
    };

    const limpiarComentarios = () => {
        comentarios.value = [];
    };

    return {
        comentarios,
        loading,
        enviando,
        getComentarios,
        crearComentario,
        eliminarComentario,
        actualizarComentario,
        limpiarComentarios
    };
});
