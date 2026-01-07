<script setup>
/**
 * ============================================
 * VISTA HOME - FEED DE PUBLICACIONES
 * ============================================
 * Muestra las publicaciones/comunicados institucionales
 * Todos los usuarios pueden ver las publicaciones
 */

import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import Card from 'primevue/card';
import Button from 'primevue/button';
import { onMounted } from 'vue';
import { usePublicacionesStore } from "@/stores/publicaciones.js";

const publicacionesStore = usePublicacionesStore();

onMounted(async () => {
  await publicacionesStore.getPublicaciones();
});

/**
 * Formatea una fecha ISO a formato legible
 */
const formatDate = (dateString) => {
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
 * Abre el archivo adjunto en una nueva pestaña
 */
const abrirAdjunto = (link) => {
  if (link) {
    window.open(link, '_blank');
  }
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
          <h1 class="text-2xl font-bold text-gray-800">Publicaciones institucionales</h1>
          <p class="text-gray-500 text-sm mt-1">Comunicados y anuncios institucionales</p>
        </div>

        <!-- Lista de publicaciones -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Loading state -->
          <div
            v-if="publicacionesStore.loading"
            class="text-center py-12 bg-white rounded-lg border border-gray-200"
          >
            <i class="pi pi-spin pi-spinner text-4xl text-blue-500 mb-4"></i>
            <p class="text-gray-500">Cargando publicaciones...</p>
          </div>

          <!-- Empty state -->
          <div
            v-else-if="publicacionesStore.publicaciones.length === 0"
            class="text-center py-16 bg-white rounded-lg border border-gray-200"
          >
            <i class="pi pi-inbox text-5xl text-gray-300 mb-4"></i>
            <h3 class="text-lg font-semibold text-gray-600 mb-2">No hay publicaciones</h3>
            <p class="text-gray-400 text-sm">Aún no se han publicado comunicados institucionales.</p>
          </div>

          <!-- Cards de publicaciones -->
          <Card
            v-for="publicacion in publicacionesStore.publicaciones"
            :key="publicacion.id"
            class="shadow-sm"
          >
            <template #header>
              <div class="flex items-center justify-between px-4 pt-4">
                <!-- Info del autor -->
                <div class="flex items-center gap-3">
                  <!-- Avatar con iniciales -->
                  <div
                    :class="getRolColor(publicacion.autor?.rol)"
                    class="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  >
                    {{ getInitials(publicacion.autor?.nombre_completo) }}
                  </div>
                  <div>
                    <p class="font-semibold text-gray-800">{{ publicacion.autor?.nombre_completo }}</p>
                    <div class="flex items-center gap-2">
                      <span
                        :class="getRolColor(publicacion.autor?.rol)"
                        class="px-2 py-0.5 rounded-full text-white text-xs capitalize"
                      >
                        {{ publicacion.autor?.rol }}
                      </span>
                      <span class="text-gray-400 text-xs">{{ formatDate(publicacion.created_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <template #title>
              <h3 class="text-lg font-semibold text-gray-800 px-0">
                {{ publicacion.titulo }}
              </h3>
            </template>

            <template #content>
              <!-- Contenido con soporte para HTML del editor -->
              <div class="text-gray-600 prose prose-sm max-w-none" v-html="publicacion.contenido"></div>

              <!-- Archivo adjunto -->
              <div
                v-if="publicacion.drive_file_id"
                class="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center gap-3"
              >
                <i class="pi pi-file-pdf text-red-500 text-xl"></i>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-700">{{ publicacion.nombre_archivo_original }}</p>
                  <p class="text-xs text-gray-500">Archivo adjunto</p>
                </div>
                <!-- Botón de Ver Archivo -->
                <Button
                  v-if="publicacion.drive_view_link"
                  icon="pi pi-external-link"
                  label="Ver archivo"
                  severity="secondary"
                  size="small"
                  outlined
                  @click="abrirAdjunto(publicacion.drive_view_link)"
                />
              </div>
            </template>
          </Card>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>

</style>
