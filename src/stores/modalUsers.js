import { defineStore } from "pinia";
import { ref } from "vue";
import { useSedesStore } from "@/stores/sedes.js";


export const useModalUserStore = defineStore("modalUser", () => {
    const visibleModalUser = ref(false);
    const isDirectivoMode = ref(false);
    const isDocenteMode = ref(false); // Nuevo estado
    const stateSedes = useSedesStore();

    function toggleModalUser() {
        visibleModalUser.value = !visibleModalUser.value;
        if (!visibleModalUser.value) {
            stateSedes.clearSelectedSedes();
            isDirectivoMode.value = false;
            isDocenteMode.value = false; // Resetear
        }
    }

    function setDirectivoMode(value) {
        isDirectivoMode.value = value;
        if (value) isDocenteMode.value = false;
    }

    function setDocenteMode(value) {
        isDocenteMode.value = value;
        if (value) isDirectivoMode.value = false;
    }

    return {
        visibleModalUser,
        isDirectivoMode,
        isDocenteMode,
        toggleModalUser,
        setDirectivoMode,
        setDocenteMode
    }
})