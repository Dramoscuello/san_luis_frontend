import { defineStore } from "pinia";
import { ref } from "vue";

export const useModalGrupoStore = defineStore('modalGrupos', () => {
    const visibleModalGrupo = ref(false);

    function toggleModalGrupo() {
        visibleModalGrupo.value = !visibleModalGrupo.value;
    }

    return {
        visibleModalGrupo,
        toggleModalGrupo
    }
});
