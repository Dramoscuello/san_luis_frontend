<script setup>
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import { useObservadoresStore } from '@/stores/observadores.js';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    visible: Boolean,
    estudiante: Object
});

const emit = defineEmits(['update:visible', 'close']);

const observadoresStore = useObservadoresStore();
const toast = useToast();

const loading = ref(false);
const saving = ref(false);
const currentObservacionId = ref(null);

// Track original values to detect changes
const initialForm = ref({
    fortalezas: '',
    dificultades: '',
    compromisos: ''
});

const form = ref({
    fortalezas: '',
    dificultades: '',
    compromisos: ''
});

const isFormDirty = computed(() => {
    return form.value.fortalezas !== initialForm.value.fortalezas ||
           form.value.dificultades !== initialForm.value.dificultades ||
           form.value.compromisos !== initialForm.value.compromisos;
});

const isValidToSave = computed(() => {
    // 1. Si no hay cambios, no guardar
    if (!isFormDirty.value) return false;

    // 2. Si es una observacion nueva (no tiene ID), validar que al menos un campo tenga texto
    // Evita crear registros vacios en la base de datos
    if (!currentObservacionId.value) {
        const hasContent = form.value.fortalezas.trim().length > 0 || 
                           form.value.dificultades.trim().length > 0 || 
                           form.value.compromisos.trim().length > 0;
        return hasContent;
    }

    // 3. Si es edicion, permitimos guardar aunque se borre todo (campos opcionales)
    return true;
});

// Watch for visibility and student changes to load data
watch(() => [props.visible, props.estudiante], async ([newVisible, newEstudiante]) => {
    if (newVisible && newEstudiante) {
        loading.value = true;
        currentObservacionId.value = null;
        try {
            // Reset form
            form.value = {
                fortalezas: '',
                dificultades: '',
                compromisos: ''
            };
            initialForm.value = { ...form.value };

            // Fetch from store (which checks cache or DB)
            const observacion = await observadoresStore.getObservacion(newEstudiante.id);
            
            if (observacion) {
                currentObservacionId.value = observacion.id; // Store ID
                form.value.fortalezas = observacion.fortalezas || '';
                form.value.dificultades = observacion.dificultades || '';
                form.value.compromisos = observacion.compromisos || '';
                
                // Update initial state to match loaded data
                initialForm.value = { ...form.value };
            }
        } catch (error) {
            // Suppress error toast for not found/empty observations as it's expected for new students
            console.log("Información: No se encontró observación previa o hubo un error al cargar:", error);
        } finally {
            loading.value = false;
        }
    }
});

const close = () => {
    emit('update:visible', false);
    emit('close');
};

const save = async () => {
    if (!props.estudiante) return;

    saving.value = true;
    try {
        const payload = {
            id: currentObservacionId.value, // Will be null for new, integer for existing
            estudiante_id: props.estudiante.id,
            fortalezas: form.value.fortalezas,
            dificultades: form.value.dificultades,
            compromisos: form.value.compromisos
        };

        const response = await observadoresStore.saveObservacion(payload);
        
        // If it was a new creation, update the current ID
        if (!currentObservacionId.value && response?.id) {
            currentObservacionId.value = response.id;
        }
        
        // Update initial form state to new saved state
        initialForm.value = { ...form.value };

        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Observación guardada correctamente', life: 3000 });
        close();
    } catch (error) {
        console.error("Error guardando:", error);
        let msg = 'Error al guardar la observación';
        if (error.response?.data?.detail) {
            msg = error.response.data.detail;
        }
        toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 3000 });
    } finally {
        saving.value = false;
    }
};
</script>

<template>
    <Dialog 
        :visible="visible" 
        @update:visible="emit('update:visible', $event)" 
        modal 
        :header="estudiante ? `Observador del estudiante: ${estudiante.nombres} ${estudiante.apellidos}` : 'Observador'" 
        :style="{ width: '50rem' }"
        :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
        <div v-if="loading" class="flex justify-center items-center py-8">
            <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
        </div>

        <div v-else class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
                <label for="fortalezas" class="font-semibold text-gray-700">1. Fortalezas</label>
                <Textarea id="fortalezas" v-model="form.fortalezas" rows="4" autoResize placeholder="Escriba las fortalezas..." />
            </div>

            <div class="flex flex-col gap-2">
                <label for="dificultades" class="font-semibold text-gray-700">2. Debilidades / Dificultades</label>
                <Textarea id="dificultades" v-model="form.dificultades" rows="4" autoResize placeholder="Escriba las dificultades..." />
            </div>

            <div class="flex flex-col gap-2">
                <label for="compromisos" class="font-semibold text-gray-700">3. Compromisos</label>
                <Textarea id="compromisos" v-model="form.compromisos" rows="4" autoResize placeholder="Escriba los compromisos..." />
            </div>
        </div>

        <template #footer>
            <Button label="Cerrar" icon="pi pi-times" text @click="close" />
            <Button 
                label="Guardar" 
                icon="pi pi-check" 
                @click="save" 
                :loading="saving" 
                severity="success" 
                :disabled="!isValidToSave"
            />
        </template>
    </Dialog>
</template>
