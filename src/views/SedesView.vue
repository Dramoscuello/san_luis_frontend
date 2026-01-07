<script setup>
import { ref, computed, onMounted } from "vue";
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import Button from 'primevue/button';
import { useSedesStore } from "@/stores/sedes.js";
import { useGradosStore } from "@/stores/grados.js";
import { useGruposStore } from "@/stores/grupos.js";
import { useModalSedeStore } from "@/stores/modalSedes.js";
import { useModalGradoStore } from "@/stores/modalGrados.js";
import { useModalGrupoStore } from "@/stores/modalGrupos.js";
import ModalSedes from "@/components/ModalSedes.vue";
import ModalGrados from "@/components/ModalGrados.vue";
import ModalGrupos from "@/components/ModalGrupos.vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";

// Stores
const sedesStore = useSedesStore();
const gradosStore = useGradosStore();
const gruposStore = useGruposStore();
const storeModalSedes = useModalSedeStore();
const storeModalGrados = useModalGradoStore();
const storeModalGrupos = useModalGrupoStore();
const toast = useToast();
const confirm = useConfirm();

// Navigation state
const currentView = ref('sedes'); // 'sedes' | 'grados' | 'grupos'
const selectedSede = ref(null);
const selectedGrado = ref(null);

// Page title
const pageTitle = computed(() => {
  if (currentView.value === 'grupos') {
    return `Grupos de ${selectedGrado.value?.nombre}`;
  } else if (currentView.value === 'grados') {
    return `Grados de ${selectedSede.value?.nombre}`;
  }
  return 'Gestión de sedes';
});

// Navigation functions
const navigateToSedes = () => {
  currentView.value = 'sedes';
  selectedSede.value = null;
  selectedGrado.value = null;
  gradosStore.clearGrados();
  gruposStore.clearGrupos();
};

const navigateToGrados = async (sede) => {
  selectedSede.value = sede;
  selectedGrado.value = null;
  currentView.value = 'grados';
  gruposStore.clearGrupos();
  
  try {
    await gradosStore.getGradosBySede(sede.id);
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los grados', life: 3000 });
  }
};

const navigateToGrupos = async (grado) => {
  selectedGrado.value = grado;
  currentView.value = 'grupos';
  
  try {
    await gruposStore.getGruposByGrado(grado.id);
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los grupos', life: 3000 });
  }
};

// ============ SEDES FUNCTIONS ============
const agregarNuevaSede = () => {
  sedesStore.sede.nombre = '';
  sedesStore.sede.codigo = '';
  sedesStore.sede.direccion = '';
  sedesStore.sede.id = null;
  sedesStore.sede.activa = true;
  storeModalSedes.toggleModalSede();
};

const editarSede = (sede) => {
  sedesStore.sede.nombre = sede.nombre;
  sedesStore.sede.codigo = sede.codigo;
  sedesStore.sede.direccion = sede.direccion;
  sedesStore.sede.id = sede.id;
  sedesStore.sede.activa = sede.activa;
  storeModalSedes.toggleModalSede();
};

