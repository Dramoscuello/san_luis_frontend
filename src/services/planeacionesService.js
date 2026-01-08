import api from "@/lib/axios.js";

/**
 * ============================================
 * SERVICIO DE PLANEACIONES
 * ============================================
 * Maneja todas las operaciones CRUD para planeaciones de clase
 * Soporta subida de archivos a Google Drive via backend
 */
export const planeacionesService = {

    /**
     * Obtiene todas las planeaciones (coordinadores/rector)
     * @param {number} [docenteId] - ID del docente para filtrar (opcional)
     * @returns {Promise<Array>} Lista de planeaciones con información del docente
     */
    async getPlaneaciones(docenteId = null) {
        try {
            let url = '/planeaciones/';
            if (docenteId) {
                url += `?docente_id=${docenteId}`;
            }
            const { data } = await api.get(url);
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtiene las planeaciones del docente autenticado
     * @returns {Promise<Array>} Lista de planeaciones propias
     */
    async getMisPlaneaciones() {
        try {
            const { data } = await api.get('/planeaciones/mis-planeaciones');
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtiene una planeación específica por ID
     * @param {number} id - ID de la planeación
     * @returns {Promise<Object>} Datos de la planeación
     */
    async getPlaneacion(id) {
        try {
            const { data } = await api.get(`/planeaciones/${id}`);
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Crea una nueva planeación con archivo obligatorio
     * Usa FormData para enviar datos + archivo (multipart/form-data)
     *
     * @param {Object} planeacionData - Datos de la planeación
     * @param {string} planeacionData.titulo - Título de la planeación
     * @param {number} planeacionData.asignatura_id - ID de la asignatura
     * @param {File} planeacionData.archivo - Archivo adjunto (obligatorio)
     * @returns {Promise<Object>} Planeación creada con datos del archivo en Drive
     */
    async createPlaneacion(planeacionData) {
        try {
            const formData = new FormData();

            formData.append('titulo', planeacionData.titulo);
            formData.append('asignatura_id', planeacionData.asignatura_id);

            if (planeacionData.archivo) {
                formData.append('archivo', planeacionData.archivo);
            }

            const response = await api.post('/planeaciones/', formData);
            return response;
        } catch (error) {
            console.error('Error al crear planeación:', error.response?.data);
            throw error;
        }
    },

    /**
     * Actualiza una planeación existente
     *
     * @param {number} id - ID de la planeación a actualizar
     * @param {Object} updateData - Datos a actualizar
     * @param {string} [updateData.titulo] - Nuevo título (opcional)
     * @param {number} [updateData.asignatura_id] - Nueva asignatura (opcional)
     * @param {File} [updateData.archivo] - Nuevo archivo (reemplaza el anterior)
     * @returns {Promise<Object>} Planeación actualizada
     */
    async updatePlaneacion(id, updateData) {
        try {
            const formData = new FormData();

            if (updateData.titulo !== undefined && updateData.titulo !== null) {
                formData.append('titulo', updateData.titulo);
            }

            if (updateData.asignatura_id !== undefined && updateData.asignatura_id !== null) {
                formData.append('asignatura_id', updateData.asignatura_id);
            }

            if (updateData.archivo) {
                formData.append('archivo', updateData.archivo);
            }

            const response = await api.patch(`/planeaciones/${id}`, formData);
            return response;
        } catch (error) {
            console.error('Error al actualizar planeación:', error.response?.data);
            throw error;
        }
    },

    /**
     * Elimina una planeación
     * También elimina el archivo de Google Drive
     *
     * @param {number} id - ID de la planeación a eliminar
     * @returns {Promise<Object>} Mensaje de confirmación
     */
    async deletePlaneacion(id) {
        try {
            const response = await api.delete(`/planeaciones/${id}`);
            return response;
        } catch (error) {
            console.error('Error al eliminar planeación:', error.response?.data);
            throw error;
        }
    }
}
