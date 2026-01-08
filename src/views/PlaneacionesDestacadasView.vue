<script setup>
/**
 * ============================================
 * VISTA DE PLANEACIONES DESTACADAS
 * ============================================
 * Muestra las planeaciones marcadas como destacadas
 * con la razon por la cual fueron destacadas
 */

import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Paginator from 'primevue/paginator';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import { onMounted, computed, ref } from 'vue';
import { usePlaneacionesDestacadasStore } from "@/stores/planeacionesDestacadas.js";
import { useUserStore } from "@/stores/user.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";

const destacadasStore = usePlaneacionesDestacadasStore();
const userStore = useUserStore();
const toast = useToast();
const confirm = useConfirm();

// Verificar si es docente (no puede eliminar/editar destacadas)
const isDocente = computed(() => userStore.userLogged?.rol?.toLowerCase() === 'docente');

// Paginacion
const first = ref(0);
const rows = ref(6);

// Modal editar razon
const modalEditarVisible = ref(false);
const destacadaAEditar = ref(null);
const nuevaRazon = ref('');
const guardandoRazon = ref(false);

// Planeaciones paginadas
const planeacionesPaginadas = computed(() => {
  const start = first.value;
  const end = start + rows.value;
  return destacadasStore.destacadas.slice(start, end);
});

// Total de registros
const totalRecords = computed(() => destacadasStore.destacadas.length);

// Cambiar pagina
const onPageChange = (event) => {
  first.value = event.first;
};

onMounted(async () => {
  // Cargar usuario si no tiene rol
  if (!userStore.userLogged.rol) {
    await userStore.getUserLogged();
  }
  // Siempre recargar las destacadas al entrar a esta vista
  await destacadasStore.getPlaneacionesDestacadas();
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
    day: 'numeric'
  });
};

/**
 * Obtiene las iniciales del nombre
 */
const getInitials = (nombre) => {
  if (!nombre) return '??';
  return nombre
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

/**
 * Abre el archivo en una nueva pestana
 * Primero incrementa las visualizaciones
 */
const verArchivo = async (destacada) => {
  if (destacada.planeacion_drive_view_link) {
    try {
      // Incrementar visualizaciones antes de abrir
      await destacadasStore.incrementarVisualizaciones(destacada.id);
    } catch (error) {
      console.error('Error al incrementar visualizaciones:', error);
    }
    // Abrir el archivo independientemente del resultado
    window.open(destacada.planeacion_drive_view_link, '_blank');
  }
};

// ============================================
// FUNCIONES PARA EDITAR RAZON
// ============================================

/**
 * Abre el modal para editar la razon
 */
const abrirModalEditar = (destacada) => {
  destacadaAEditar.value = destacada;
  nuevaRazon.value = destacada.razon || '';
  modalEditarVisible.value = true;
};

/**
 * Cierra el modal de editar
 */
const cerrarModalEditar = () => {
  modalEditarVisible.value = false;
  destacadaAEditar.value = null;
  nuevaRazon.value = '';
};

/**
 * Guarda la nueva razon
 */
const guardarRazon = async () => {
  if (!nuevaRazon.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Campo requerido', detail: 'La razon es obligatoria', life: 3000 });
    return;
  }

  guardandoRazon.value = true;
  try {
    await destacadasStore.actualizarRazon(destacadaAEditar.value.id, nuevaRazon.value.trim());
    toast.add({ severity: 'success', summary: 'Actualizado', detail: 'La razon ha sido actualizada', life: 3000 });
    cerrarModalEditar();
  } catch (error) {
    console.error('Error al actualizar razon:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar la razon', life: 5000 });
  } finally {
    guardandoRazon.value = false;
  }
};

/**
 * Elimina una planeacion de destacadas
 */
const eliminarDestacada = async (destacada) => {
  try {
    await destacadasStore.eliminarDestacadaPorId(destacada.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'La planeacion ya no esta destacada', life: 3000 });
  } catch (error) {
    console.error('Error al eliminar destacada:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la planeacion destacada', life: 5000 });
  }
};

/**
 * Confirma la eliminacion de una destacada
 */
