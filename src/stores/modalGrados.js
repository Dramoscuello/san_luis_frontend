import { defineStore } from "pinia";
import { ref } from "vue";

export const useModalGradoStore = defineStore('modalGrados', () => {
    const visibleModalGrado = ref(false);

    function toggleModalGrado() {
        visibleModalGrado.value = !visibleModalGrado.value;
    }

    return {
        visibleModalGrado,
        toggleModalGrado
    }
});
