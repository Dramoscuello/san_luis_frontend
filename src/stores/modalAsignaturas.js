import { defineStore } from "pinia";
import { ref, reactive } from "vue";

export const useModalAsignaturaStore = defineStore("modalAsignatura", () => {
    const visibleModalAsignatura = ref(false);

    // Guardar el estado del filtro antes de abrir el modal
    const savedFilter = reactive({
        id: null,
        nombre: null
    });

    function toggleModalAsignatura() {
        visibleModalAsignatura.value = !visibleModalAsignatura.value;
    }

    function saveFilter(id, nombre) {
        savedFilter.id = id;
        savedFilter.nombre = nombre;
    }

    return {
        visibleModalAsignatura,
        savedFilter,
        toggleModalAsignatura,
        saveFilter,
    }
})
