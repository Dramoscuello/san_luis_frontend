import axios from '@/lib/axios';

export default {
    getProyectos() {
        return axios.get('/proyectos/');
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
    }
};
