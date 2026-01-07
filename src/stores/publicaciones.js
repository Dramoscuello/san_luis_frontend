import { defineStore } from 'pinia';
import { ref } from 'vue';
import { publicacionesService } from '@/services/publicacionesService.js';

/**
 * ============================================
 * STORE DE PUBLICACIONES
 * ============================================
 * Maneja el estado global de las publicaciones institucionales
 * Soporta CRUD completo con archivos en Google Drive
 */
export const usePublicacionesStore = defineStore('publicaciones', () => {

  // ============================================
  // ESTADO
  // ============================================

  // Lista de todas las publicaciones
  const publicaciones = ref([]);

  // Estado de carga para mostrar spinners
  const loading = ref(false);

  // Publicación actual (para crear o editar)
  const publicacion = ref({
    id: null,
    titulo: '',
    contenido: '',
    archivo: null,           // File object para subir
    nombre_archivo: '',      // Nombre del archivo actual (si existe)
    drive_file_id: null      // ID del archivo en Drive (si existe)
  });

  // Modo de edición
  const modoEdicion = ref(false);

  // ============================================
  // ACCIONES - LECTURA
  // ============================================

  /**
   * Obtiene todas las publicaciones desde el backend
   * Las ordena por fecha (más reciente primero)
   */
  const getPublicaciones = async () => {
    loading.value = true;
    try {
      const data = await publicacionesService.getPublicaciones();
      publicaciones.value = data;
    } catch (error) {
      console.error('Error al obtener publicaciones:', error);
      publicaciones.value = [];
    } finally {
      loading.value = false;
    }
  };

  // ============================================
  // ACCIONES - CREAR
  // ============================================

  /**
   * Crea una nueva publicación y la agrega al inicio de la lista
   * El archivo se sube automáticamente a Google Drive
   */
  const crearPublicacion = async () => {
    const nuevaPublicacion = {
      titulo: publicacion.value.titulo,
      contenido: publicacion.value.contenido,
      archivo: publicacion.value.archivo
    };

    const { data } = await publicacionesService.createPublicacion(nuevaPublicacion);

    // Agregar al inicio de la lista (más reciente primero)
    publicaciones.value.unshift(data);

    resetPublicacion();
  };

  // ============================================
  // ACCIONES - ACTUALIZAR
  // ============================================

  /**
   * Prepara una publicación para edición
   * Carga los datos en el formulario
   * @param {Object} pub - Publicación a editar
   */
  const setPublicacionParaEditar = (pub) => {
    publicacion.value = {
      id: pub.id,
      titulo: pub.titulo,
      contenido: pub.contenido,
      archivo: null,  // El archivo nuevo se selecciona aparte
      nombre_archivo: pub.nombre_archivo_original || '',
      drive_file_id: pub.drive_file_id || null
    };
    modoEdicion.value = true;
  };

  /**
   * Actualiza una publicación existente
   * Soporta:
   * - Actualizar título y/o contenido
   * - Subir nuevo archivo (reemplaza el anterior)
   * - Eliminar archivo existente
   * 
   * @param {Object} updateData - Datos a actualizar
   * @param {string} [updateData.titulo] - Nuevo título
   * @param {string} [updateData.contenido] - Nuevo contenido
   * @param {File} [updateData.archivo] - Nuevo archivo
   * @param {boolean} [updateData.eliminarArchivo] - Eliminar archivo actual
   */
  const actualizarPublicacion = async (updateData = {}) => {
    if (!publicacion.value.id) {
      throw new Error('No hay publicación seleccionada para editar');
    }

    // Usar datos del store si no se proporcionan
    const datosActualizacion = {
      titulo: updateData.titulo ?? publicacion.value.titulo,
      contenido: updateData.contenido ?? publicacion.value.contenido,
      archivo: updateData.archivo ?? publicacion.value.archivo,
      eliminarArchivo: updateData.eliminarArchivo ?? false
    };

    const { data } = await publicacionesService.updatePublicacion(
      publicacion.value.id,
      datosActualizacion
    );

    // Actualizar en la lista local
    const index = publicaciones.value.findIndex(p => p.id === publicacion.value.id);
    if (index > -1) {
      publicaciones.value[index] = data;
    }

    resetPublicacion();
  };

  // ============================================
  // ACCIONES - ELIMINAR
  // ============================================

  /**
   * Elimina una publicación
   * También elimina el archivo de Google Drive si existe
   * @param {number} id - ID de la publicación a eliminar
   */
  const eliminarPublicacion = async (id) => {
    await publicacionesService.deletePublicacion(id);

    const index = publicaciones.value.findIndex(p => p.id === id);
    if (index > -1) {
      publicaciones.value.splice(index, 1);
    }
  };

  // ============================================
  // ACCIONES - UTILIDADES
  // ============================================

  /**
   * Limpia el formulario de publicación
   * Resetea todos los campos y sale del modo edición
   */
  const resetPublicacion = () => {
    publicacion.value = {
      id: null,
      titulo: '',
      contenido: '',
      archivo: null,
      nombre_archivo: '',
      drive_file_id: null
    };
    modoEdicion.value = false;
  };

  /**
   * Elimina solo el archivo de la publicación actual (en el formulario)
   * Útil cuando el usuario quiere quitar el archivo sin subir uno nuevo
   */
  const limpiarArchivo = () => {
    publicacion.value.archivo = null;
    publicacion.value.nombre_archivo = '';
  };

  // ============================================
  // EXPORTS
  // ============================================

  return {
    // Estado
    publicaciones,
    publicacion,
    loading,
    modoEdicion,

    // Acciones
    getPublicaciones,
    crearPublicacion,
    actualizarPublicacion,
    eliminarPublicacion,
    setPublicacionParaEditar,
    resetPublicacion,
    limpiarArchivo
  };
});

