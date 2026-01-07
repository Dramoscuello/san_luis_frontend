import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { gruposService } from "@/services/gruposService.js";

export const useGruposStore = defineStore('grupos', () => {
    const grupos = ref([]);
    const grupo = reactive({
        id: null,
        nombre: '',
        grado_id: null
    });

    async function getGruposByGrado(gradoId) {
        try {
            grupos.value = await gruposService.getGruposByGrado(gradoId);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    async function updateGrupo() {
        try {
            await gruposService.updateGrupo({
                id: grupo.id,
                nombre: grupo.nombre,
                grado_id: grupo.grado_id
            });
            const i = grupos.value.findIndex(item => item.id === grupo.id);

            if (i > -1) {
                grupos.value[i].nombre = grupo.nombre;
            }
        } catch (e) {
            throw e;
        }
    }

    async function deleteGrupo(grupoId) {
        try {
            await gruposService.deleteGrupo(grupoId);
            const i = grupos.value.findIndex(item => item.id === grupoId);

            if (i > -1) {
                grupos.value.splice(i, 1);
            }
        } catch (e) {
            throw e;
        }
    }

    async function crearGrupo() {
        try {
            const { data } = await gruposService.createGrupo({
                nombre: grupo.nombre,
                grado_id: grupo.grado_id
            });
            grupos.value.push(data);
        } catch (e) {
            throw e;
        }
    }

    function clearGrupo() {
        grupo.id = null;
        grupo.nombre = '';
        grupo.grado_id = null;
    }

    function clearGrupos() {
        grupos.value = [];
    }

    return {
        grupo,
        grupos,
        getGruposByGrado,
        updateGrupo,
        deleteGrupo,
        crearGrupo,
        clearGrupo,
        clearGrupos
    }
});
