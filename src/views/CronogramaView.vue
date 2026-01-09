<script setup>
import { ref, onMounted, computed } from 'vue';
import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Button from 'primevue/button';
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { cronogramaService } from "@/services/cronogramaService.js";
import { actividadService } from "@/services/actividadService.js";
import ModalCronograma from "@/components/ModalCronograma.vue";
import ModalActividad from "@/components/ModalActividad.vue";
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

const toast = useToast();
const confirm = useConfirm();

const loading = ref(true);
const cronograma = ref(null);
const modalVisible = ref(false);
const isEditing = ref(false);

const currentYear = new Date().getFullYear();

// ============ ACTVIDADES ============
const modalActividadVisible = ref(false);
const actividadLoading = ref(false);
const actividadInitialData = ref({});
const actividades = ref([]);

// FullCalendar Config
const calendarOptions = computed(() => ({
  plugins: [ dayGridPlugin, interactionPlugin ],
  initialView: 'dayGridMonth',
  locale: esLocale,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth'
  },
  // Restringir navegación solo al año actual
  validRange: {
    start: `${currentYear}-01-01`,
    end: `${currentYear}-12-31`
  },
  events: actividades.value.map(act => ({
    id: act.id,
    title: act.titulo,
    start: act.fecha_programada,
    classNames: [`fc-event-${act.estado}`],
    extendedProps: {
        ...act
    }
  })),
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  editable: false, // Por ahora sin dragdrop hasta validar bien
  height: 'auto'
}));


// Fetch Cronograma
const fetchCronograma = async () => {
  loading.value = true;
  try {
    const data = await cronogramaService.getCronograma(currentYear);
    cronograma.value = data;
    if (data && data.actividades) {
        actividades.value = data.actividades;
    } else {
        actividades.value = [];
    }
  } catch (error) {
    console.error('Error fetching cronograma:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el cronograma', life: 3000 });
  } finally {
    loading.value = false;
  }
};

// ============ CRONOGRAMA MODAL FUNCTIONS ============

const openModal = (edit = false) => {
  isEditing.value = edit;
  modalVisible.value = true;
};

const handleSave = async (formData) => {
  try {
    if (isEditing.value && cronograma.value) {
      // Update
      const updated = await cronogramaService.updateCronograma(cronograma.value.id, formData);
      cronograma.value = { ...cronograma.value, ...updated }; 
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Cronograma actualizado correctamente', life: 3000 });
    } else {
      // Create
      const created = await cronogramaService.createCronograma(formData);
      cronograma.value = created;
      actividades.value = []; // Reset actividades for new cronograma
      toast.add({ severity: 'success', summary: 'Creado', detail: 'Cronograma creado exitosamente', life: 3000 });
    }
    modalVisible.value = false;
  } catch (error) {
    console.error('Error saving cronograma:', error);
    const detail = error.response?.data?.detail || 'Ocurrió un error al guardar';
    toast.add({ severity: 'error', summary: 'Error', detail: detail, life: 5000 });
  }
};

// ============ CALENDAR & ACTIVIDADES FUNCTIONS ============

function handleDateClick(arg) {
    // Open modal to create new activity on this date
    actividadInitialData.value = {
        titulo: '',
        descripcion: '',
        fecha_programada: arg.dateStr,
        cronograma_id: cronograma.value.id
    };
    modalActividadVisible.value = true;
}

function handleEventClick(info) {
    // Open modal to edit existing activity
    const props = info.event.extendedProps;
    actividadInitialData.value = {
        id: props.id,
        titulo: props.titulo,
        descripcion: props.descripcion,
        fecha_programada: props.fecha_programada,
        cronograma_id: props.cronograma_id,
        estado: props.estado,
        evidencias: props.evidencias || []
    };
    modalActividadVisible.value = true;
}

const handleSaveActividad = async (formData) => {
    actividadLoading.value = true;
    try {
        if (formData.id) {
            // Update
            const updated = await actividadService.updateActividad(formData.id, formData);
            // Update local array
            const idx = actividades.value.findIndex(a => a.id === updated.id);
            if (idx !== -1) {
                actividades.value[idx] = updated;
            }
            toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Actividad actualizada', life: 3000 });
        } else {
            // Create
            formData.cronograma_id = cronograma.value.id; // Ensure ID is set
            const created = await actividadService.createActividad(formData);
            actividades.value.push(created);
            toast.add({ severity: 'success', summary: 'Creado', detail: 'Actividad agendada', life: 3000 });
        }
        modalActividadVisible.value = false;
        // Optionally refresh fully to ensure sync
        // fetchCronograma(); 
    } catch (error) {
        console.error('Error saving actividad:', error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo guardar la actividad', life: 3000 });
    } finally {
        actividadLoading.value = false;
    }
};

const handleDeleteActividad = (actividad) => {
    confirm.require({
        message: '¿Estás seguro que deseas eliminar esta actividad? Se perderán las evidencias asociadas.',
        header: 'Confirmar Eliminación',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            actividadLoading.value = true;
            try {
                await actividadService.deleteActividad(actividad.id);
                // Remove from local array
                actividades.value = actividades.value.filter(a => a.id !== actividad.id);
                toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Actividad eliminada', life: 3000 });
                modalActividadVisible.value = false;
            } catch (error) {
                console.error('Error deleting actividad:', error);
                toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 });
            } finally {
                actividadLoading.value = false;
            }
        }
    });
};

