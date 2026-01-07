<script setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import { useModalAssignGruposStore } from '@/stores/modalAssignGrupos.js';
import { gradosService } from '@/services/gradosService.js';
import { gruposService } from '@/services/gruposService.js';
import { ref, watch } from 'vue';
import { useToast } from "primevue/usetoast";
import { useUserStore } from "@/stores/user.js";

const store = useModalAssignGruposStore();
const toast = useToast();
const userStore = useUserStore();

// Selects
const selectedGrado = ref(null);
const selectedGrupo = ref(null);

// Opciones
const gradosList = ref([]);
const gruposList = ref([]);

// Lista de grupos asignados (estado local)
const gruposAsignados = ref([]); 

const loading = ref(false);
const loadingGrados = ref(false);
const loadingGrupos = ref(false);

const resetSelects = () => {
    selectedGrado.value = null;
    selectedGrupo.value = null;
    gruposList.value = [];
};

watch(() => store.selectedDocente, async (newDocente) => {
    if (newDocente) {
        gruposAsignados.value = [...(newDocente.grupos || [])];
        resetSelects();
        
        if (newDocente.sede_id) {
            loadingGrados.value = true;
            try {
                const data = await gradosService.getGradosBySede(newDocente.sede_id);
                gradosList.value = data;
            } catch (error) {
                console.error(error);
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los grados', life: 3000 });
            } finally {
                loadingGrados.value = false;
            }
        } else {
            gradosList.value = [];
            if (newDocente.rol === 'docente') {
                toast.add({ severity: 'warn', summary: 'Atención', detail: 'El docente no tiene sede asignada', life: 3000 });
            }
        }
    } else {
        gruposAsignados.value = [];
    }
});

watch(selectedGrado, async (newGrado) => {
    selectedGrupo.value = null;
    if (newGrado) {
        loadingGrupos.value = true;
        try {
            const data = await gruposService.getGruposByGrado(newGrado.id);
            gruposList.value = data;
        } catch (error) {
            console.error(error);
        } finally {
            loadingGrupos.value = false;
        }
    } else {
        gruposList.value = [];
    }
});

watch(selectedGrupo, (newGrupo) => {
    if (newGrupo) {
        const exists = gruposAsignados.value.some(g => g.id === newGrupo.id);
        if (!exists) {
            const grupoToAdd = {
                ...newGrupo,
                grado_nombre: selectedGrado.value.nombre 
            };
            gruposAsignados.value.push(grupoToAdd);
        } else {
            toast.add({ severity: 'info', summary: 'Ya asignado', detail: 'Este grupo ya está en la lista', life: 2000 });
        }
        
        setTimeout(() => {
            selectedGrupo.value = null;
        }, 100);
    }
});

const removeGrupo = (grupoId) => {
    gruposAsignados.value = gruposAsignados.value.filter(g => g.id !== grupoId);
};

const handleSave = async () => {
    if (!store.selectedDocente) return;
    
    loading.value = true;
    try {
        const docenteId = store.selectedDocente.id;
        const gruposOriginales = store.selectedDocente.grupos || [];
        const originalesIds = new Set(gruposOriginales.map(g => g.id));
        const nuevosIds = new Set(gruposAsignados.value.map(g => g.id));
        
        const promesas = [];
        
        // 1. ASIGNAR (Están en nuevos pero NO en originales)
        for (const grupo of gruposAsignados.value) {
            if (!originalesIds.has(grupo.id)) {
                promesas.push(gruposService.asignarDirector(grupo.id, docenteId));
            }
        }
        
        // 2. DESASIGNAR (Estaban en originales pero NO en nuevos)
        for (const original of gruposOriginales) {
            if (!nuevosIds.has(original.id)) {
                promesas.push(gruposService.desasignarDirector(original.id, docenteId));
            }
        }
        
        if (promesas.length > 0) {
            await Promise.all(promesas);
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Grupos asignados correctamente', life: 3000 });
            await userStore.getDocentes(); // USAR getDocentes
        } else {
            toast.add({ severity: 'info', summary: 'Sin cambios', detail: 'No hubo cambios', life: 3000 });
        }
        
        store.closeModal();
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Falló la actualización', life: 3000 });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <Dialog v-model:visible="store.visible" modal header="Asignar Dirección de Grupo" :style="{ width: '500px' }">
        <div class="flex flex-col gap-4 mt-2">
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block font-semibold mb-2 text-gray-700">Grado</label>
                    <Dropdown 
                        v-model="selectedGrado" 
                        :options="gradosList" 
                        optionLabel="nombre" 
                        placeholder="Escoger grado" 
                        class="w-full"
                        :loading="loadingGrados"
                        emptyMessage="Sin grados disponibles"
                    />
                </div>
                <div>
                    <label class="block font-semibold mb-2 text-gray-700">Grupo</label>
                    <Dropdown 
                        v-model="selectedGrupo" 
                        :options="gruposList" 
                        optionLabel="nombre" 
                        placeholder="Escoger grupo" 
                        class="w-full"
                        :loading="loadingGrupos"
                        :disabled="!selectedGrado"
                        emptyMessage="Seleccione un grado primero"
                    />
                </div>
            </div>

            <!-- Área de Chips (Multiselect simulado) -->
            <div class="border rounded-md p-3 min-h-[60px] bg-gray-50 mt-2">
                <div v-if="gruposAsignados.length > 0" class="flex flex-wrap gap-2">
                    <div 
                        v-for="grupo in gruposAsignados" 
                        :key="grupo.id"
                        class="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 border border-purple-200"
                    >
                        <span>{{ grupo.grado_nombre }} - {{ grupo.nombre }}</span>
                        <i 
                            class="pi pi-times cursor-pointer hover:text-purple-900 font-bold" 
                            @click="removeGrupo(grupo.id)"
                        ></i>
                    </div>
                </div>
                <span v-else class="text-gray-400 text-sm italic">Sin grupos seleccionados...</span>
            </div>

            <div class="flex justify-end gap-2 mt-6">
                <Button label="Cancelar" severity="secondary" @click="store.closeModal" />
                <Button label="Actualizar" @click="handleSave" :loading="loading" />
            </div>
        </div>
    </Dialog>
</template>
