<script setup>
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Calendar from 'primevue/calendar';
import Button from 'primevue/button';
import Select from 'primevue/select';
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import FileUpload from 'primevue/fileupload'; // Assuming we use PrimeVue FileUpload or custom input
// PrimeVue V4 Tabs are slightly different. 
// Validated PrimeVue v4 Tabs structure: Tabs -> TabList -> Tab, TabPanels -> TabPanel
// But since the project might be v3 or v4 mix, I will use a simple implementation or conditional.
// Given main.js imports: 'primevue/config'; and '@primevue/themes/aura', it's likely v4.
// Let's stick to standard v3/v4 TabView if Tabs is too new or complex, 
// BUT previous code used "Select" which is v4. I will use Tabs (v4) or TabView (v3). 
// To be safe and consistent with PrimeVue v4 Aura preset mentioned in main.js:
// import Tabs from 'primevue/tabs'; is correct for v4.

import { actividadService } from "@/services/actividadService.js";
import { useToast } from "primevue/usetoast";

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  header: {
    type: String,
    default: 'Gestionar Actividad'
  },
  initialData: {
    type: Object,
    default: () => ({ titulo: '', descripcion: '', fecha_programada: null, evidencias: [] })
  },
  loading: {
      type: Boolean,
      default: false
  }
});

const emit = defineEmits(['update:visible', 'save', 'delete', 'update-actividad']);
const toast = useToast();

const form = ref({
  titulo: '',
  descripcion: '',
  fecha_programada: null,
  estado: 'pendiente'
});

const evidencias = ref([]);
const uploading = ref(false);
const selectedFile = ref(null);
const fileComment = ref('');

const estados = [
    { label: 'Pendiente', value: 'pendiente' },
    { label: 'Completada', value: 'completada' },
    { label: 'Cancelada', value: 'cancelada' },
    { label: 'Retrasada', value: 'retrasada' }
];

watch(() => props.visible, (newVal) => {
  if (newVal) {
    if (props.initialData.fecha_programada && typeof props.initialData.fecha_programada === 'string') {
        const [year, month, day] = props.initialData.fecha_programada.split('-').map(Number);
        form.value = { 
            ...props.initialData, 
            fecha_programada: new Date(year, month - 1, day) 
        };
    } else {
        form.value = { ...props.initialData };
    }
    // Load evidencias locally to manage them
    evidencias.value = props.initialData.evidencias || [];
    // Clean upload form
    selectedFile.value = null;
    fileComment.value = '';
  }
});

const isValid = computed(() => {
  return form.value.titulo && form.value.titulo.length >= 3 && form.value.fecha_programada;
});

const close = () => {
  emit('update:visible', false);
};

const handleSave = () => {
  if (isValid.value) {
    const date = form.value.fecha_programada;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    emit('save', { 
        ...form.value, 
        fecha_programada: formattedDate 
    });
  }
};

const handleDelete = () => {
    emit('delete', form.value);
};

// ============ EVIDENCIAS FUNCTIONS ============
const onFileSelect = (event) => {
    // PrimeVue FileUpload custom mode or simple input
    // Using simple input for now or handling PrimeVue event
    selectedFile.value = event.files[0];
};

const uploadEvidencia = async () => {
    if (!selectedFile.value) return;
    
    uploading.value = true;
    const formData = new FormData();
    formData.append('archivo', selectedFile.value);
    formData.append('actividad_id', form.value.id);
    if (fileComment.value) {
        formData.append('comentario', fileComment.value);
    }

    try {
        const newEvidencia = await actividadService.uploadEvidencia(formData);
        evidencias.value.push(newEvidencia);
        
        // Update local status if it was pending
        if (form.value.estado === 'pendiente') {
            form.value.estado = 'completada';
            // Emit update to parent to reflect status change in Calendar immediately?
            // Yes, we should likely check if we need to auto-save the status change or if back-end did it.
            // Requirement says: "Backend automatically changes status". So frontend just needs to reflect it.
        }
        
        toast.add({ severity: 'success', summary: 'Subido', detail: 'Evidencia cargada correctamente', life: 3000 });
        
        // Reset inputs
        selectedFile.value = null;
        fileComment.value = '';
        
        // Emit logic to refresh data in parent
        emit('update-actividad', { ...form.value, evidencias: evidencias.value });

    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Falló la subida del archivo', life: 3000 });
    } finally {
        uploading.value = false;
    }
};

