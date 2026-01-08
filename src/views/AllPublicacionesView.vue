<script setup>
/**
 * ============================================
 * VISTA DE TODAS LAS PUBLICACIONES
 * ============================================
 * Esta vista muestra todas las publicaciones con:
 * - Grid de 2 columnas
 * - Paginador de 8 elementos
 * - Botones de editar/eliminar para coordinador/rector
 */

import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';
import { onMounted, computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePublicacionesStore } from "@/stores/publicaciones.js";
import { useUserStore } from "@/stores/user.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";

const publicacionesStore = usePublicacionesStore();
const userStore = useUserStore();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// Usuario actual
const currentUser = computed(() => userStore.userLogged);

// Verificar si es coordinador o rector (puede editar/eliminar)
const puedeEditar = computed(() => {
  const rol = currentUser.value?.rol?.toLowerCase();
  return rol === 'coordinador' || rol === 'rector';
});

// Paginación
const first = ref(0);
const rows = ref(8);

// Publicaciones paginadas
const publicacionesPaginadas = computed(() => {
  const start = first.value;
  const end = start + rows.value;
  return publicacionesStore.publicaciones.slice(start, end);
});

// Total de registros
const totalRecords = computed(() => publicacionesStore.publicaciones.length);

// Cambio de página
const onPageChange = (event) => {
  first.value = event.first;
};

onMounted(async () => {
  // Cargar usuario si no está disponible
  if (!userStore.userLogged.rol) {
    await userStore.getUserLogged();
  }
  // Cargar publicaciones
  await publicacionesStore.getPublicaciones();
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
 * Obtiene las iniciales del nombre del autor
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
 * Obtiene el color del badge según el rol
 */
const getRolColor = (rol) => {
  if (!rol) return 'bg-gray-500';
  const colors = {
    'rector': 'bg-purple-500',
    'coordinador': 'bg-blue-500',
    'docente': 'bg-green-500'
  };
  return colors[rol.toLowerCase()] || 'bg-gray-500';
};

/**
 * Redirige a la vista de edición
 */
const editarPublicacion = (publicacion) => {
  publicacionesStore.setPublicacionParaEditar(publicacion);
  router.push({ name: 'publicaciones' });
};

/**
 * Elimina una publicación
 */
const eliminarPublicacion = async (publicacion) => {
  try {
    await publicacionesStore.eliminarPublicacion(publicacion.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'La publicación ha sido eliminada', life: 3000 });
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la publicación', life: 3000 });
  }
};

/**
 * Confirma la eliminación
 */
const confirmarEliminar = (publicacion) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar la publicación "${publicacion.titulo}"?`,
    () => eliminarPublicacion(publicacion),
    {
      header: 'Eliminar Publicación',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
};

/**
 * Abre el archivo en una nueva pestaña
 */
const verArchivo = (publicacion) => {
  if (publicacion.drive_view_link) {
    window.open(publicacion.drive_view_link, '_blank');
  }
};

/**
 * Volver a la vista de gestión
 */
const volverAGestion = () => {
  router.push({ name: 'publicaciones' });
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
              <h1 class="text-2xl font-bold text-gray-800">Todas las Publicaciones</h1>
            </div>
            <p class="text-gray-500 text-sm mt-1 ml-12">Visualiza todas las publicaciones institucionales</p>
          </div>
          <span class="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
            {{ totalRecords }} publicaciones
          </span>
        </div>

        <!-- Grid de publicaciones -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <!-- Loading state -->
          <div
            v-if="publicacionesStore.loading && publicacionesStore.publicaciones.length === 0"
            class="lg:col-span-2 text-center py-8 bg-white rounded-lg border border-gray-200"
          >
            <i class="pi pi-spin pi-spinner text-3xl text-blue-500 mb-3"></i>
            <p class="text-gray-500 text-sm">Cargando...</p>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="publicacionesStore.publicaciones.length === 0"
            class="lg:col-span-2 text-center py-10 bg-white rounded-lg border border-gray-200"
          >
            <i class="pi pi-inbox text-4xl text-gray-300 mb-3"></i>
            <h4 class="font-semibold text-gray-600 mb-1">Sin publicaciones</h4>
            <p class="text-gray-400 text-sm">No hay publicaciones disponibles.</p>
          </div>

          <!-- Lista de publicaciones -->
          <div
            v-for="pub in publicacionesPaginadas"
            :key="pub.id"
            class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 group"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="flex-1 min-w-0">
                <!-- Título -->
                <h3 class="font-semibold text-gray-800 truncate">{{ pub.titulo }}</h3>

                <!-- Autor y fecha -->
                <div class="flex items-center gap-2 mt-1 flex-wrap">
                  <div
                    :class="getRolColor(pub.autor?.rol)"
                    class="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                  >
                    {{ getInitials(pub.autor?.nombre_completo) }}
                  </div>
                  <span class="text-xs text-gray-500">{{ pub.autor?.nombre_completo }}</span>
                  <span class="text-gray-300">•</span>
                  <span class="text-xs text-gray-400">{{ formatDate(pub.created_at) }}</span>
                </div>

                <!-- Contenido (preview) -->
                <p class="text-sm text-gray-600 mt-2 line-clamp-2">{{ pub.contenido }}</p>

                <!-- Indicador de archivo -->
                <div v-if="pub.drive_file_id" class="flex items-center gap-1 mt-2">
                  <i class="pi pi-paperclip text-gray-400 text-xs"></i>
                  <span class="text-xs text-gray-500 truncate max-w-[200px]">{{ pub.nombre_archivo_original }}</span>
                </div>
              </div>

              <!-- Botones de acciones -->
              <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  v-if="pub.drive_file_id"
                  icon="pi pi-eye"
                  severity="info"
                  text
                  rounded
                  size="small"
                  @click="verArchivo(pub)"
                  v-tooltip.top="'Ver archivo'"
                />
                <Button
                  v-if="puedeEditar"
                  icon="pi pi-pencil"
                  severity="warning"
                  text
                  rounded
                  size="small"
                  @click="editarPublicacion(pub)"
                  v-tooltip.top="'Editar'"
                />
                <Button
                  v-if="puedeEditar"
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  @click="confirmarEliminar(pub)"
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

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
