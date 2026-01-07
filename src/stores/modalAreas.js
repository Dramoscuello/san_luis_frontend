import { defineStore } from "pinia";
import { ref } from "vue";

export const useModalAreaStore = defineStore("modalArea", () => {
    const visibleModalArea = ref(false);

    function toggleModalArea() {
        visibleModalArea.value = !visibleModalArea.value;
    }

    return {
        visibleModalArea,
        toggleModalArea,
    }
})
