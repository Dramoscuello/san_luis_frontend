import { defineStore } from "pinia";
import { ref } from "vue";

export const useModalPeriodosStore = defineStore('modalPeriodos', () => {
    const visibleModalPeriodo = ref(false);

    function toggleModalPeriodo() {
        visibleModalPeriodo.value = !visibleModalPeriodo.value;
    }

    return {
        visibleModalPeriodo,
        toggleModalPeriodo
    }
});