const confirmarEliminar = (destacada) => {
  confirmAlert(
    confirm,
    `¿Estas seguro que deseas quitar "${destacada.planeacion_titulo}" de las planeaciones destacadas?`,
    () => eliminarDestacada(destacada),
    {
      header: 'Eliminar de destacadas',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
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
        <div class="mb-6">
          <div class="flex items-center gap-3">
            <i class="pi pi-star-fill text-yellow-500 text-2xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-gray-800">Planeaciones Destacadas</h1>
              <p class="text-gray-500 text-sm mt-1">
                Planeaciones reconocidas por su calidad y contenido
              </p>
            </div>
          </div>
        </div>

        <!-- Contador -->
        <div class="mb-4 flex items-center justify-between">
          <span class="text-sm text-gray-500">
            {{ totalRecords }} planeaciones destacadas
          </span>
        </div>

        <!-- Loading state -->
        <div
          v-if="destacadasStore.loading && destacadasStore.destacadas.length === 0"
          class="text-center py-12 bg-white rounded-lg border border-gray-200"
        >
          <i class="pi pi-spin pi-spinner text-3xl text-yellow-500 mb-3"></i>
          <p class="text-gray-500 text-sm">Cargando planeaciones destacadas...</p>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="destacadasStore.destacadas.length === 0"
          class="text-center py-12 bg-white rounded-lg border border-gray-200"
        >
          <i class="pi pi-star text-4xl text-gray-300 mb-3"></i>
          <h4 class="font-semibold text-gray-600 mb-1">Sin planeaciones destacadas</h4>
          <p class="text-gray-400 text-sm">
            Aun no hay planeaciones marcadas como destacadas.
          </p>
        </div>

        <!-- Grid de planeaciones destacadas -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
          <div
            v-for="destacada in planeacionesPaginadas"
            :key="destacada.id"
            class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 group border-l-4 border-l-yellow-400"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <!-- Titulo -->
                <div class="flex items-center gap-2">
                  <i class="pi pi-star-fill text-yellow-500"></i>
                  <h3 class="font-semibold text-gray-800 truncate">{{ destacada.planeacion_titulo }}</h3>
                </div>

                <!-- Info del docente -->
                <div v-if="destacada.docente_nombre" class="flex items-center gap-2 mt-2">
                  <div class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold">
                    {{ getInitials(destacada.docente_nombre) }}
                  </div>
                  <span class="text-xs text-gray-500">{{ destacada.docente_nombre }}</span>
                </div>

                <!-- Asignatura y Sede -->
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-200">
                    {{ destacada.asignatura_nombre || 'Sin asignatura' }}
                  </span>
                  <span v-if="destacada.sede_nombre" class="bg-gray-50 text-gray-600 px-2 py-0.5 rounded text-xs border border-gray-200">
                    {{ destacada.sede_nombre }}
                  </span>
                </div>

                <!-- Visualizaciones -->
                <div class="flex items-center gap-1 mt-2">
                  <i class="pi pi-eye text-gray-400 text-xs"></i>
                  <span class="text-xs text-gray-500">{{ destacada.visualizaciones || 0 }} visualizaciones</span>
                </div>

                <!-- Razon del destacado -->
                <div class="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p class="text-xs text-yellow-700 font-semibold mb-1">
                    <i class="pi pi-comment mr-1"></i> Razon del destacado:
                  </p>
                  <p class="text-sm text-gray-700">{{ destacada.razon }}</p>
                </div>

                <!-- Archivo y fecha -->
                <div class="flex items-center gap-1 mt-3 flex-wrap">
                  <i class="pi pi-paperclip text-gray-400 text-xs"></i>
                  <span class="text-xs text-gray-500 truncate max-w-[180px]">{{ destacada.planeacion_archivo }}</span>
                  <span class="text-gray-300">•</span>
                  <span class="text-xs text-gray-400">{{ formatDate(destacada.fecha_destacado) }}</span>
                </div>

                <!-- Destacado por -->
                <div v-if="destacada.coordinador" class="flex items-center gap-1 mt-2">
                  <i class="pi pi-user text-gray-400 text-xs"></i>
                  <span class="text-xs text-gray-400">Destacado por: {{ destacada.coordinador.nombre_completo }}</span>
                </div>
              </div>

              <!-- Botones de acciones -->
              <div class="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  icon="pi pi-eye"
                  severity="info"
                  text
                  rounded
                  size="small"
                  @click="verArchivo(destacada)"
                  v-tooltip.top="'Ver archivo'"
                />
                <Button
                  v-if="!isDocente"
                  icon="pi pi-pencil"
                  severity="warning"
                  text
                  rounded
                  size="small"
                  @click="abrirModalEditar(destacada)"
                  v-tooltip.top="'Editar razon'"
                />
                <Button
                  v-if="!isDocente"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  @click="confirmarEliminar(destacada)"
                  v-tooltip.top="'Eliminar de destacadas'"
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

    <!-- Modal para editar razon -->
    <Dialog
      v-model:visible="modalEditarVisible"
      modal
      header="Editar Razon del Destacado"
      :style="{ width: '450px' }"
      :closable="!guardandoRazon"
      :closeOnEscape="!guardandoRazon"
    >
      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-3">
          Planeacion: <strong>{{ destacadaAEditar?.planeacion_titulo }}</strong>
        </p>
        <label for="nuevaRazon" class="block font-semibold text-gray-700 mb-2">
          Razon del destacado <span class="text-red-500">*</span>
        </label>
        <Textarea
          id="nuevaRazon"
          v-model="nuevaRazon"
          rows="4"
          placeholder="Escribe la razon por la cual esta planeacion merece ser destacada..."
          class="w-full"
          :disabled="guardandoRazon"
        />
        <small class="text-gray-500">Este campo es obligatorio</small>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="cerrarModalEditar"
          :disabled="guardandoRazon"
        />
        <Button
          label="Guardar"
          icon="pi pi-check"
          severity="warning"
          @click="guardarRazon"
          :loading="guardandoRazon"
        />
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
