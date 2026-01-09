<script setup>
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import DatePicker from 'primevue/datepicker';
import RadioButton from 'primevue/radiobutton';
import { estudiantesService } from '@/services/estudiantesService.js';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
    visible: Boolean,
    estudiante: Object
});

const emit = defineEmits(['update:visible', 'updated']);

const toast = useToast();
const saving = ref(false);

// Opciones para tipo de documento
const tiposDocumento = [
    { label: 'Registro Civil', value: 'RC' },
    { label: 'Tarjeta de Identidad', value: 'TI' }
];

// Estado para controlar quién es el acudiente: null, 'padre', 'madre'
const acudienteEs = ref(null);

// Estado inicial del formulario
const getInitialForm = () => ({
    fecha_nacimiento: null,
    lugar_nacimiento: '',
    tipo_documento: null,
    rh: '',
    eps: '',
    nombre_padre: '',
    ocupacion_padre: '',
    celular_padre: '',
    nombre_madre: '',
    ocupacion_madre: '',
    celular_madre: '',
    nombre_acudiente: '',
    celular_acudiente: ''
});

const form = ref(getInitialForm());
const initialFormState = ref(getInitialForm());

// Detectar si hay cambios en el formulario
const hasChanges = computed(() => {
    return JSON.stringify(form.value) !== JSON.stringify(initialFormState.value);
});

// Watch para auto-llenar datos del acudiente cuando se selecciona padre o madre
watch(acudienteEs, (newValue) => {
    if (newValue === 'padre') {
        form.value.nombre_acudiente = form.value.nombre_padre;
        form.value.celular_acudiente = form.value.celular_padre;
    } else if (newValue === 'madre') {
        form.value.nombre_acudiente = form.value.nombre_madre;
        form.value.celular_acudiente = form.value.celular_madre;
    }
});

// Función para toggle de radiobutton (permite desmarcar)
const toggleAcudiente = (valor) => {
    if (acudienteEs.value === valor) {
        acudienteEs.value = null;
    } else {
        acudienteEs.value = valor;
    }
};

// Watch para actualizar acudiente si cambian los datos del padre (cuando está seleccionado)
watch(() => [form.value.nombre_padre, form.value.celular_padre], ([nombre, celular]) => {
    if (acudienteEs.value === 'padre') {
        form.value.nombre_acudiente = nombre;
        form.value.celular_acudiente = celular;
    }
});

// Watch para actualizar acudiente si cambian los datos de la madre (cuando está seleccionada)
watch(() => [form.value.nombre_madre, form.value.celular_madre], ([nombre, celular]) => {
    if (acudienteEs.value === 'madre') {
        form.value.nombre_acudiente = nombre;
        form.value.celular_acudiente = celular;
    }
});

// Watch para cargar datos cuando se abre el modal
watch(() => [props.visible, props.estudiante], ([newVisible, newEstudiante]) => {
    if (newVisible && newEstudiante) {
        // Cargar datos del estudiante en el formulario
        const fechaNac = newEstudiante.fecha_nacimiento 
            ? new Date(newEstudiante.fecha_nacimiento) 
            : null;

        form.value = {
            fecha_nacimiento: fechaNac,
            lugar_nacimiento: newEstudiante.lugar_nacimiento || '',
            tipo_documento: newEstudiante.tipo_documento || null,
            rh: newEstudiante.rh || '',
            eps: newEstudiante.eps || '',
            nombre_padre: newEstudiante.nombre_padre || '',
            ocupacion_padre: newEstudiante.ocupacion_padre || '',
            celular_padre: newEstudiante.celular_padre || '',
            nombre_madre: newEstudiante.nombre_madre || '',
            ocupacion_madre: newEstudiante.ocupacion_madre || '',
            celular_madre: newEstudiante.celular_madre || '',
            nombre_acudiente: newEstudiante.nombre_acudiente || '',
            celular_acudiente: newEstudiante.celular_acudiente || ''
        };
        
        // Detectar si el acudiente coincide con padre o madre
        if (newEstudiante.nombre_acudiente === newEstudiante.nombre_padre && newEstudiante.nombre_padre) {
            acudienteEs.value = 'padre';
        } else if (newEstudiante.nombre_acudiente === newEstudiante.nombre_madre && newEstudiante.nombre_madre) {
            acudienteEs.value = 'madre';
        } else {
            acudienteEs.value = null;
        }
        
        // Guardar estado inicial para comparar cambios
        initialFormState.value = { ...form.value };
    }
});

