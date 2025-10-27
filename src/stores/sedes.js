import {defineStore} from "pinia";
import {ref, reactive} from "vue";
import {sedesService} from "@/services/sedesService.js";

export const useSedesStore = defineStore('sedes', ()=>{
    const sedes = ref([]);
    const sede = reactive({
        id:null,
        nombre:'',
        direccion:'',
        codigo:'',
        active: null
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
            throw e;
        }
    }

    async function updateSede(){
        try{
            await sedesService.updateSede(sede);
            const i =  sedes.value.findIndex(item=> item.id === sede.id);

            if (i > -1){
                sedes.value[i].active = sede.active;
                sedes.value[i].nombre = sede.nombre;
                sedes.value[i].codigo = sede.codigo;
                sedes.value[i].direccion = sede.direccion;
            }
        }catch(e){
            throw e;
        }
    }

    async function deleteSede(sede_id){
        try{
            await sedesService.deleteSede(sede_id);
            const i =  sedes.value.findIndex(item=> item.id === sede_id);

            if (i > -1){
                sedes.value.splice(i, 1);
            }
        }catch(e){
            throw e;
        }
    }

    return {
        sede,
        sedes,
        getSedes,
        updateEstado,
        updateSede,
        deleteSede,
    }
});

