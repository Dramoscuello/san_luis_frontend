<script setup>
import { ref, computed, onMounted } from "vue";
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import Button from 'primevue/button';
import { useAreasStore } from "@/stores/areas.js";
import { useAsignaturasStore } from "@/stores/asignaturas.js";
import { useModalAreaStore } from "@/stores/modalAreas.js";
import { useModalAsignaturaStore } from "@/stores/modalAsignaturas.js";
import ModalAreas from "@/components/ModalAreas.vue";
import ModalAsignaturas from "@/components/ModalAsignaturas.vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";

// Stores
const areasStore = useAreasStore();
const asignaturasStore = useAsignaturasStore();
const storeModalAreas = useModalAreaStore();
const storeModalAsignaturas = useModalAsignaturaStore();
const toast = useToast();
const confirm = useConfirm();

// Navigation state
const currentView = ref('areas'); // 'areas' | 'asignaturas'
const selectedArea = ref(null);

// Page title
const pageTitle = computed(() => {
  if (currentView.value === 'asignaturas') {
    return `Asignaturas de ${selectedArea.value?.nombre}`;
  }
  return 'Gestión de áreas académicas';
});

// Navigation functions
const navigateToAreas = () => {
  currentView.value = 'areas';
  selectedArea.value = null;
  asignaturasStore.clearAsignaturas();
};

const navigateToAsignaturas = async (area) => {
  selectedArea.value = area;
  currentView.value = 'asignaturas';
  
  // Configurar callback para refrescar después de guardar
  storeModalAsignaturas.setOnSaveCallback(refreshAfterSave);
  
  try {
    await asignaturasStore.getAsignaturasByArea(area.id);
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar las asignaturas', life: 3000 });
  }
};

// Función para refrescar después de guardar una asignatura
const refreshAfterSave = async () => {
  try {
    // Refrescar las asignaturas del área actual
    if (selectedArea.value) {
      await asignaturasStore.getAsignaturasByArea(selectedArea.value.id);
    }
    // Refrescar las áreas para actualizar los contadores
    await areasStore.getAreas();
  } catch (error) {
    console.error('Error refrescando datos:', error);
  }
};

// ============ AREAS FUNCTIONS ============
const agregarNuevaArea = () => {
  areasStore.area.nombre = '';
  areasStore.area.descripcion = '';
  areasStore.area.id = null;
  areasStore.area.activa = true;
  storeModalAreas.toggleModalArea();
};

const editarArea = (area) => {
  areasStore.area.nombre = area.nombre;
  areasStore.area.descripcion = area.descripcion || '';
  areasStore.area.id = area.id;
  areasStore.area.activa = area.activa;
  storeModalAreas.toggleModalArea();
};

