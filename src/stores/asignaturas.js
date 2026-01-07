import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { asignaturasService } from "@/services/asignaturasService.js";

export const useAsignaturasStore = defineStore('asignaturas', () => {
    const asignaturas = ref([]);
    const asignatura = reactive({
        id: null,
        nombre: '',
        descripcion: '',
        area_id: null,
        grados: '',
        activa: true
    });

    async function getAsignaturas() {
        try {
            asignaturas.value = await asignaturasService.getAsignaturas();
        } catch (e) {
            console.error(e);
        }
    }

    async function getAsignaturasByArea(areaId) {
        try {
            asignaturas.value = await asignaturasService.getAsignaturasByArea(areaId);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    function clearAsignaturas() {
        asignaturas.value = [];
    }

    async function updateEstado(obj) {
        try {
            await asignaturasService.updateAsignatura(obj);
            const i = asignaturas.value.findIndex(item => item.id === obj.id);

            if (i > -1) {
                asignaturas.value[i].activa = obj.activa;
            }
        } catch (e) {
            throw e;
        }
    }

    async function updateAsignatura() {
        try {
            await asignaturasService.updateAsignatura(asignatura);
            const i = asignaturas.value.findIndex(item => item.id === asignatura.id);

            if (i > -1) {
                asignaturas.value[i].nombre = asignatura.nombre;
                asignaturas.value[i].descripcion = asignatura.descripcion;
                asignaturas.value[i].area_id = asignatura.area_id;
                asignaturas.value[i].grados = asignatura.grados;
                asignaturas.value[i].activa = asignatura.activa;
            }
        } catch (e) {
            throw e;
        }
    }

    async function deleteAsignatura(asignatura_id) {
        try {
            await asignaturasService.deleteAsignatura(asignatura_id);
            const i = asignaturas.value.findIndex(item => item.id === asignatura_id);

            if (i > -1) {
                asignaturas.value.splice(i, 1);
            }
        } catch (e) {
            throw e;
        }
    }

    async function crearAsignatura() {
        try {
            const { data } = await asignaturasService.createAsignatura(asignatura);
            asignaturas.value.push(data);
            return data;
        } catch (e) {
            throw e;
        }
    }

    function resetAsignatura() {
        asignatura.id = null;
        asignatura.nombre = '';
        asignatura.descripcion = '';
        asignatura.area_id = null;
        asignatura.grados = '';
        asignatura.activa = true;
    }

    return {
        asignatura,
        asignaturas,
        getAsignaturas,
        getAsignaturasByArea,
        clearAsignaturas,
        updateEstado,
        updateAsignatura,
        deleteAsignatura,
        crearAsignatura,
        resetAsignatura
    }
});
