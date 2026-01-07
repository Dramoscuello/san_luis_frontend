<script setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import MultiSelect from 'primevue/multiselect';
import { useModalAssignAsignaturasStore } from '@/stores/modalAssignAsignaturas.js';
import { asignaturasService } from '@/services/asignaturasService.js';
import { onMounted, ref, watch } from 'vue';
import { useToast } from "primevue/usetoast";
import { useUserStore } from "@/stores/user.js";

const store = useModalAssignAsignaturasStore();
const toast = useToast();
const userStore = useUserStore();

// Todas las asignaturas disponibles en el sistema
const asignaturasDisponibles = ref([]);
// Asignaturas seleccionadas en el MultiSelect
const selectedAsignaturas = ref([]);
const loading = ref(false);

// Cargar todas las asignaturas
const loadAsignaturas = async () => {
    try {
        const data = await asignaturasService.getAsignaturas();
        asignaturasDisponibles.value = data;
    } catch (error) {
        console.error("Error cargando asignaturas:", error);
    }
};

// Cuando se abre el modal y cambia el docente seleccionado
watch(() => store.selectedDocente, (newDocente) => {
    if (newDocente) {
        // Precargar asignaturas del docente
        // Mapeamos a los objetos de asignaturasDisponibles para asegurar consistencia
        // aunque con dataKey="id" PrimeVue debería manejarlo
        selectedAsignaturas.value = newDocente.asignaturas || [];
    } else {
        selectedAsignaturas.value = [];
    }
});

onMounted(() => {
    loadAsignaturas();
});


const handleSave = async () => {
    if (!store.selectedDocente) return;
    
    loading.value = true;
    try {
        const docenteId = store.selectedDocente.id;
        const asignaturasOriginalesIds = new Set((store.selectedDocente.asignaturas || []).map(a => a.id));
        const asignaturasSeleccionadasIds = new Set(selectedAsignaturas.value.map(a => a.id));
        
        const promesas = [];
        
        // 1. ASIGNAR (Están en seleccionadas pero NO en originales)
        for (const asig of selectedAsignaturas.value) {
            if (!asignaturasOriginalesIds.has(asig.id)) {
                promesas.push(asignaturasService.asignarDocente(asig.id, docenteId));
            }
        }

        // 2. DESASIGNAR (Estaban en originales pero NO en seleccionadas)
        for (const asigOriginal of (store.selectedDocente.asignaturas || [])) {
            if (!asignaturasSeleccionadasIds.has(asigOriginal.id)) {
                promesas.push(asignaturasService.desasignarDocente(asigOriginal.id, docenteId));
            }
        }
        
        // Ejecutar todas las promesas
        if (promesas.length > 0) {
            await Promise.all(promesas);
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Asignaciones actualizadas correctamente', life: 3000 });
            // Refrescar lista de usuarios para ver cambios
            await userStore.getDocentes();
        } else {
            toast.add({ severity: 'info', summary: 'Sin cambios', detail: 'No hubo cambios en las asignaciones', life: 3000 });
        }
        
        store.closeModal();
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Ocurrió un error al actualizar las asignaciones', life: 3000 });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <Dialog v-model:visible="store.visible" modal header="Agregar asignaturas" :style="{ width: '500px' }">
        <div class="flex flex-col gap-4 mt-2">
            <div>
                <label class="block font-semibold mb-2 text-gray-700">Asignaturas</label>
                <MultiSelect
                    v-model="selectedAsignaturas"
                    :options="asignaturasDisponibles"
                    optionLabel="nombre"
                    placeholder="Seleccione asignaturas..."
                    display="chip"
                    filter
                    class="w-full"
                    dataKey="id"
                    :maxSelectedLabels="3"
                >
                    <template #option="slotProps">
                        <div class="flex items-center">
                            <div>{{ slotProps.option.nombre }}</div>
                        </div>
                    </template>
                </MultiSelect>
                <small class="text-gray-500 mt-1 block">Seleccione las asignaturas que dicta este docente.</small>
            </div>
            
            <div class="flex justify-end gap-2 mt-6">
                <Button label="Cancelar" severity="secondary" @click="store.closeModal" />
                <Button label="Actualizar" @click="handleSave" :loading="loading" />
            </div>
        </div>
    </Dialog>
</template>
