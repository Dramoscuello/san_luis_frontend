<script setup>
import { computed, onMounted } from "vue";
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import Button from 'primevue/button';
import ToggleSwitch from 'primevue/toggleswitch';
import { usePeriodosStore } from "@/stores/periodos.js";
import { useModalPeriodosStore } from "@/stores/modalPeriodos.js";
import ModalPeriodos from "@/components/ModalPeriodos.vue";
import { useToast } from "primevue/usetoast";

const periodosStore = usePeriodosStore();
const storeModalPeriodos = useModalPeriodosStore();
const toast = useToast();

// Verificar si hay un periodo activo
const periodoActivo = computed(() => {
  return periodosStore.periodos.find(p => p.activo);
});

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return 'Sin fecha';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Verificar si el toggle debe estar deshabilitado
const isToggleDisabled = (periodo) => {
  // Si el periodo está activo, puede desactivarse
  if (periodo.activo) return false;
  // Si hay otro periodo activo, no puede activarse
  return !!periodoActivo.value;
};

// Toggle estado
const handleToggleEstado = async (periodo) => {
  // Si intenta activar y ya hay uno activo, mostrar mensaje
  if (!periodo.activo && periodoActivo.value) {
    toast.add({
      severity: 'warn',
      summary: 'Advertencia',
      detail: `Debe desactivar "${periodoActivo.value.nombre}" antes de activar otro periodo`,
      life: 4000
    });
    return;
  }

  const nuevoEstado = !periodo.activo;
  try {
    await periodosStore.toggleEstado(periodo.id, nuevoEstado);
    toast.add({
      severity: 'info',
      summary: 'OK',
      detail: `Periodo ${nuevoEstado ? 'activado' : 'desactivado'}`,
      life: 3000
    });
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

// Open modal for editing
const editarPeriodo = (periodo) => {
  if (!periodo.activo) return;
  periodosStore.setPeriodo(periodo);
  storeModalPeriodos.toggleModalPeriodo();
};

// Load initial data
onMounted(async () => {
  await periodosStore.getPeriodos();
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
      <div class="p-8" id="periodos-management">
        <!-- Header Section -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-4">Periodos Academicos</h1>
        </div>

        <!-- Periodos Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <!-- Periodo Card -->
          <div
            v-for="periodo in periodosStore.periodos"
            :key="periodo.id"
            class="periodo-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
          >
            <!-- Card Header -->
            <div
              class="card-header px-4 py-4"
              :class="periodo.activo ? 'bg-blue-600' : 'bg-gray-400'"
            >
              <h3 class="text-white text-lg font-semibold text-center truncate">
                {{ periodo.nombre }}
              </h3>
            </div>

            <!-- Card Body -->
            <div class="card-body p-4">
              <div class="flex items-center gap-2 text-gray-600 mb-3">
                <i class="pi pi-calendar-plus text-blue-500"></i>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-400">Fecha inicio</span>
                  <span class="text-sm font-medium">{{ formatDate(periodo.fecha_inicio) }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <i class="pi pi-calendar-minus text-blue-500"></i>
                <div class="flex flex-col">
                  <span class="text-xs text-gray-400">Fecha fin</span>
                  <span class="text-sm font-medium">{{ formatDate(periodo.fecha_fin) }}</span>
                </div>
              </div>
            </div>

            <!-- Card Footer -->
            <div class="card-footer border-t border-gray-100 px-4 py-3 flex justify-between items-center bg-gray-50">
              <div
                class="flex items-center gap-2"
                v-tooltip.top="isToggleDisabled(periodo) ? `Desactive '${periodoActivo?.nombre}' primero` : ''"
              >
                <ToggleSwitch
                  :modelValue="periodo.activo"
                  :disabled="isToggleDisabled(periodo)"
                  @update:modelValue="handleToggleEstado(periodo)"
                />
                <span class="text-xs text-gray-500">{{ periodo.activo ? 'Activo' : 'Inactivo' }}</span>
              </div>
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-sm p-button-text"
                :severity="periodo.activo ? 'info' : 'secondary'"
                :disabled="!periodo.activo"
                @click="editarPeriodo(periodo)"
                v-tooltip.top="periodo.activo ? 'Editar fechas' : 'Active el periodo para editar'"
              />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="periodosStore.periodos.length === 0"
          class="text-center py-12"
        >
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-calendar text-4xl text-gray-400"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-600 mb-2">
            No hay periodos registrados
          </h3>
          <p class="text-gray-400">
            Los periodos academicos se crean desde el backend
          </p>
        </div>
      </div>
    </main>
  </div>

  <!-- Modal -->
  <ModalPeriodos />
</template>

<style scoped>
.periodo-card {
  min-height: 220px;
  display: flex;
  flex-direction: column;
}

.card-body {
  flex: 1;
}
</style>
