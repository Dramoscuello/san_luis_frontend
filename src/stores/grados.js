import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { gradosService } from "@/services/gradosService.js";

export const useGradosStore = defineStore('grados', () => {
    const grados = ref([]);
    const grado = reactive({
        id: null,
        nombre: '',
        sede_id: null
    });

    const selectedGrado = reactive({
        id: null,
        nombre: null
    });

    async function getGradosBySede(sedeId) {
        try {
            grados.value = await gradosService.getGradosBySede(sedeId);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    async function updateGrado() {
        try {
            await gradosService.updateGrado({
                id: grado.id,
                nombre: grado.nombre,
                sede_id: grado.sede_id
            });
            const i = grados.value.findIndex(item => item.id === grado.id);

            if (i > -1) {
                grados.value[i].nombre = grado.nombre;
            }
        } catch (e) {
            throw e;
        }
    }

    async function deleteGrado(gradoId) {
        try {
            await gradosService.deleteGrado(gradoId);
            const i = grados.value.findIndex(item => item.id === gradoId);

            if (i > -1) {
                grados.value.splice(i, 1);
            }
        } catch (e) {
            throw e;
        }
    }

    async function crearGrado() {
        try {
            const { data } = await gradosService.createGrado({
                nombre: grado.nombre,
                sede_id: grado.sede_id
            });
            grados.value.push(data);
        } catch (e) {
            throw e;
        }
    }

    function clearGrado() {
        grado.id = null;
        grado.nombre = '';
        grado.sede_id = null;
    }

    function clearSelectedGrado() {
        selectedGrado.id = null;
        selectedGrado.nombre = null;
    }

    function clearGrados() {
        grados.value = [];
    }

    return {
        grado,
        grados,
        selectedGrado,
        getGradosBySede,
        updateGrado,
        deleteGrado,
        crearGrado,
        clearGrado,
        clearSelectedGrado,
        clearGrados
    }
});
