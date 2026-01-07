import { defineStore } from "pinia";
import { ref } from "vue";

export const useModalAssignGruposStore = defineStore("modalAssignGrupos", () => {
    const visible = ref(false);
    const selectedDocente = ref(null);

    function openModal(docente) {
        selectedDocente.value = docente;
        visible.value = true;
    }

    function closeModal() {
        visible.value = false;
        selectedDocente.value = null;
    }

    return {
        visible,
        selectedDocente,
        openModal,
        closeModal
    };
});