const deleteEvidencia = async (evidenciaId) => {
    try {
        await actividadService.deleteEvidencia(evidenciaId);
        evidencias.value = evidencias.value.filter(e => e.id !== evidenciaId);
        
        // Logica de negocio: Si no quedan evidencias, volver a pendiente
        if (evidencias.value.length === 0 && form.value.estado === 'completada') {
            await actividadService.updateActividad(form.value.id, { estado: 'pendiente' });
            form.value.estado = 'pendiente';
        }

        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Evidencia eliminada', life: 3000 });
        // Emit update
         emit('update-actividad', { ...form.value, evidencias: evidencias.value });
    } catch (error) {
        console.error(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la evidencia', life: 3000 });
    }
};

const openLink = (url) => {
    if (url) window.open(url, '_blank');
};

// Re-declare activeTab here inside setup
const activeTab = ref('info');

// Reset active tab only when modal opens for a new creation
watch(() => props.visible, (newVal) => {
    if (newVal && !props.initialData.id) {
        activeTab.value = 'info';
    } else if (newVal && props.initialData.id) {
        // If opening distinct activity, maybe prefer info default still
        activeTab.value = 'info';
    }
});
</script>

<template>
  <Dialog 
    :visible="visible" 
    @update:visible="emit('update:visible', $event)" 
    modal 
    :header="header" 
    :style="{ width: '35rem' }"
    :closable="!loading"
  >
    <!-- Use TabView for v3 compatibility which is safer often, but trying Tabs structure if configured -->
    <!-- FALLBACK: If PrimeVue Components Tabs/TabList not globally registered, use TabView/TabPanel -->
    <!-- Checking imports: I'll use simple conditional rendering (Buttons as tabs) to be 100% safe against PrimeVue version changes without verifying main.js config depth -->
    
    <!-- Custom Tabs Navigation -->
    <div v-if="form.id" class="flex border-b border-gray-200 mb-4">
        <button 
            class="px-4 py-2 font-medium text-sm focus:outline-none border-b-2 transition-colors"
            :class="activeTab === 'info' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'info'"
        >
            Información
        </button>
        <button 
            class="px-4 py-2 font-medium text-sm focus:outline-none border-b-2 transition-colors"
            :class="activeTab === 'evidencias' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'evidencias'"
        >
            Evidencias ({{ evidencias.length }})
        </button>
    </div>

    <!-- TAB 1: INFORMATION -->
    <div v-if="activeTab === 'info'" class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label for="titulo" class="font-semibold">Título de la Actividad</label>
        <InputText 
          id="titulo" 
          v-model="form.titulo" 
          placeholder="Ej: Izada de Bandera" 
          autocomplete="off" 
          class="w-full"
          :class="{ 'p-invalid': form.titulo.length > 0 && form.titulo.length < 3 }"
          :disabled="loading"
        />
        <small class="text-gray-500" v-if="form.titulo.length < 3">Mínimo 3 caracteres.</small>
      </div>

       <div class="flex flex-col gap-2">
        <label for="fecha" class="font-semibold">Fecha Programada</label>
        <Calendar 
            id="fecha" 
            v-model="form.fecha_programada" 
            dateFormat="yy-mm-dd" 
            showIcon 
            class="w-full"
            :disabled="loading" 
        />
      </div>
      
      <div class="flex flex-col gap-2">
        <label for="descripcion" class="font-semibold">Descripción (Opcional)</label>
        <Textarea 
          id="descripcion" 
          v-model="form.descripcion" 
          rows="3" 
          placeholder="Detalles adicionales..." 
          class="w-full" 
          :disabled="loading"
        />
      </div>

       <div class="flex flex-col gap-2" v-if="form.id">
        <label for="estado" class="font-semibold">Estado</label>
        <Select 
            id="estado"
            v-model="form.estado" 
            :options="estados" 
            optionLabel="label" 
            optionValue="value" 
            placeholder="Seleccione estado" 
            class="w-full"
            :disabled="loading"
        />
      </div>
    </div>

    <!-- TAB 2: EVIDENCIAS -->
    <div v-else-if="activeTab === 'evidencias'" class="flex flex-col gap-4 min-h-[300px]">
        
        <!-- Upload Section -->
        <div class="bg-gray-50 p-4 rounded-lg border border-dashed border-gray-300">
            <h4 class="text-sm font-semibold text-gray-700 mb-3">Agregar Nueva Evidencia</h4>
            <div class="flex flex-col gap-3">
                 <FileUpload 
                    mode="basic" 
                    name="archivo" 
                    :auto="false"
                    chooseLabel="Seleccionar Archivo"
                    @select="onFileSelect"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    :maxFileSize="10000000"
                />
                <InputText 
                    v-model="fileComment" 
                    placeholder="Comentario (Opcional)" 
                    class="w-full text-sm"
                />
                <Button 
                    label="Subir Evidencia" 
                    icon="pi pi-upload" 
                    size="small"
                    @click="uploadEvidencia" 
                    :loading="uploading"
                    :disabled="!selectedFile"
                />
            </div>
        </div>

        <!-- List Section -->
        <div class="flex-1 overflow-y-auto max-h-[250px] space-y-2">
            <h4 class="text-sm font-semibold text-gray-700">Evidencias Cargadas</h4>
            <div v-if="evidencias.length === 0" class="text-center py-6 text-gray-400 text-sm">
                No hay evidencias subidas aún.
            </div>
            <div v-else v-for="evi in evidencias" :key="evi.id" class="flex items-center justify-between p-3 bg-white border rounded-md hover:shadow-sm transition-shadow">
                <div class="flex items-center gap-3 overflow-hidden">
                    <i class="pi pi-file text-blue-500 text-xl"></i>
                    <div class="flex flex-col min-w-0">
                        <span class="text-sm font-medium text-gray-800 truncate" :title="evi.nombre_archivo">{{ evi.nombre_archivo }}</span>
                        <span class="text-xs text-gray-500 truncate" v-if="evi.comentario_docente">{{ evi.comentario_docente }}</span>
                    </div>
                </div>
                <div class="flex items-center gap-1">
                    <Button 
                        icon="pi pi-eye" 
                        text 
                        rounded 
                        severity="info" 
                        size="small" 
                        @click="openLink(evi.drive_view_link)"
                        v-tooltip="'Ver Archivo'"
                    />
                    <Button 
                        icon="pi pi-trash" 
                        text 
                        rounded 
                        severity="danger" 
                        size="small" 
                        @click="deleteEvidencia(evi.id)"
                        v-tooltip="'Eliminar'"
                    />
                </div>
            </div>
        </div>

    </div>

    <template #footer>
        <div class="flex justify-between w-full">
            <!-- Delete button only on Info tab and if editing -->
            <Button 
                v-if="form.id && activeTab === 'info'" 
                label="Eliminar Actividad" 
                icon="pi pi-trash" 
                severity="danger" 
                text 
                @click="handleDelete" 
                :disabled="loading"
            />
            <div v-else></div> <!-- Spacer -->
            
            <div class="flex gap-2">
                <Button label="Cerrar" icon="pi pi-times" text @click="close" severity="secondary" :disabled="loading" />
                <Button 
                    v-if="activeTab === 'info'"
                    label="Guardar Cambios" 
                    icon="pi pi-check" 
                    @click="handleSave" 
                    :disabled="!isValid || loading" 
                    :loading="loading"
                    severity="primary" 
                />
            </div>
        </div>
    </template>
  </Dialog>
</template>


