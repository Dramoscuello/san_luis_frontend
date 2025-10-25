import {defineStore} from "pinia";
import {ref, reactive} from "vue";
import {sedesService} from "@/services/sedesService.js";

export const useSedesStore = defineStore('sedes', ()=>{
    const sedes = ref([]);

    async function getSedes(){
        try{
            const respuesta = await sedesService.getSedes();
            sedes.value = respuesta;

        }
        catch(e){
            console.error(e);
        }
    }
    return {
        sedes,
        getSedes
    }
});

