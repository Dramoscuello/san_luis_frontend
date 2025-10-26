import {defineStore} from "pinia";
import {ref} from "vue";


export const useModalSedeStore = defineStore("modalSede", () => {
    const visibleModalSede = ref(false);

    function toggleModalSede() {
        visibleModalSede.value = !visibleModalSede.value;
        console.log(visibleModalSede.value);
    }


    return {
        visibleModalSede,
        toggleModalSede,
    }
})