const toggleActivoArea = async (area) => {
  try {
    await areasStore.updateEstado({ id: area.id, activa: !area.activa });
  } catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const eliminarArea = async (area) => {
  try {
    await areasStore.deleteArea(area.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Área eliminada correctamente', life: 3000 });
  } catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const confirmDeleteArea = (area) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar el área "${area.nombre}"?`,
    () => eliminarArea(area),
    {
      header: 'Eliminar Área',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
};

// ============ ASIGNATURAS FUNCTIONS ============
const agregarNuevaAsignatura = () => {
  asignaturasStore.resetAsignatura();
  asignaturasStore.asignatura.area_id = selectedArea.value.id;
  // Pre-seleccionar el área en el store
  areasStore.selectedArea.id = selectedArea.value.id;
  areasStore.selectedArea.nombre = selectedArea.value.nombre;
  storeModalAsignaturas.toggleModalAsignatura();
};

const editarAsignatura = (asignatura) => {
  asignaturasStore.asignatura.nombre = asignatura.nombre;
  asignaturasStore.asignatura.descripcion = asignatura.descripcion || '';
  asignaturasStore.asignatura.id = asignatura.id;
  asignaturasStore.asignatura.area_id = asignatura.area_id;
  asignaturasStore.asignatura.grados = asignatura.grados || '';
  asignaturasStore.asignatura.activa = asignatura.activa;
  // Pre-seleccionar el área
  areasStore.selectedArea.id = selectedArea.value.id;
  areasStore.selectedArea.nombre = selectedArea.value.nombre;
  storeModalAsignaturas.toggleModalAsignatura();
};

const toggleActivoAsignatura = async (asignatura) => {
  try {
    await asignaturasStore.updateEstado({ id: asignatura.id, activa: !asignatura.activa });
  } catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const eliminarAsignatura = async (asignatura) => {
  try {
    await asignaturasStore.deleteAsignatura(asignatura.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Asignatura eliminada correctamente', life: 3000 });
  } catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const confirmDeleteAsignatura = (asignatura) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar la asignatura "${asignatura.nombre}"?`,
    () => eliminarAsignatura(asignatura),
    {
      header: 'Eliminar Asignatura',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
};

// Count functions for cards
const getAsignaturasCount = (area) => {
  return area.cantidad_asignaturas || 0;
};

// Load initial data
onMounted(async () => {
  await areasStore.getAreas();
});
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <main class="flex-1 overflow-y-auto">
      <!-- Top Bar -->
      <Header />

      <!-- Page Content -->
      <div class="p-8" id="areas-management">
        <!-- Header Section -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-4">{{ pageTitle }}</h1>
          
          <!-- Breadcrumb Navigation -->
          <nav class="mb-4 bg-white rounded-lg px-4 py-3 shadow-sm flex items-center gap-2">
            <!-- Home / Áreas -->
            <a 
              class="flex items-center gap-2 text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
              :class="{ 'text-gray-800': currentView === 'areas' }"
              @click="navigateToAreas"
            >
              <i class="pi pi-th-large text-lg"></i>
              <span class="font-medium">Áreas</span>
            </a>

            <!-- Separator + Area Name (when in asignaturas) -->
            <template v-if="selectedArea">
              <span class="mx-2 text-gray-400">/</span>
              <span class="text-gray-800 font-medium">
                {{ selectedArea.nombre }}
              </span>
            </template>
          </nav>
        </div>

        <!-- ============ AREAS VIEW ============ -->
        <div v-if="currentView === 'areas'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Area Cards -->
          <div 
            v-for="area in areasStore.areas" 
            :key="area.id"
            class="area-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <!-- Card Header -->
            <div class="card-header bg-purple-600 px-4 py-4">
              <h3 class="text-white text-lg font-semibold text-center truncate">
                {{ area.nombre }}
              </h3>
            </div>
            
            <!-- Card Body -->
            <div class="card-body p-4">
              <div class="flex items-center gap-2 text-gray-600 mb-2">
                <i class="pi pi-info-circle text-purple-500"></i>
                <span class="text-sm truncate">{{ area.descripcion || 'Sin descripción' }}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <i class="pi pi-book text-purple-500"></i>
                <span class="text-sm">{{ getAsignaturasCount(area) }} asignatura(s)</span>
              </div>
              <div class="mt-3">
                <span 
                  :class="area.activa ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'"
                  class="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                  @click="toggleActivoArea(area)"
                >
                  {{ area.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
            </div>
            
            <!-- Card Footer -->
            <div class="card-footer border-t border-gray-100 px-4 py-3 flex justify-between items-center bg-gray-50">
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-sm p-button-text"
                severity="danger"
                @click="confirmDeleteArea(area)"
                v-tooltip.top="'Eliminar'"
              />
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-sm p-button-text"
                severity="info"
                @click="editarArea(area)"
                v-tooltip.top="'Editar'"
              />
              <Button
                icon="pi pi-arrow-right"
                class="p-button-rounded p-button-sm p-button-text"
                :severity="area.activa ? 'success' : 'secondary'"
                :disabled="!area.activa"
                @click="navigateToAsignaturas(area)"
                v-tooltip.top="area.activa ? 'Ver asignaturas' : 'Área inactiva'"
              />
            </div>
          </div>

          <!-- Add New Area Card -->
          <div 
            class="add-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-dashed border-gray-300 hover:border-purple-400 flex items-center justify-center min-h-[240px]"
            @click="agregarNuevaArea"
          >
            <div class="text-center">
              <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i class="pi pi-plus text-3xl text-purple-600"></i>
              </div>
              <span class="text-gray-500 font-medium">Agregar Área</span>
            </div>
          </div>
        </div>

        <!-- ============ ASIGNATURAS VIEW ============ -->
        <div v-if="currentView === 'asignaturas'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Asignatura Cards -->
          <div 
            v-for="asignatura in asignaturasStore.asignaturas" 
            :key="asignatura.id"
            class="asignatura-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <!-- Card Header -->
            <div class="card-header bg-purple-600 px-4 py-4">
              <h3 class="text-white text-lg font-semibold text-center truncate">
                {{ asignatura.nombre }}
              </h3>
            </div>
            
            <!-- Card Body -->
            <div class="card-body p-4">
              <div class="flex items-center gap-2 text-gray-600 mb-2">
                <i class="pi pi-info-circle text-purple-500"></i>
                <span class="text-sm">{{ asignatura.descripcion || 'Sin descripción' }}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600 mb-2">
                <i class="pi pi-graduation-cap text-purple-500"></i>
                <span class="text-sm">Grados: {{ asignatura.grados || 'Sin asignar' }}</span>
              </div>
              <div class="mt-3">
                <span 
                  :class="asignatura.activa ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'"
                  class="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                  @click="toggleActivoAsignatura(asignatura)"
                >
                  {{ asignatura.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
            </div>
            
            <!-- Card Footer -->
            <div class="card-footer border-t border-gray-100 px-4 py-3 flex justify-between items-center bg-gray-50">
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-sm p-button-text"
                severity="danger"
                @click="confirmDeleteAsignatura(asignatura)"
                v-tooltip.top="'Eliminar'"
              />
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-sm p-button-text"
                severity="info"
                @click="editarAsignatura(asignatura)"
                v-tooltip.top="'Editar'"
              />
              <Button
                icon="pi pi-arrow-right"
                class="p-button-rounded p-button-sm p-button-text"
                severity="secondary"
                disabled
                v-tooltip.top="'Próximamente'"
              />
            </div>
          </div>

          <!-- Add New Asignatura Card -->
          <div 
            class="add-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-dashed border-gray-300 hover:border-purple-400 flex items-center justify-center min-h-[220px]"
            @click="agregarNuevaAsignatura"
          >
            <div class="text-center">
              <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i class="pi pi-plus text-3xl text-purple-600"></i>
              </div>
              <span class="text-gray-500 font-medium">Agregar Asignatura</span>
            </div>
          </div>
        </div>

        <!-- Empty State for Asignaturas -->
        <div 
          v-if="currentView === 'asignaturas' && asignaturasStore.asignaturas.length === 0"
          class="text-center py-12"
        >
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-inbox text-4xl text-gray-400"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-600 mb-2">
            No hay asignaturas registradas
          </h3>
          <p class="text-gray-400 mb-4">
            Agrega la primera asignatura para esta área
          </p>
        </div>
      </div>
    </main>
  </div>

  <!-- Modals -->
  <ModalAreas />
  <ModalAsignaturas />
</template>

<style scoped>
.area-card,
.asignatura-card {
  min-height: 240px;
  display: flex;
  flex-direction: column;
}

.card-body {
  flex: 1;
}

.add-card:hover .pi-plus {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}
</style>
