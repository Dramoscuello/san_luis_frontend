import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { periodosService } from "@/services/periodosService.js";

export const usePeriodosStore = defineStore('periodos', () => {
    const periodos = ref([]);
    const periodoActivo = ref(null);
    const periodo = reactive({
        id: null,
        nombre: '',
        fecha_inicio: null,
        fecha_fin: null,
        activo: false
    });

    async function getPeriodos() {
        try {
            periodos.value = await periodosService.getPeriodos();
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    async function getPeriodoActivo() {
        try {
            periodoActivo.value = await periodosService.getPeriodoActivo();
        } catch (e) {
            console.error(e);
        }
    }

    async function updatePeriodo(periodoId, data) {
        try {
            await periodosService.updatePeriodo(periodoId, data);
            const i = periodos.value.findIndex(item => item.id === periodoId);
            if (i > -1) {
                if (data.fecha_inicio !== undefined) {
                    periodos.value[i].fecha_inicio = data.fecha_inicio;
                }
                if (data.fecha_fin !== undefined) {
                    periodos.value[i].fecha_fin = data.fecha_fin;
                }
                if (data.activo !== undefined) {
                    periodos.value[i].activo = data.activo;
                }
            }
        } catch (e) {
            throw e;
        }
    }

    async function toggleEstado(periodoId, nuevoEstado) {
        try {
            await periodosService.updatePeriodo(periodoId, { activo: nuevoEstado });
            const i = periodos.value.findIndex(item => item.id === periodoId);
            if (i > -1) {
                periodos.value[i].activo = nuevoEstado;
            }
        } catch (e) {
            throw e;
        }
    }

    // Convertir string a Date para el DatePicker
    function parseDate(dateString) {
        if (!dateString) return null;
        if (dateString instanceof Date) return dateString;
        // Agregar T00:00:00 para evitar problemas de timezone
        return new Date(dateString + 'T00:00:00');
    }

    function setPeriodo(data) {
        periodo.id = data.id;
        periodo.nombre = data.nombre;
        periodo.fecha_inicio = parseDate(data.fecha_inicio);
        periodo.fecha_fin = parseDate(data.fecha_fin);
        periodo.activo = data.activo;
    }

    function clearPeriodo() {
        periodo.id = null;
        periodo.nombre = '';
        periodo.fecha_inicio = null;
        periodo.fecha_fin = null;
        periodo.activo = false;
    }

    return {
        periodos,
        periodoActivo,
        periodo,
        getPeriodos,
        getPeriodoActivo,
        updatePeriodo,
        toggleEstado,
        setPeriodo,
        clearPeriodo
    }
});
