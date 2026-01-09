import { defineStore } from 'pinia';
import { ref } from 'vue';
import { observadoresService } from '@/services/observadoresService.js';

export const useObservadoresStore = defineStore('observadores', () => {
    // Cache map: estudianteId -> observacionData
    const observacionesCache = ref({});

    // Fetch observation from cache or API
    async function getObservacion(estudianteId) {
        if (observacionesCache.value[estudianteId]) {
            return observacionesCache.value[estudianteId];
        }

        try {
            // The service returns a list or a single object? 
            // The user request says: "Respuesta: Lista de observaciones (generalmente 0 o 1...)"
            const response = await observadoresService.getObservacionActual(estudianteId);

            // If it's a list, we probably want the first one or null if empty
            let data = null;
            if (Array.isArray(response) && response.length > 0) {
                data = response[0];
            } else if (!Array.isArray(response) && response) {
                data = response; // Just in case backend returns single object
            }

            // Even if empty, we might want to cache "null" to avoid re-fetching empty data? 
            // For now let's cache what we found.
            observacionesCache.value[estudianteId] = data;
            return data;
        } catch (error) {
            throw error;
        }
    }

    async function saveObservacion(observacionData) {
        try {
            let response;
            if (observacionData.id) {
                // Editing existing observation
                const { id, estudiante_id, ...dataToUpdate } = observacionData;
                response = await observadoresService.updateObservacion(id, dataToUpdate);
                // Update cache with the updated observation
                observacionesCache.value[estudiante_id] = response;
            } else {
                // Creating new observation
                response = await observadoresService.createObservacion(observacionData);
                // Update cache with the new observation
                observacionesCache.value[observacionData.estudiante_id] = response;
            }
            return response;
        } catch (error) {
            throw error;
        }
    }

    function clearCache() {
        observacionesCache.value = {};
    }

    return {
        observacionesCache,
        getObservacion,
        saveObservacion,
        clearCache
    };
});
