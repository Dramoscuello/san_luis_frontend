import api from "@/lib/axios.js";

/**
 * ============================================
 * SERVICIO DE PUBLICACIONES
 * ============================================
 * Maneja todas las operaciones CRUD para publicaciones
 * Soporta subida de archivos a Google Drive via backend
 */
export const publicacionesService = {

    /**
     * Obtiene todas las publicaciones ordenadas por fecha (más reciente primero)
     * @returns {Promise<Array>} Lista de publicaciones con información del autor
     */
    async getPublicaciones() {
        try {
            const { data } = await api.get('/publicaciones/');
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Obtiene una publicación específica por ID
     * @param {number} id - ID de la publicación
     * @returns {Promise<Object>} Datos de la publicación
     */
    async getPublicacion(id) {
        try {
            const { data } = await api.get(`/publicaciones/${id}`);
            return data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Crea una nueva publicación con soporte para archivo adjunto
     * Usa FormData para enviar datos + archivo (multipart/form-data)
     * 
     * @param {Object} publicacionData - Datos de la publicación
     * @param {string} publicacionData.titulo - Título (mínimo 5 caracteres)
     * @param {string} publicacionData.contenido - Contenido (mínimo 10 caracteres)
     * @param {File|null} publicacionData.archivo - Archivo adjunto (opcional)
     * @returns {Promise<Object>} Publicación creada con datos del archivo en Drive
     */
    async createPublicacion(publicacionData) {
        try {
            // Crear FormData para enviar archivo + datos como multipart/form-data
            const formData = new FormData();

            // Agregar campos de texto requeridos
            formData.append('titulo', publicacionData.titulo);
            formData.append('contenido', publicacionData.contenido);

            // Agregar archivo solo si existe
            // El backend recibirá esto como UploadFile en FastAPI
            if (publicacionData.archivo) {
                formData.append('archivo', publicacionData.archivo);
                console.log('📎 Archivo adjunto:', publicacionData.archivo.name);
            }

            console.log('📤 Creando publicación...');

            // Axios detecta FormData y establece automáticamente:
            // Content-Type: multipart/form-data con el boundary correcto
            const response = await api.post('/publicaciones/', formData);

            console.log('✅ Publicación creada:', response.data);
            return response;
        } catch (error) {
            console.error('❌ Error al crear publicación:', error.response?.data);
            throw error;
        }
    },

    /**
     * Actualiza una publicación existente
     * Soporta actualización de título, contenido, nuevo archivo o eliminación de archivo
     * 
     * @param {number} id - ID de la publicación a actualizar
     * @param {Object} updateData - Datos a actualizar
     * @param {string} [updateData.titulo] - Nuevo título (opcional)
     * @param {string} [updateData.contenido] - Nuevo contenido (opcional)
     * @param {File|null} [updateData.archivo] - Nuevo archivo (reemplaza el anterior)
     * @param {boolean} [updateData.eliminarArchivo] - True para eliminar archivo sin reemplazar
     * @returns {Promise<Object>} Publicación actualizada
     */
    async updatePublicacion(id, updateData) {
        try {
            const formData = new FormData();

            // Agregar campos solo si se proporcionan
            if (updateData.titulo !== undefined && updateData.titulo !== null) {
                formData.append('titulo', updateData.titulo);
            }

            if (updateData.contenido !== undefined && updateData.contenido !== null) {
                formData.append('contenido', updateData.contenido);
            }

            // Agregar nuevo archivo si existe
            if (updateData.archivo) {
                formData.append('archivo', updateData.archivo);
                console.log('📎 Nuevo archivo:', updateData.archivo.name);
            }

            // Flag para eliminar archivo existente sin reemplazar
            if (updateData.eliminarArchivo) {
                formData.append('eliminar_archivo', 'true');
            }

            console.log('📤 Actualizando publicación...');

            const response = await api.patch(`/publicaciones/${id}`, formData);

            console.log('✅ Publicación actualizada:', response.data);
            return response;
        } catch (error) {
            console.error('❌ Error al actualizar publicación:', error.response?.data);
            throw error;
        }
    },

    /**
     * Elimina una publicación
     * También elimina el archivo de Google Drive si existe
     * 
     * @param {number} id - ID de la publicación a eliminar
     * @returns {Promise<Object>} Mensaje de confirmación
     */
    async deletePublicacion(id) {
        try {
            console.log('🗑️ Eliminando publicación:', id);
            const response = await api.delete(`/publicaciones/${id}`);
            console.log('✅ Publicación eliminada');
            return response;
        } catch (error) {
            console.error('❌ Error al eliminar publicación:', error.response?.data);
            throw error;
        }
    }
}

