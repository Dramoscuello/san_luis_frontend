import {defineStore} from "pinia";
import {ref, reactive} from "vue";
import {sedesService} from "@/services/sedesService.js";

export const useSedesStore = defineStore('sedes', ()=>{
    const sedes = ref([]);
    const sede = reactive({
        nombre:'',
        direccion:'',
        codigo:'',
        active:true
    })

    async function getSedes(){
        try{
            sedes.value = await sedesService.getSedes();

        }
        catch(e){
            console.error(e);
        }
    }

    async function updateEstado(obj){
        try{
            await sedesService.updateSede(obj);
            const i =  sedes.value.findIndex(item=> item.id === obj.id);

            if (i > -1){
                sedes.value[i].active = obj.active;
            }
        }catch(e){
            console.error(e);
        }
    }
    return {
        sede,
        sedes,
        getSedes,
        updateEstado
    }
});

