<script setup>
import { ref, watch } from 'vue';
import { useModalAsignaturaStore } from "@/stores/modalAsignaturas.js";
import { useAsignaturasStore } from "@/stores/asignaturas.js";
import { useAreasStore } from "@/stores/areas.js";
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import SelectAreas from "@/components/SelectAreas.vue";
import { useToast } from "primevue/usetoast";

const store = useModalAsignaturaStore();
const asignaturaStore = useAsignaturasStore();
const areasStore = useAreasStore();
const toast = useToast();

// Lista de grados disponibles (1 al 11)
const gradosDisponibles = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

// Grados seleccionados (array de números)
const selectedGrados = ref([]);

// Sincronizar selectedGrados cuando se abre el modal
watch(() => store.visibleModalAsignatura, (visible) => {
    if (visible) {
        // Convertir string a array cuando se abre el modal
        const gradosStr = asignaturaStore.asignatura.grados || '';
        if (gradosStr) {
            selectedGrados.value = gradosStr.split(',').map(g => parseInt(g.trim())).filter(g => !isNaN(g));
        } else {
            selectedGrados.value = [];
        }
    }
});

// Toggle selección de grado
const toggleGrado = (grado) => {
    const index = selectedGrados.value.indexOf(grado);
    if (index > -1) {
        selectedGrados.value.splice(index, 1);
    } else {
        selectedGrados.value.push(grado);
    }
    // Ordenar para mantener consistencia
    selectedGrados.value.sort((a, b) => a - b);
};

// Verificar si un grado está seleccionado
const isGradoSelected = (grado) => {
    return selectedGrados.value.includes(grado);
};

// Restaurar el filtro original al cerrar el modal
const restoreFilter = () => {
    areasStore.selectedArea.id = store.savedFilter.id;
    areasStore.selectedArea.nombre = store.savedFilter.nombre;
}

const closeModal = () => {
    store.visibleModalAsignatura = false;
    // El filtro se restaura en el evento @hide
}

const HandleSubmit = () => {
    // Validar que se haya seleccionado un área
    if (!areasStore.selectedArea.id) {
        toast.add({ severity: 'warn', summary: 'Atención', detail: 'Debe seleccionar un área', life: 3000 });
        return;
    }

    // Asignar el area_id antes de guardar
    asignaturaStore.asignatura.area_id = areasStore.selectedArea.id;

    // Convertir array de grados a string separado por comas
    asignaturaStore.asignatura.grados = selectedGrados.value.join(',');

    if (asignaturaStore.asignatura.id) {
        actualizarAsignatura();
    } else {
        crearAsignatura();
    }
}

const crearAsignatura = async () => {
    try {
        const data = await asignaturaStore.crearAsignatura();
        // Agregar el objeto área y grados al registro para mostrar en la tabla
        const i = asignaturaStore.asignaturas.findIndex(item => item.id === data.id);
        if (i > -1) {
            asignaturaStore.asignaturas[i].area = {
                id: areasStore.selectedArea.id,
                nombre: areasStore.selectedArea.nombre
            };
            asignaturaStore.asignaturas[i].grados = selectedGrados.value.join(',');
        }
        toast.add({ severity: 'info', summary: 'OK', detail: '¡Asignatura creada!', life: 3000 });
        closeModal();
    } catch (err) {
        console.log(err);
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.detail || 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}

const actualizarAsignatura = async () => {
    try {
        await asignaturaStore.updateAsignatura();
        // Actualizar el objeto área y grados en la tabla
        const i = asignaturaStore.asignaturas.findIndex(item => item.id === asignaturaStore.asignatura.id);
        if (i > -1) {
            asignaturaStore.asignaturas[i].area = {
                id: areasStore.selectedArea.id,
                nombre: areasStore.selectedArea.nombre
            };
            asignaturaStore.asignaturas[i].area_id = areasStore.selectedArea.id;
            asignaturaStore.asignaturas[i].grados = selectedGrados.value.join(',');
        }
        toast.add({ severity: 'info', summary: 'OK', detail: '¡Asignatura actualizada!', life: 3000 });
        closeModal();
    } catch (err) {
        console.log(err);
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.detail || 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}
</script>

<template>
    <Dialog
        v-model:visible="store.visibleModalAsignatura"
        modal
        header="Asignatura"
        :style="{ width: '30rem' }"
        @hide="restoreFilter"
    >
        <form @submit.prevent="HandleSubmit">
            <div class="flex items-center gap-4 mb-4">
                <label for="nombre" class="font-semibold w-24">Nombre</label>
                <InputText id="nombre" v-model="asignaturaStore.asignatura.nombre" name="nombre" class="flex-auto" autocomplete="off" required />
            </div>
            <div class="flex items-center gap-4 mb-4">
                <label for="descripcion" class="font-semibold w-24">Descripción</label>
                <InputText id="descripcion" v-model="asignaturaStore.asignatura.descripcion" name="descripcion" class="flex-auto" autocomplete="off" />
            </div>
            <div class="flex items-center gap-4 mb-4">
                <label for="area" class="font-semibold w-24">Área</label>
                <SelectAreas />
            </div>

            <div class="mb-4">
                <label class="font-semibold block mb-2">Grados</label>
                <div class="flex flex-wrap gap-2">
                    <span
                        v-for="grado in gradosDisponibles"
                        :key="grado"
                        @click="toggleGrado(grado)"
                        :class="[
                            'px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-all select-none',
                            isGradoSelected(grado)
                                ? 'bg-gray-700 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        ]"
                    >
                        {{ grado }}°
                    </span>
                </div>
            </div>

            <div class="flex justify-end gap-2">
                <Button type="button" label="Cerrar" severity="secondary" @click="closeModal"></Button>
                <Button type="submit" label="Guardar"></Button>
            </div>
        </form>
    </Dialog>
</template>

<style scoped>

</style>
