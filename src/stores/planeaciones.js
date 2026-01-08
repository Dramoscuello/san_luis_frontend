import { defineStore } from 'pinia';
import { ref } from 'vue';
import { planeacionesService } from '@/services/planeacionesService.js';

/**
 * ============================================
 * STORE DE PLANEACIONES
 * ============================================
 * Maneja el estado global de las planeaciones de clase
 * Soporta CRUD completo con archivos en Google Drive
 */
export const usePlaneacionesStore = defineStore('planeaciones', () => {

  // ============================================
  // ESTADO
  // ============================================

  // Lista de todas las planeaciones
  const planeaciones = ref([]);

  // Estado de carga para mostrar spinners
  const loading = ref(false);

  // Planeación actual (para crear o editar)
  const planeacion = ref({
    id: null,
    titulo: '',
    asignatura_id: null,
    archivo: null,
    nombre_archivo: '',
    drive_file_id: null
  });

  // Modo de edición
  const modoEdicion = ref(false);

  // ============================================
  // ACCIONES - LECTURA
  // ============================================

  /**
   * Obtiene todas las planeaciones (para coordinadores/rector)
   */
  const getPlaneaciones = async () => {
    loading.value = true;
    try {
      const data = await planeacionesService.getPlaneaciones();
      planeaciones.value = data;
    } catch (error) {
      console.error('Error al obtener planeaciones:', error);
      planeaciones.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Obtiene las planeaciones del docente autenticado
   */
  const getMisPlaneaciones = async () => {
    loading.value = true;
    try {
      const data = await planeacionesService.getMisPlaneaciones();
      planeaciones.value = data;
    } catch (error) {
      console.error('Error al obtener mis planeaciones:', error);
      planeaciones.value = [];
    } finally {
      loading.value = false;
    }
  };

  // ============================================
  // ACCIONES - CREAR
  // ============================================

  /**
   * Crea una nueva planeación y la agrega al inicio de la lista
   * El archivo se sube automáticamente a Google Drive
   */
  const crearPlaneacion = async () => {
    const nuevaPlaneacion = {
      titulo: planeacion.value.titulo,
      asignatura_id: planeacion.value.asignatura_id,
      archivo: planeacion.value.archivo
    };

    const { data } = await planeacionesService.createPlaneacion(nuevaPlaneacion);

    // Agregar al inicio de la lista (más reciente primero)
    planeaciones.value.unshift(data);

    resetPlaneacion();
  };

  // ============================================
  // ACCIONES - ACTUALIZAR
  // ============================================

  /**
   * Prepara una planeación para edición
   * Carga los datos en el formulario
   * @param {Object} plan - Planeación a editar
   */
  const setPlaneacionParaEditar = (plan) => {
    planeacion.value = {
      id: plan.id,
      titulo: plan.titulo,
      asignatura_id: plan.asignatura_id,
      archivo: null,
      nombre_archivo: plan.nombre_archivo_original || '',
      drive_file_id: plan.drive_file_id || null
    };
    modoEdicion.value = true;
  };

  /**
   * Actualiza una planeación existente
   *
   * @param {Object} updateData - Datos a actualizar
   */
  const actualizarPlaneacion = async (updateData = {}) => {
    if (!planeacion.value.id) {
      throw new Error('No hay planeación seleccionada para editar');
    }

    const datosActualizacion = {
      titulo: updateData.titulo ?? planeacion.value.titulo,
      asignatura_id: updateData.asignatura_id ?? planeacion.value.asignatura_id,
      archivo: updateData.archivo ?? planeacion.value.archivo
    };

    const { data } = await planeacionesService.updatePlaneacion(
      planeacion.value.id,
      datosActualizacion
    );

    // Actualizar en la lista local
    const index = planeaciones.value.findIndex(p => p.id === planeacion.value.id);
    if (index > -1) {
      planeaciones.value[index] = data;
    }

    resetPlaneacion();
  };

  // ============================================
  // ACCIONES - ELIMINAR
  // ============================================

  /**
   * Elimina una planeación
   * También elimina el archivo de Google Drive
   * @param {number} id - ID de la planeación a eliminar
   */
  const eliminarPlaneacion = async (id) => {
    await planeacionesService.deletePlaneacion(id);

    const index = planeaciones.value.findIndex(p => p.id === id);
    if (index > -1) {
      planeaciones.value.splice(index, 1);
    }
  };

  // ============================================
  // ACCIONES - UTILIDADES
  // ============================================

  /**
   * Limpia el formulario de planeación
   * Resetea todos los campos y sale del modo edición
   */
  const resetPlaneacion = () => {
    planeacion.value = {
      id: null,
      titulo: '',
      asignatura_id: null,
      archivo: null,
      nombre_archivo: '',
      drive_file_id: null
    };
    modoEdicion.value = false;
  };

  /**
   * Elimina solo el archivo de la planeación actual (en el formulario)
   */
  const limpiarArchivo = () => {
    planeacion.value.archivo = null;
    planeacion.value.nombre_archivo = '';
  };

  // ============================================
  // EXPORTS
  // ============================================

  return {
    // Estado
    planeaciones,
    planeacion,
    loading,
    modoEdicion,

    // Acciones
    getPlaneaciones,
    getMisPlaneaciones,
    crearPlaneacion,
    actualizarPlaneacion,
    eliminarPlaneacion,
    setPlaneacionParaEditar,
    resetPlaneacion,
    limpiarArchivo
  };
});
