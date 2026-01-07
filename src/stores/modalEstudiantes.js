import { defineStore } from "pinia";
import { ref } from "vue";

export const useModalEstudianteStore = defineStore('modalEstudiantes', () => {
    const visibleModalEstudiante = ref(false);

    function toggleModalEstudiante() {
        visibleModalEstudiante.value = !visibleModalEstudiante.value;
    }

    return {
        visibleModalEstudiante,
        toggleModalEstudiante
    }
});