const handleUpdateActividad = (updatedActividad) => {
    // Update local array when evidences change or status auto-updates
    const idx = actividades.value.findIndex(a => a.id === updatedActividad.id);
    if (idx !== -1) {
        // Merge updates carefully
        actividades.value[idx] = { ...actividades.value[idx], ...updatedActividad };
        
        // Also update initialData if modal is still open to reflect changes
        actividadInitialData.value = { ...actividadInitialData.value, ...updatedActividad };
    }
};


onMounted(() => {
  fetchCronograma();
});
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />
    
    <main class="flex-1 flex flex-col overflow-hidden">
      <Header />
      
      <div class="flex-1 overflow-y-auto p-8">
        <!-- Title & Breadcrumbs -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-2">Cronograma de Actividades</h1>
          <p class="text-gray-500">Gestión de actividades y evidencias para el año {{ currentYear }}</p>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center items-center h-64">
          <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
        </div>

        <template v-else>
          <!-- Empty State -->
          <div v-if="!cronograma" class="flex flex-col items-center justify-center p-12 bg-white rounded-xl shadow-sm border border-gray-100 h-96">
            <div class="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
              <i class="pi pi-calendar-plus text-4xl text-blue-500"></i>
            </div>
            <h2 class="text-xl font-semibold text-gray-800 mb-2">Sin Cronograma Individual</h2>
            <p class="text-gray-500 text-center max-w-md mb-8">
              Aún no has creado tu cronograma de actividades para el año {{ currentYear }}. 
              Crea uno nuevo para empezar a organizar tus actividades.
            </p>
            <Button 
              label="Crear Cronograma" 
              icon="pi pi-plus" 
              class="p-button-lg"
              @click="openModal(false)"
            />
          </div>

          <!-- Cronograma Content -->
          <div v-else>
            <!-- Header Card -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 relative overflow-hidden group">
                <div class="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500"></div>
                <div class="flex justify-between items-start">
                    <div class="pr-12">
                        <h2 class="text-2xl font-bold text-gray-800 mb-2">{{ cronograma.titulo }}</h2>
                        <p class="text-gray-600" v-if="cronograma.descripcion">{{ cronograma.descripcion }}</p>
                        <p class="text-gray-400 italic mt-2" v-else>Sin descripción</p>
                        
                        <!-- Mini Stats -->
                         <div class="mt-4 flex items-center gap-6 text-sm">
                            <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full bg-red-400"></div>
                                <span class="text-gray-600">Pendiente</span>
                            </div>
                             <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full bg-green-500"></div>
                                <span class="text-gray-600">Completada</span>
                            </div>
                              <div class="flex items-center gap-2">
                                <div class="w-3 h-3 rounded-full bg-orange-400"></div>
                                <span class="text-gray-600">Retrasada</span>
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        icon="pi pi-pencil" 
                        class="p-button-rounded p-button-text p-button-plain opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity" 
                        v-tooltip.left="'Editar título/descripción'"
                        @click="openModal(true)"
                    />
                </div>
            </div>

            <!-- Calendar Container -->
            <div class="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                 <FullCalendar :options="calendarOptions" />
            </div>
          </div>

        </template>
      </div>
    </main>

    <!-- Modal Cronograma (Create Shell) -->
    <ModalCronograma 
      v-model:visible="modalVisible"
      :header="isEditing ? 'Editar Cronograma' : 'Crear Cronograma'"
      :initial-data="isEditing && cronograma ? { titulo: cronograma.titulo, descripcion: cronograma.descripcion || '' } : { titulo: '', descripcion: '' }"
      @save="handleSave"
    />

    <!-- Modal Actividad (Create/Edit Activity) -->
    <ModalActividad
        v-model:visible="modalActividadVisible"
        :header="actividadInitialData.id ? 'Editar Actividad' : 'Nueva Actividad'"
        :initial-data="actividadInitialData"
        :loading="actividadLoading"
        @save="handleSaveActividad"
        @delete="handleDeleteActividad"
        @update-actividad="handleUpdateActividad"
    />

  </div>
</template>

<style>
/* Custom Calendar Styles */
.fc .fc-toolbar-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    text-transform: capitalize;
}

.fc .fc-button-primary {
    background-color: #3b82f6; /* Blue-500 */
    border-color: #3b82f6;
}
.fc .fc-button-primary:hover {
    background-color: #2563eb;
    border-color: #2563eb;
}
.fc .fc-button-primary:disabled {
    background-color: #93c5fd;
    border-color: #93c5fd;
}

/* Event Status Colors */
.fc-event-pendiente {
  background-color: #ef4444 !important; /* Red-500 */
  border-color: #ef4444 !important;
}

.fc-event-completada {
  background-color: #22c55e !important; /* Green-500 */
  border-color: #22c55e !important;
}

.fc-event-retrasada {
  background-color: #f97316 !important; /* Orange-500 */
  border-color: #f97316 !important;
}

.fc-event-cancelada {
  background-color: #6b7280 !important; /* Gray-500 */
  border-color: #6b7280 !important;
  text-decoration: line-through;
}

.fc-event {
    cursor: pointer;
    border-radius: 4px;
    padding: 2px 4px;
    font-size: 0.85rem;
    transition: transform 0.1s ease;
}
.fc-event:hover {
    transform: scale(1.02);
}

.fc-daygrid-day-frame {
    cursor: pointer;
    transition: background-color 0.2s;
}
.fc-daygrid-day-frame:hover {
    background-color: #f9fafb;
}
</style>