const eliminarSede = async (sede) => {
  try {
    await sedesStore.deleteSede(sede.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Sede eliminada correctamente', life: 3000 });
  } catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const confirmDeleteSede = (sede) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar la sede "${sede.nombre}"?`,
    () => eliminarSede(sede),
    {
      header: 'Eliminar Sede',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
};

// ============ GRADOS FUNCTIONS ============
const agregarNuevoGrado = () => {
  gradosStore.clearGrado();
  gradosStore.grado.sede_id = selectedSede.value.id;
  storeModalGrados.toggleModalGrado();
};

const editarGrado = (grado) => {
  gradosStore.grado.nombre = grado.nombre;
  gradosStore.grado.id = grado.id;
  gradosStore.grado.sede_id = grado.sede_id;
  storeModalGrados.toggleModalGrado();
};

const eliminarGrado = async (grado) => {
  try {
    await gradosStore.deleteGrado(grado.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Grado eliminado correctamente', life: 3000 });
  } catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const confirmDeleteGrado = (grado) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar el grado "${grado.nombre}"?`,
    () => eliminarGrado(grado),
    {
      header: 'Eliminar Grado',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
};

// ============ GRUPOS FUNCTIONS ============
const agregarNuevoGrupo = () => {
  gruposStore.clearGrupo();
  gruposStore.grupo.grado_id = selectedGrado.value.id;
  storeModalGrupos.toggleModalGrupo();
};

const editarGrupo = (grupo) => {
  gruposStore.grupo.nombre = grupo.nombre;
  gruposStore.grupo.id = grupo.id;
  gruposStore.grupo.grado_id = grupo.grado_id;
  storeModalGrupos.toggleModalGrupo();
};

const eliminarGrupo = async (grupo) => {
  try {
    await gruposStore.deleteGrupo(grupo.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Grupo eliminado correctamente', life: 3000 });
  } catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const confirmDeleteGrupo = (grupo) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar el grupo "${grupo.nombre}"?`,
    () => eliminarGrupo(grupo),
    {
      header: 'Eliminar Grupo',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
};

// Count functions for cards
const getGradosCount = (sede) => {
  return sede.cantidad_grados || 0;
};

const getGruposCount = (grado) => {
  return grado.cantidad_grupos || 0;
};

// Load initial data
onMounted(async () => {
  await sedesStore.getSedes();
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
      <div class="p-8" id="sedes-management">
        <!-- Header Section -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-4">{{ pageTitle }}</h1>
          
          <!-- Breadcrumb Navigation -->
          <nav class="mb-4 bg-white rounded-lg px-4 py-3 shadow-sm flex items-center gap-2">
            <!-- Home / Sedes -->
            <a 
              class="flex items-center gap-2 text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
              :class="{ 'text-gray-800': currentView === 'sedes' }"
              @click="navigateToSedes"
            >
              <i class="pi pi-home text-lg"></i>
              <span class="font-medium">Sedes</span>
            </a>

            <!-- Separator + Sede Name (when in grados or grupos) -->
            <template v-if="selectedSede">
              <span class="mx-2 text-gray-400">/</span>
              <a 
                v-if="currentView === 'grupos'"
                class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium transition-colors"
                @click="navigateToGrados(selectedSede)"
              >
                {{ selectedSede.nombre }}
              </a>
              <span v-else class="text-gray-800 font-medium">
                {{ selectedSede.nombre }}
              </span>
            </template>

            <!-- Separator + Grado Name (when in grupos) -->
            <template v-if="selectedGrado">
              <span class="mx-2 text-gray-400">/</span>
              <span class="text-gray-800 font-medium">
                {{ selectedGrado.nombre }}
              </span>
            </template>
          </nav>
        </div>

        <!-- ============ SEDES VIEW ============ -->
        <div v-if="currentView === 'sedes'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Sede Cards -->
          <div 
            v-for="sede in sedesStore.sedes" 
            :key="sede.id"
            class="sede-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <!-- Card Header -->
            <div class="card-header bg-blue-600 px-4 py-4">
              <h3 class="text-white text-lg font-semibold text-center truncate">
                {{ sede.nombre }}
              </h3>
            </div>
            
            <!-- Card Body -->
            <div class="card-body p-4">
              <div class="flex items-center gap-2 text-gray-600 mb-2">
                <i class="pi pi-map-marker text-blue-500"></i>
                <span class="text-sm truncate">{{ sede.direccion || 'Sin dirección' }}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600 mb-2">
                <i class="pi pi-hashtag text-blue-500"></i>
                <span class="text-sm">Código: {{ sede.codigo }}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <i class="pi pi-book text-blue-500"></i>
                <span class="text-sm">{{ getGradosCount(sede) }} grado(s)</span>
              </div>
              <div class="mt-3">
                <span 
                  :class="sede.activa ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'"
                  class="px-3 py-1 rounded-full text-xs font-semibold"
                >
                  {{ sede.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
            </div>
            
            <!-- Card Footer -->
            <div class="card-footer border-t border-gray-100 px-4 py-3 flex justify-between items-center bg-gray-50">
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-sm p-button-text"
                severity="danger"
                @click="confirmDeleteSede(sede)"
                v-tooltip.top="'Eliminar'"
              />
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-sm p-button-text"
                severity="info"
                @click="editarSede(sede)"
                v-tooltip.top="'Editar'"
              />
              <Button
                icon="pi pi-arrow-right"
                class="p-button-rounded p-button-sm p-button-text"
                severity="success"
                @click="navigateToGrados(sede)"
                v-tooltip.top="'Ver grados'"
              />
            </div>
          </div>

          <!-- Add New Sede Card -->
          <div 
            class="add-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center min-h-[240px]"
            @click="agregarNuevaSede"
          >
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i class="pi pi-plus text-3xl text-blue-600"></i>
              </div>
              <span class="text-gray-500 font-medium">Agregar Sede</span>
            </div>
          </div>
        </div>

        <!-- ============ GRADOS VIEW ============ -->
        <div v-if="currentView === 'grados'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Grado Cards -->
          <div 
            v-for="grado in gradosStore.grados" 
            :key="grado.id"
            class="grado-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <!-- Card Header -->
            <div class="card-header bg-blue-600 px-4 py-4">
              <h3 class="text-white text-lg font-semibold text-center truncate">
                {{ grado.nombre }}
              </h3>
            </div>
            
            <!-- Card Body -->
            <div class="card-body p-4">
              <div class="flex items-center gap-2 text-gray-600">
                <i class="pi pi-users text-blue-500"></i>
                <span class="text-sm">{{ getGruposCount(grado) }} grupo(s)</span>
              </div>
            </div>
            
            <!-- Card Footer -->
            <div class="card-footer border-t border-gray-100 px-4 py-3 flex justify-between items-center bg-gray-50">
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-sm p-button-text"
                severity="danger"
                @click="confirmDeleteGrado(grado)"
                v-tooltip.top="'Eliminar'"
              />
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-sm p-button-text"
                severity="info"
                @click="editarGrado(grado)"
                v-tooltip.top="'Editar'"
              />
              <Button
                icon="pi pi-arrow-right"
                class="p-button-rounded p-button-sm p-button-text"
                severity="success"
                @click="navigateToGrupos(grado)"
                v-tooltip.top="'Ver grupos'"
              />
            </div>
          </div>

          <!-- Add New Grado Card -->
          <div 
            class="add-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center min-h-[200px]"
            @click="agregarNuevoGrado"
          >
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i class="pi pi-plus text-3xl text-blue-600"></i>
              </div>
              <span class="text-gray-500 font-medium">Agregar Grado</span>
            </div>
          </div>
        </div>

        <!-- ============ GRUPOS VIEW ============ -->
        <div v-if="currentView === 'grupos'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Grupo Cards -->
          <div 
            v-for="grupo in gruposStore.grupos" 
            :key="grupo.id"
            class="grupo-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <!-- Card Header -->
            <div class="card-header bg-blue-600 px-4 py-4">
              <h3 class="text-white text-lg font-semibold text-center truncate">
                {{ grupo.nombre }}
              </h3>
            </div>
            
            <!-- Card Body -->
            <div class="card-body p-4 flex items-center justify-center">
              <span class="text-gray-500 text-sm">Grupo {{ grupo.nombre }}</span>
            </div>
            
            <!-- Card Footer -->
            <div class="card-footer border-t border-gray-100 px-4 py-3 flex justify-between items-center bg-gray-50">
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-sm p-button-text"
                severity="danger"
                @click="confirmDeleteGrupo(grupo)"
                v-tooltip.top="'Eliminar'"
              />
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-sm p-button-text"
                severity="info"
                @click="editarGrupo(grupo)"
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

          <!-- Add New Grupo Card -->
          <div 
            class="add-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center min-h-[180px]"
            @click="agregarNuevoGrupo"
          >
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i class="pi pi-plus text-3xl text-blue-600"></i>
              </div>
              <span class="text-gray-500 font-medium">Agregar Grupo</span>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div 
          v-if="(currentView === 'grados' && gradosStore.grados.length === 0) || 
                (currentView === 'grupos' && gruposStore.grupos.length === 0)"
          class="text-center py-12"
        >
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-inbox text-4xl text-gray-400"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-600 mb-2">
            {{ currentView === 'grados' ? 'No hay grados registrados' : 'No hay grupos registrados' }}
          </h3>
          <p class="text-gray-400 mb-4">
            {{ currentView === 'grados' ? 'Agrega el primer grado para esta sede' : 'Agrega el primer grupo para este grado' }}
          </p>
        </div>
      </div>
    </main>
  </div>

  <!-- Modals -->
  <ModalSedes />
  <ModalGrados />
  <ModalGrupos />
</template>

<style scoped>
.sede-card,
.grado-card,
.grupo-card {
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

/* Breadcrumb custom styles */
:deep(.p-breadcrumb) {
  background: transparent;
  border: none;
  padding: 0;
}

:deep(.p-breadcrumb-home-icon) {
  color: #2563eb;
}
</style>