<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { useUserStore } from "@/stores/user.js";
import { useEstudiantesStore } from "@/stores/estudiantes.js";
import ModalObservador from "@/components/ModalObservador.vue";

const userStore = useUserStore();
const estudiantesStore = useEstudiantesStore();
const router = useRouter();

// State
const showStudentsTable = ref(false);
const selectedGrupo = ref(null);

// Modal Observador State
const showModalObservador = ref(false);
const selectedEstudianteObs = ref(null);

// Retrieve groups from store
const grupos = computed(() => userStore.userLogged.grupos_a_cargo || []);

const navigateToEstudiantes = async (grupo) => {
  selectedGrupo.value = grupo;
  try {
      await estudiantesStore.getEstudiantesByGrupo(grupo.id);
      showStudentsTable.value = true;
  } catch (error) {
      console.error("Error al cargar estudiantes:", error);
  }
};

const backToGroups = () => {
    showStudentsTable.value = false;
    selectedGrupo.value = null;
    estudiantesStore.clearEstudiantes();
};

const openObservador = (estudiante) => {
  selectedEstudianteObs.value = estudiante;
  showModalObservador.value = true;
};

const handleReport = (estudiante) => {
    // Placeholder for report functionality
    console.log("Generar reporte para:", estudiante);
};

// Ensure we have the latest user data
onMounted(async () => {
    if (!userStore.userLogged.id) {
        await userStore.getUserLogged();
    }
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
      <div class="p-8">
        <!-- Header Section -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-4">
              {{ showStudentsTable ? `Estudiantes - ${selectedGrupo?.grado?.nombre} ${selectedGrupo?.nombre}` : 'Observador del Estudiante' }}
          </h1>
          
          <!-- Breadcrumb / Back Navigation -->
          <div v-if="showStudentsTable" class="flex items-center gap-2 mb-4">
              <Button 
                icon="pi pi-arrow-left" 
                label="Volver a grupos" 
                class="p-button-text p-button-sm" 
                @click="backToGroups"
              />
          </div>
          <p v-else class="text-gray-600">Seleccione un grupo para gestionar las observaciones de los estudiantes.</p>
        </div>

        <!-- Groups Grid (Visible if NOT showing students table) -->
        <div v-if="!showStudentsTable">
            <div v-if="grupos.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                v-for="grupo in grupos" 
                :key="grupo.id"
                class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <!-- Card Header -->
                <div class="card-header bg-gradient-to-r from-blue-400 to-green-400 px-4 py-4">
                  <h3 class="text-white text-lg font-semibold text-center truncate">
                    {{ grupo?.grado?.nombre }} - {{ grupo.nombre }}
                  </h3>
                </div>
                
                <!-- Card Body -->
                <div class="p-6 flex flex-col items-center justify-center min-h-[100px]">
                    <i class="pi pi-users text-4xl text-blue-200 mb-2"></i>
                    <span class="text-gray-500 font-medium">Grupo a cargo</span>
                </div>
                
                <!-- Card Footer -->
                <div class="border-t border-gray-100 px-4 py-3 flex justify-end items-center bg-gray-50">
                  <Button
                    icon="pi pi-arrow-right"
                    label="Entrar"
                    class="p-button-sm p-button-text"
                    severity="primary"
                    @click="navigateToEstudiantes(grupo)"
                    v-tooltip.top="'Ver estudiantes'"
                  />
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i class="pi pi-folder-open text-2xl text-gray-400"></i>
                </div>
                <h3 class="text-lg font-medium text-gray-800 mb-1">Sin grupos asignados</h3>
                <p class="text-gray-500 text-center max-w-md">
                    No tienes grupos asignados como director de grupo actualmente.
                </p>
            </div>
        </div>

        <!-- Students DataTable (Visible if showing students table) -->
        <div v-else>
            <div class="bg-white rounded-xl shadow-md overflow-hidden">
                <DataTable 
                  :value="estudiantesStore.estudiantes" 
                  :paginator="true"
                  :rows="10"
                  :rowsPerPageOptions="[5, 10, 20, 50]"
                  tableStyle="min-width: 50rem"
                  stripedRows
                  :globalFilterFields="['numero_documento', 'nombres', 'apellidos']"
                >
                  <template #empty>
                    <div class="text-center py-8">
                      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="pi pi-users text-3xl text-gray-400"></i>
                      </div>
                      <p class="text-gray-500">No hay estudiantes registrados en este grupo</p>
                    </div>
                  </template>
                  
                  <Column field="numero_documento" header="N° Documento" sortable style="width: 20%"></Column>
                  <Column field="nombres" header="Nombres" sortable style="width: 30%"></Column>
                  <Column field="apellidos" header="Apellidos" sortable style="width: 30%"></Column>
                  <Column header="Opciones" style="width: 20%">
                    <template #body="slotProps">
                      <div class="flex gap-2">
                        <Button
                          icon="pi pi-eye"
                          class="p-button-rounded p-button-sm"
                          severity="info"
                          @click="openObservador(slotProps.data)"
                          v-tooltip.top="'Ver observador'"
                        />
                         <Button
                          icon="pi pi-file"
                          class="p-button-rounded p-button-sm"
                          severity="warning"
                          @click="handleReport(slotProps.data)"
                          v-tooltip.top="'Generar reporte'"
                        />
                      </div>
                    </template>
                  </Column>
                </DataTable>
            </div>
        </div>

      </div>
    </main>
  </div>

  <ModalObservador
    v-model:visible="showModalObservador"
    :estudiante="selectedEstudianteObs"
  />
</template>
