import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { planeacionesDestacadasService } from '@/services/planeacionesDestacadasService.js';

/**
 * ============================================
 * STORE DE PLANEACIONES DESTACADAS
 * ============================================
 * Maneja el estado global de las planeaciones marcadas como destacadas
 */
export const usePlaneacionesDestacadasStore = defineStore('planeacionesDestacadas', () => {

  // ============================================
  // ESTADO
  // ============================================

  // Lista de planeaciones destacadas
  const destacadas = ref([]);

  // Estado de carga
  const loading = ref(false);

  // ============================================
  // GETTERS
  // ============================================

  /**
   * Set de IDs de planeaciones destacadas para busqueda rapida O(1)
   */
  const destacadasIds = computed(() => {
    return new Set(destacadas.value.map(d => d.planeacion_id));
  });

  /**
   * Verifica si una planeacion esta destacada
   * @param {number} planeacionId - ID de la planeacion
   * @returns {boolean}
   */
  const esDestacada = (planeacionId) => {
    return destacadasIds.value.has(planeacionId);
  };

  /**
   * Obtiene el registro de destacada por planeacion_id
   * @param {number} planeacionId - ID de la planeacion
   * @returns {Object|undefined}
   */
  const getDestacadaPorPlaneacionId = (planeacionId) => {
    return destacadas.value.find(d => d.planeacion_id === planeacionId);
  };

  // ============================================
  // ACCIONES
  // ============================================

  /**
   * Obtiene todas las planeaciones destacadas del backend
   */
  const getPlaneacionesDestacadas = async () => {
    loading.value = true;
    try {
      const data = await planeacionesDestacadasService.getPlaneacionesDestacadas();
      destacadas.value = data;
    } catch (error) {
      console.error('Error al obtener planeaciones destacadas:', error);
      destacadas.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * Marca una planeacion como destacada
   * @param {number} planeacionId - ID de la planeacion
   * @param {string} razon - Razon por la cual se destaca
   * @returns {Promise<Object>} La planeacion destacada creada
   */
  const marcarComoDestacada = async (planeacionId, razon) => {
    const data = await planeacionesDestacadasService.marcarDestacada(planeacionId, razon);
    // Agregar al store local
    destacadas.value.push(data);
    return data;
  };

  /**
   * Elimina una planeacion de destacadas por planeacion_id
   * @param {number} planeacionId - ID de la planeacion
   */
  const eliminarDestacada = async (planeacionId) => {
    const destacada = getDestacadaPorPlaneacionId(planeacionId);
    if (!destacada) return;

    await planeacionesDestacadasService.eliminarDestacada(destacada.id);

    // Eliminar del store local
    const index = destacadas.value.findIndex(d => d.id === destacada.id);
    if (index > -1) {
      destacadas.value.splice(index, 1);
    }
  };

  /**
   * Elimina una planeacion de destacadas por su ID de destacada
   * @param {number} destacadaId - ID del registro de destacada
   */
  const eliminarDestacadaPorId = async (destacadaId) => {
    await planeacionesDestacadasService.eliminarDestacada(destacadaId);

    // Eliminar del store local
    const index = destacadas.value.findIndex(d => d.id === destacadaId);
    if (index > -1) {
      destacadas.value.splice(index, 1);
    }
  };

  /**
   * Actualiza la razon de una planeacion destacada
   * @param {number} destacadaId - ID del registro de destacada
   * @param {string} nuevaRazon - Nueva razon del destacado
   */
  const actualizarRazon = async (destacadaId, nuevaRazon) => {
    const data = await planeacionesDestacadasService.actualizarDestacada(destacadaId, {
      razon: nuevaRazon
    });

    // Actualizar en el store local
    const index = destacadas.value.findIndex(d => d.id === destacadaId);
    if (index > -1) {
      destacadas.value[index].razon = nuevaRazon;
    }

    return data;
  };

  /**
   * Incrementa las visualizaciones de una planeacion destacada
   * @param {number} destacadaId - ID del registro de destacada
   */
  const incrementarVisualizaciones = async (destacadaId) => {
    const data = await planeacionesDestacadasService.incrementarVisualizaciones(destacadaId);

    // Actualizar en el store local con el valor retornado por la API
    const index = destacadas.value.findIndex(d => d.id === destacadaId);
    if (index > -1 && data.visualizaciones !== undefined) {
      destacadas.value[index].visualizaciones = data.visualizaciones;
    }

    return data;
  };

  // ============================================
  // EXPORTS
  // ============================================

  return {
    // Estado
    destacadas,
    loading,

    // Getters
    destacadasIds,
    esDestacada,
    getDestacadaPorPlaneacionId,

    // Acciones
    getPlaneacionesDestacadas,
    marcarComoDestacada,
    eliminarDestacada,
    eliminarDestacadaPorId,
    actualizarRazon,
    incrementarVisualizaciones
  };
});
