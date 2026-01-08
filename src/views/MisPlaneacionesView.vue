<script setup>
/**
 * ============================================
 * VISTA DE TODAS MIS PLANEACIONES (DOCENTES)
 * ============================================
 * Esta vista muestra todas las planeaciones del docente con:
 * - Grid de 2 columnas
 * - Paginador de 8 elementos
 * - Botones de ver, editar y eliminar
 */

import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';
import { onMounted, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePlaneacionesStore } from "@/stores/planeaciones.js";
import { useUserStore } from "@/stores/user.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";

const planeacionesStore = usePlaneacionesStore();
const userStore = useUserStore();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// Paginación
const first = ref(0);
const rows = ref(8);

// Planeaciones paginadas
const planeacionesPaginadas = computed(() => {
  const start = first.value;
  const end = start + rows.value;
  return planeacionesStore.planeaciones.slice(start, end);
});

// Total de registros
const totalRecords = computed(() => planeacionesStore.planeaciones.length);

// Cambio de página
const onPageChange = (event) => {
  first.value = event.first;
};

onMounted(async () => {
  // Cargar usuario si no está disponible
  if (!userStore.userLogged.rol) {
    await userStore.getUserLogged();
  }
  // Cargar mis planeaciones
  await planeacionesStore.getMisPlaneaciones();
});

/**
 * Formatea una fecha ISO a formato legible
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Abre el archivo en una nueva pestaña
 */
const verArchivo = (planeacion) => {
  if (planeacion.drive_view_link) {
    window.open(planeacion.drive_view_link, '_blank');
  }
};

/**
 * Redirige a la vista de edición
 */
const editarPlaneacion = (planeacion) => {
  planeacionesStore.setPlaneacionParaEditar(planeacion);
  router.push({ name: 'planeaciones' });
};

/**
 * Elimina una planeación
 */
const eliminarPlaneacion = async (planeacion) => {
  try {
    await planeacionesStore.eliminarPlaneacion(planeacion.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'La planeación ha sido eliminada', life: 3000 });
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la planeación', life: 3000 });
  }
};

/**
 * Confirma la eliminación
 */
const confirmarEliminar = (planeacion) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar la planeación "${planeacion.titulo}"?`,
    () => eliminarPlaneacion(planeacion),
    {
      header: 'Eliminar Planeación',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
};

/**
 * Volver a la vista de gestión
 */
const volverAGestion = () => {
  router.push({ name: 'planeaciones' });
};
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
        <div class="flex items-center justify-between mb-6">
          <div>
            <div class="flex items-center gap-3">
              <Button
                icon="pi pi-arrow-left"
                severity="secondary"
                text
                rounded
                @click="volverAGestion"
                v-tooltip.top="'Volver'"
              />
              <h1 class="text-2xl font-bold text-gray-800">Todas mis Planeaciones</h1>
            </div>
            <p class="text-gray-500 text-sm mt-1 ml-12">Visualiza todas tus planeaciones de clase</p>
          </div>
          <span class="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
            {{ totalRecords }} planeaciones
          </span>
        </div>

        <!-- Grid de planeaciones -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <!-- Loading state -->
          <div
            v-if="planeacionesStore.loading && planeacionesStore.planeaciones.length === 0"
            class="lg:col-span-2 text-center py-8 bg-white rounded-lg border border-gray-200"
          >
            <i class="pi pi-spin pi-spinner text-3xl text-green-500 mb-3"></i>
            <p class="text-gray-500 text-sm">Cargando...</p>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="planeacionesStore.planeaciones.length === 0"
            class="lg:col-span-2 text-center py-10 bg-white rounded-lg border border-gray-200"
          >
            <i class="pi pi-file text-4xl text-gray-300 mb-3"></i>
            <h4 class="font-semibold text-gray-600 mb-1">Sin planeaciones</h4>
            <p class="text-gray-400 text-sm">Aún no has subido ninguna planeación.</p>
          </div>

          <!-- Lista de planeaciones -->
          <div
            v-for="plan in planeacionesPaginadas"
            :key="plan.id"
            class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 group"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <!-- Título -->
                <h3 class="font-semibold text-gray-800 truncate">{{ plan.titulo }}</h3>

                <!-- Asignatura -->
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-200">
                    {{ plan.asignatura?.nombre || 'Sin asignatura' }}
                  </span>
                  <span v-if="plan.periodo" class="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs border border-purple-200">
                    {{ plan.periodo.nombre }}
                  </span>
                </div>

                <!-- Archivo y fecha -->
                <div v-if="plan.drive_view_link" class="flex items-center gap-1 mt-2">
                  <i class="pi pi-paperclip text-gray-400 text-xs"></i>
                  <span class="text-xs text-gray-500 truncate max-w-[200px]">{{ plan.nombre_archivo_original }}</span>
                  <span class="text-gray-300">•</span>
                  <span class="text-xs text-gray-400">{{ formatDate(plan.fecha_subida) }}</span>
                </div>
              </div>

              <!-- Botones de acciones -->
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  v-if="plan.drive_view_link"
                  icon="pi pi-eye"
                  severity="info"
                  text
                  rounded
                  size="small"
                  @click="verArchivo(plan)"
                  v-tooltip.top="'Ver archivo'"
                />
                <Button
                  icon="pi pi-pencil"
                  severity="warning"
                  text
                  rounded
                  size="small"
                  @click="editarPlaneacion(plan)"
                  v-tooltip.top="'Editar'"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  @click="confirmarEliminar(plan)"
                  v-tooltip.top="'Eliminar'"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Paginator -->
        <div v-if="totalRecords > rows" class="mt-4">
          <Paginator
            :first="first"
            :rows="rows"
            :totalRecords="totalRecords"
            @page="onPageChange"
            template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
            :pt="{
              root: { class: 'bg-white rounded-lg border border-gray-200 p-2' }
            }"
          />
        </div>
      </div>
    </main>
  </div>
</template>
