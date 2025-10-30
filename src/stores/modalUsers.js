import {defineStore} from "pinia";
import {ref} from "vue";
import {useSedesStore} from "@/stores/sedes.js";


export const useModalUserStore = defineStore("modalUser", () => {
    const visibleModalUser = ref(false);
    const stateSedes = useSedesStore();

    function toggleModalUser() {
        visibleModalUser.value = !visibleModalUser.value;
        if (!visibleModalUser.value) {
            stateSedes.clearSelectedSedes();
        }
    }


    return {
        visibleModalUser,
        toggleModalUser,
    }
})