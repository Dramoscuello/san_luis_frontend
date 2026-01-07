import { defineStore } from "pinia";
import { ref, reactive } from "vue";

export const useModalAsignaturaStore = defineStore("modalAsignatura", () => {
    const visibleModalAsignatura = ref(false);

    // Guardar el estado del filtro antes de abrir el modal
    const savedFilter = reactive({
        id: null,
        nombre: null
    });

    // Callback para ejecutar después de guardar
    let onSaveCallback = null;

    function toggleModalAsignatura() {
        visibleModalAsignatura.value = !visibleModalAsignatura.value;
    }

    function saveFilter(id, nombre) {
        savedFilter.id = id;
        savedFilter.nombre = nombre;
    }

    function setOnSaveCallback(callback) {
        onSaveCallback = callback;
    }

    function executeOnSaveCallback() {
        if (onSaveCallback) {
            onSaveCallback();
        }
    }

    return {
        visibleModalAsignatura,
        savedFilter,
        toggleModalAsignatura,
        saveFilter,
        setOnSaveCallback,
        executeOnSaveCallback
    }
})
