<script setup>
import Select from "primevue/select";
import { useAreasStore } from "@/stores/areas.js";
import { useModalAsignaturaStore } from "@/stores/modalAsignaturas.js";
import { useAsignaturasStore } from "@/stores/asignaturas.js";
import { computed } from 'vue';

const stateAreas = useAreasStore();
const storeModalAsignatura = useModalAsignaturaStore();
const asignaturaStore = useAsignaturasStore();

const selectedAreaId = computed({
    get: () => stateAreas.selectedArea?.id,
    set: (val) => {
        if (stateAreas.selectedArea) {
            stateAreas.selectedArea.id = val;
        }
    }
});

const areasConTodas = computed(() => {
    if (storeModalAsignatura.visibleModalAsignatura) {
        return stateAreas.areas;
    } else {
        return [{ id: null, nombre: 'Todas las áreas' }, ...stateAreas.areas];
    }
});

const changeOptionArea = (event) => {
    const areaSeleccionada = stateAreas.areas.find(area => area.id === event.value);
    if (areaSeleccionada) {
        stateAreas.selectedArea.id = areaSeleccionada.id;
        stateAreas.selectedArea.nombre = areaSeleccionada.nombre;
        if (storeModalAsignatura.visibleModalAsignatura) {
            asignaturaStore.asignatura.area_id = areaSeleccionada.id;
            asignaturaStore.asignatura.area_nombre = areaSeleccionada.nombre;
        }
    } else {
        stateAreas.selectedArea.id = null;
        stateAreas.selectedArea.nombre = null;
    }
}
</script>

<template>
    <Select
        v-model="selectedAreaId"
        :options="areasConTodas"
        optionLabel="nombre"
        optionValue="id"
        placeholder="Seleccione un área"
        class="w-64"
        @change="changeOptionArea"
    />
</template>

<style scoped>

</style>
