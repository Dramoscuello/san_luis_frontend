import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { areasService } from "@/services/areasService.js";

export const useAreasStore = defineStore('areas', () => {
    const areas = ref([]);
    const area = reactive({
        id: null,
        nombre: '',
        activa: true
    });

    async function getAreas() {
        try {
            areas.value = await areasService.getAreas();
        } catch (e) {
            console.error(e);
        }
    }

    async function updateEstado(obj) {
        try {
            await areasService.updateArea(obj);
            const i = areas.value.findIndex(item => item.id === obj.id);

            if (i > -1) {
                areas.value[i].activa = obj.activa;
            }
        } catch (e) {
            throw e;
        }
    }

    async function updateArea() {
        try {
            await areasService.updateArea(area);
            const i = areas.value.findIndex(item => item.id === area.id);

            if (i > -1) {
                areas.value[i].nombre = area.nombre;
                areas.value[i].activa = area.activa;
            }
        } catch (e) {
            throw e;
        }
    }

    async function deleteArea(area_id) {
        try {
            await areasService.deleteArea(area_id);
            const i = areas.value.findIndex(item => item.id === area_id);

            if (i > -1) {
                areas.value.splice(i, 1);
            }
        } catch (e) {
            throw e;
        }
    }

    async function crearArea() {
        try {
            const { data } = await areasService.createArea(area);
            areas.value.push(data);
        } catch (e) {
            throw e;
        }
    }

    return {
        area,
        areas,
        getAreas,
        updateEstado,
        updateArea,
        deleteArea,
        crearArea
    }
});
