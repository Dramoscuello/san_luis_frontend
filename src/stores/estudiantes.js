import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { estudiantesService } from "@/services/estudiantesService.js";

export const useEstudiantesStore = defineStore('estudiantes', () => {
    const estudiantes = ref([]);
    const estudiante = reactive({
        id: null,
        numero_documento: '',
        nombres: '',
        apellidos: '',
        grupo_id: null
    });

    async function getEstudiantesByGrupo(grupoId) {
        try {
            estudiantes.value = await estudiantesService.getEstudiantesByGrupo(grupoId);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    async function updateEstudiante() {
        try {
            await estudiantesService.updateEstudiante({
                id: estudiante.id,
                numero_documento: estudiante.numero_documento,
                nombres: estudiante.nombres,
                apellidos: estudiante.apellidos,
                grupo_id: estudiante.grupo_id
            });
            const i = estudiantes.value.findIndex(item => item.id === estudiante.id);

            if (i > -1) {
                estudiantes.value[i].numero_documento = estudiante.numero_documento;
                estudiantes.value[i].nombres = estudiante.nombres;
                estudiantes.value[i].apellidos = estudiante.apellidos;
            }
        } catch (e) {
            throw e;
        }
    }

    async function deleteEstudiante(estudianteId) {
        try {
            await estudiantesService.deleteEstudiante(estudianteId);
            const i = estudiantes.value.findIndex(item => item.id === estudianteId);

            if (i > -1) {
                estudiantes.value.splice(i, 1);
            }
        } catch (e) {
            throw e;
        }
    }

    async function crearEstudiante() {
        try {
            const { data } = await estudiantesService.createEstudiante({
                numero_documento: estudiante.numero_documento,
                nombres: estudiante.nombres,
                apellidos: estudiante.apellidos,
                grupo_id: estudiante.grupo_id
            });
            estudiantes.value.push(data);
        } catch (e) {
            throw e;
        }
    }

    function clearEstudiante() {
        estudiante.id = null;
        estudiante.numero_documento = '';
        estudiante.nombres = '';
        estudiante.apellidos = '';
        estudiante.grupo_id = null;
    }

    function clearEstudiantes() {
        estudiantes.value = [];
    }

    return {
        estudiante,
        estudiantes,
        getEstudiantesByGrupo,
        updateEstudiante,
        deleteEstudiante,
        crearEstudiante,
        clearEstudiante,
        clearEstudiantes
    }
});