const close = () => {
    emit('update:visible', false);
    // Reset form
    form.value = getInitialForm();
    initialFormState.value = getInitialForm();
    acudienteEs.value = null;
};

const formatDateForBackend = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const save = async () => {
    if (!props.estudiante) return;

    saving.value = true;
    try {
        // Preparar datos para enviar
        const payload = {
            fecha_nacimiento: formatDateForBackend(form.value.fecha_nacimiento),
            lugar_nacimiento: form.value.lugar_nacimiento || null,
            tipo_documento: form.value.tipo_documento || null,
            rh: form.value.rh || null,
            eps: form.value.eps || null,
            nombre_padre: form.value.nombre_padre || null,
            ocupacion_padre: form.value.ocupacion_padre || null,
            celular_padre: form.value.celular_padre || null,
            nombre_madre: form.value.nombre_madre || null,
            ocupacion_madre: form.value.ocupacion_madre || null,
            celular_madre: form.value.celular_madre || null,
            nombre_acudiente: form.value.nombre_acudiente || null,
            celular_acudiente: form.value.celular_acudiente || null
        };

        await estudiantesService.updateEstudiante({ id: props.estudiante.id, ...payload });
        
        toast.add({ severity: 'success', summary: 'Éxito', detail: 'Datos del estudiante actualizados correctamente', life: 3000 });
        emit('updated');
        close();
    } catch (error) {
        console.error("Error actualizando estudiante:", error);
        let msg = 'Error al actualizar los datos del estudiante';
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
        :header="estudiante ? `Editar estudiante: ${estudiante.nombres} ${estudiante.apellidos}` : 'Editar estudiante'" 
        :style="{ width: '80rem' }"
        :breakpoints="{ '1199px': '90vw', '767px': '95vw' }"
    >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Columna 1: Datos Personales -->
            <div class="flex flex-col gap-4">
                <h4 class="font-semibold text-gray-700 border-b pb-2">Datos Personales</h4>
                
                <div class="flex flex-col gap-2">
                    <label for="fecha_nacimiento" class="text-sm text-gray-600">Fecha de Nacimiento</label>
                    <DatePicker 
                        id="fecha_nacimiento" 
                        v-model="form.fecha_nacimiento" 
                        dateFormat="dd/mm/yy"
                        placeholder="Seleccionar fecha"
                        showIcon 
                        class="w-full"
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="lugar_nacimiento" class="text-sm text-gray-600">Lugar de Nacimiento</label>
                    <InputText id="lugar_nacimiento" v-model="form.lugar_nacimiento" placeholder="Ej: Bogotá" class="w-full" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="tipo_documento" class="text-sm text-gray-600">Tipo de Documento</label>
                    <Select 
                        id="tipo_documento" 
                        v-model="form.tipo_documento" 
                        :options="tiposDocumento" 
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Seleccionar tipo"
                        class="w-full"
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="rh" class="text-sm text-gray-600">Grupo Sanguíneo (RH)</label>
                    <InputText id="rh" v-model="form.rh" placeholder="Ej: O+" class="w-full" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="eps" class="text-sm text-gray-600">EPS</label>
                    <InputText id="eps" v-model="form.eps" placeholder="Ej: Sura" class="w-full" />
                </div>
            </div>

            <!-- Columna 2: Datos del Padre y Madre -->
            <div class="flex flex-col gap-4">
                <h4 class="font-semibold text-gray-700 border-b pb-2">Datos del Padre</h4>
                
                <div class="flex flex-col gap-2">
                    <label for="nombre_padre" class="text-sm text-gray-600">Nombre del Padre</label>
                    <InputText id="nombre_padre" v-model="form.nombre_padre" placeholder="Nombre completo" class="w-full" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="ocupacion_padre" class="text-sm text-gray-600">Ocupación del Padre</label>
                    <InputText id="ocupacion_padre" v-model="form.ocupacion_padre" placeholder="Ej: Agricultor" class="w-full" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="celular_padre" class="text-sm text-gray-600">Celular del Padre</label>
                    <InputText id="celular_padre" v-model="form.celular_padre" placeholder="Ej: 3001234567" class="w-full" />
                </div>

                <!-- RadioButton para padre como acudiente -->
                <div 
                    class="flex items-center gap-2 mt-2 p-2 rounded-lg border cursor-pointer transition-colors"
                    :class="acudienteEs === 'padre' ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'"
                    @click="toggleAcudiente('padre')"
                >
                    <RadioButton 
                        inputId="acudiente_padre" 
                        :modelValue="acudienteEs" 
                        value="padre" 
                        @click.stop="toggleAcudiente('padre')"
                    />
                    <label for="acudiente_padre" class="text-sm text-gray-700 cursor-pointer flex-1">
                        El padre es el acudiente
                    </label>
                </div>

                <h4 class="font-semibold text-gray-700 border-b pb-2 mt-4">Datos de la Madre</h4>

                <div class="flex flex-col gap-2">
                    <label for="nombre_madre" class="text-sm text-gray-600">Nombre de la Madre</label>
                    <InputText id="nombre_madre" v-model="form.nombre_madre" placeholder="Nombre completo" class="w-full" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="ocupacion_madre" class="text-sm text-gray-600">Ocupación de la Madre</label>
                    <InputText id="ocupacion_madre" v-model="form.ocupacion_madre" placeholder="Ej: Ama de casa" class="w-full" />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="celular_madre" class="text-sm text-gray-600">Celular de la Madre</label>
                    <InputText id="celular_madre" v-model="form.celular_madre" placeholder="Ej: 3001234567" class="w-full" />
                </div>

                <!-- RadioButton para madre como acudiente -->
                <div 
                    class="flex items-center gap-2 mt-2 p-2 rounded-lg border cursor-pointer transition-colors"
                    :class="acudienteEs === 'madre' ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'"
                    @click="toggleAcudiente('madre')"
                >
                    <RadioButton 
                        inputId="acudiente_madre" 
                        :modelValue="acudienteEs" 
                        value="madre" 
                        @click.stop="toggleAcudiente('madre')"
                    />
                    <label for="acudiente_madre" class="text-sm text-gray-700 cursor-pointer flex-1">
                        La madre es la acudiente
                    </label>
                </div>
            </div>

            <!-- Columna 3: Datos del Acudiente -->
            <div class="flex flex-col gap-4">
                <h4 class="font-semibold text-gray-700 border-b pb-2">Datos del Acudiente</h4>

                <!-- Mensaje cuando hay selección de padre/madre -->
                <div v-if="acudienteEs" class="p-3 bg-green-50 rounded-lg border border-green-200">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-check-circle text-green-600"></i>
                        <span class="text-sm text-green-700">
                            Datos copiados del {{ acudienteEs === 'padre' ? 'padre' : 'madre' }}
                        </span>
                    </div>
                </div>

                <div class="flex flex-col gap-2">
                    <label for="nombre_acudiente" class="text-sm text-gray-600">Nombre del Acudiente</label>
                    <InputText 
                        id="nombre_acudiente" 
                        v-model="form.nombre_acudiente" 
                        placeholder="Nombre completo" 
                        class="w-full" 
                        :disabled="acudienteEs !== null"
                    />
                </div>

                <div class="flex flex-col gap-2">
                    <label for="celular_acudiente" class="text-sm text-gray-600">Celular del Acudiente</label>
                    <InputText 
                        id="celular_acudiente" 
                        v-model="form.celular_acudiente" 
                        placeholder="Ej: 3001234567" 
                        class="w-full" 
                        :disabled="acudienteEs !== null"
                    />
                </div>

                <div v-if="!acudienteEs" class="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div class="flex items-start gap-2">
                        <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                        <p class="text-sm text-blue-700">
                            Si el acudiente es el padre o la madre, seleccione la opción correspondiente en la columna anterior.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <Button label="Cancelar" icon="pi pi-times" text @click="close" />
            <Button 
                label="Actualizar" 
                icon="pi pi-check" 
                @click="save" 
                :loading="saving" 
                severity="success" 
                :disabled="!hasChanges"
            />
        </template>
    </Dialog>
</template>
