import axios from '@/lib/axios';

export default {
    getProyectos(docenteId = null) {
        const params = docenteId ? { docente_id: docenteId } : {};
        return axios.get('/proyectos/', { params });
    },

    getProyecto(id) {
        return axios.get(`/proyectos/${id}`);
    },

    crearProyecto(data) {
        // data debe ser un objeto FormData si incluye archivos
        return axios.post('/proyectos/', data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    actualizarProyecto(id, data) {
        return axios.patch(`/proyectos/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    eliminarProyecto(id) {
        return axios.delete(`/proyectos/${id}`);
    },

    // ============================================
    // EVIDENCIAS
    // ============================================

    getEvidencias(proyectoId) {
        return axios.get(`/proyectos/${proyectoId}/evidencias`);
    },

    crearEvidencia(proyectoId, formData) {
        return axios.post(`/proyectos/${proyectoId}/evidencias`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    eliminarEvidencia(proyectoId, evidenciaId) {
        return axios.delete(`/proyectos/${proyectoId}/evidencias/${evidenciaId}`);
    }
};
