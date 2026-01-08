<script setup>
/**
 * ============================================
 * VISTA DE GESTIÓN DE PUBLICACIONES (DIRECTIVOS)
 * ============================================
 * Esta vista permite:
 * - Crear nuevas publicaciones con soporte para archivos
 * - Editar publicaciones existentes (título, contenido, reemplazar archivo)
 * - Ver y eliminar publicaciones
 * Solo accesible para coordinadores y rector
 */

import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import FileUpload from 'primevue/fileupload';
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { usePublicacionesStore } from "@/stores/publicaciones.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";

const publicacionesStore = usePublicacionesStore();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// Computed para saber si estamos editando
const isEditing = computed(() => publicacionesStore.modoEdicion);
const archivoActual = computed(() => publicacionesStore.publicacion.nombre_archivo);

// Mostrar solo las 5 publicaciones más recientes
const ultimasPublicaciones = computed(() => {
  return publicacionesStore.publicaciones.slice(0, 5);
});

// Verificar si hay más de 5 publicaciones
const hayMasPublicaciones = computed(() => {
  return publicacionesStore.publicaciones.length > 5;
});

// Ir a ver todas las publicaciones
const verTodasPublicaciones = () => {
  router.push({ name: 'all_publicaciones' });
};

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
 * Maneja la selección de archivo
 */
const onFileSelect = (event) => {
  // Guardar en el store directamente
  publicacionesStore.publicacion.archivo = event.files[0];
};

/**
 * Limpia el archivo seleccionado (nuevo)
 */
const clearNewFile = () => {
  publicacionesStore.publicacion.archivo = null;
};

/**
 * Marca el archivo actual para eliminación (en modo edición)
 */
const eliminarArchivoActual = () => {
  publicacionesStore.limpiarArchivo();
  // También marcamos explícitamente que queremos eliminarlo
  publicacionesStore.publicacion.drive_file_id = null; 
};

/**
 * Limpia el formulario y sale del modo edición
 */
const limpiarFormulario = () => {
  publicacionesStore.resetPublicacion();
};

/**
 * Carga una publicación en el formulario para editar
 */
const editarPublicacion = (publicacion) => {
  publicacionesStore.setPublicacionParaEditar(publicacion);
  
  // Scrollear hacia arriba para ver el formulario
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Publica una nueva publicación o actualiza la existente
 */
const guardarPublicacion = async () => {
  const titulo = publicacionesStore.publicacion.titulo?.trim() || '';
  const contenido = publicacionesStore.publicacion.contenido?.trim() || '';

  // Validaciones
  if (!titulo) {
    toast.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El título es obligatorio', life: 3000 });
    return;
  }
  if (titulo.length < 5) {
    toast.add({ severity: 'warn', summary: 'Título muy corto', detail: 'El título debe tener al menos 5 caracteres', life: 3000 });
    return;
  }
  
  if (!contenido) {
    toast.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El contenido es obligatorio', life: 3000 });
    return;
  }
  if (contenido.length < 10) {
    toast.add({ severity: 'warn', summary: 'Contenido muy corto', detail: 'El contenido debe tener al menos 10 caracteres', life: 3000 });
    return;
  }

  try {
    if (isEditing.value) {
      // ACTUALIZAR
      await publicacionesStore.actualizarPublicacion({
        eliminarArchivo: archivoActual.value === '' && !publicacionesStore.publicacion.archivo
      });
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'La publicación ha sido actualizada', life: 3000 });
    } else {
      // CREAR
      await publicacionesStore.crearPublicacion();
      toast.add({ severity: 'success', summary: 'Publicado', detail: 'La publicación se ha creado correctamente', life: 3000 });
    }
  } catch (error) {
    console.error('Error al guardar:', error);
    
    // Extraer mensaje de error del backend (FastAPI suele devolver 'detail')
    let errorMsg = 'Ocurrió un error al guardar la publicación';
    const detail = error.response?.data?.detail;
    
    if (detail) {
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        // Errores de validación de Pydantic vienen como array
        errorMsg = detail.map(e => e.msg || e.message).join(', ');
      }
    }
    
    toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 5000 });
  }
};

/**
 * Elimina una publicación
 */
const eliminarPublicacion = async (publicacion) => {
  try {
    await publicacionesStore.eliminarPublicacion(publicacion.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'La publicación ha sido eliminada', life: 3000 });
    
    // Si estábamos editando esta misma publicación, limpiar formulario
    if (isEditing.value && publicacionesStore.publicacion.id === publicacion.id) {
      limpiarFormulario();
    }
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
          <h1 class="text-2xl font-bold text-gray-800">Gestión de Publicaciones</h1>
          <p class="text-gray-500 text-sm mt-1">Crea y administra comunicados institucionales</p>
        </div>

        <div class="flex gap-6 flex-col lg:flex-row">
          <!-- Panel izquierdo: Editor de publicación (Crear/Editar) -->
          <div class="flex-1 lg:max-w-2xl">
            <Card class="shadow-sm border-t-4" :class="isEditing ? 'border-orange-500' : 'border-blue-500'">
              <template #title>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i :class="isEditing ? 'pi pi-pencil text-orange-500' : 'pi pi-plus text-blue-500'"></i>
                    <span :class="isEditing ? 'text-orange-600' : 'text-blue-600'">
                      {{ isEditing ? 'Editar Publicación' : 'Nueva Publicación' }}
                    </span>
                  </div>
                  <span v-if="isEditing" class="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                    Editando ID: {{ publicacionesStore.publicacion.id }}
                  </span>
                </div>
              </template>
              <template #content>
                <!-- Título -->
                <div class="mb-4">
                  <label for="titulo" class="block font-semibold text-gray-700 mb-2">Título *</label>
                  <InputText
                    id="titulo"
                    v-model="publicacionesStore.publicacion.titulo"
                    placeholder="Ej: Reunión general de docentes"
                    class="w-full"
                  />
                </div>

                <!-- Contenido -->
                <div class="mb-4">
                  <label for="contenido" class="block font-semibold text-gray-700 mb-2">Contenido *</label>
                  <Textarea
                    id="contenido"
                    v-model="publicacionesStore.publicacion.contenido"
                    rows="6"
                    placeholder="Escribe el contenido de la publicación..."
                    class="w-full"
                    autoResize
                  />
                </div>

                <!-- Sección de Archivos -->
                <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label class="block font-semibold text-gray-700 mb-2">Archivo adjunto</label>
                  
                  <!-- Caso 1: Archivo existente (Modo Edición) -->
                  <div v-if="archivoActual" class="flex items-center justify-between bg-white p-3 rounded border border-blue-200 mb-3">
                    <div class="flex items-center gap-3">
                      <i class="pi pi-file-pdf text-red-500 text-xl"></i>
                      <div>
                        <p class="text-sm font-medium text-gray-700">{{ archivoActual }}</p>
                        <p class="text-xs text-gray-500">Archivo actual en Drive</p>
                      </div>
                    </div>
                    <Button
                      icon="pi pi-trash"
                      severity="danger"
                      text
                      rounded
                      size="small"
                      v-tooltip="'Eliminar archivo actual'"
                      @click="eliminarArchivoActual"
                    />
                  </div>

                  <!-- Caso 2: Nuevo archivo seleccionado -->
                  <div class="flex items-center gap-3">
                    <div class="flex-1">
                      <FileUpload
                        mode="basic"
                        name="archivo"
                        accept=".pdf,.docx,.doc,.xlsx,.xls,.jpg,.png"
                        :maxFileSize="10485760"
                        :auto="false"
                        @select="onFileSelect"
                        chooseLabel="Seleccionar archivo"
                        class="w-full"
                      />
                    </div>
                    
                    <span v-if="publicacionesStore.publicacion.archivo" class="text-sm text-green-600 flex items-center gap-2 bg-green-50 px-3 py-2 rounded border border-green-200">
                      <i class="pi pi-file"></i>
                      {{ publicacionesStore.publicacion.archivo.name }}
                      <i 
                        class="pi pi-times cursor-pointer text-red-500 hover:text-red-700" 
                        @click="clearNewFile"
                        v-tooltip="'Cancelar selección'"
                      ></i>
                    </span>
                  </div>
                  <small class="text-gray-500 block mt-2">
                    Formatos: PDF, Word, Excel, Imágenes (máx. 10MB).
                    <span v-if="isEditing && archivoActual" class="text-orange-600">
                      Subir un nuevo archivo reemplazará al actual.
                    </span>
                  </small>
                </div>

                <!-- Botones de acción -->
                <div class="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button
                    v-if="isEditing"
                    label="Cancelar Edición"
                    severity="secondary"
                    outlined
                    icon="pi pi-times"
                    @click="limpiarFormulario"
                  />
                  <Button
                    v-else
                    label="Limpiar"
                    severity="secondary"
                    outlined
                    @click="limpiarFormulario"
                  />
                  
                  <Button
                    :label="isEditing ? 'Guardar Cambios' : 'Publicar'"
                    :icon="isEditing ? 'pi pi-check' : 'pi pi-send'"
                    :severity="isEditing ? 'warning' : 'primary'"
                    @click="guardarPublicacion"
                    :loading="publicacionesStore.loading"
                  />
                </div>
              </template>
            </Card>
          </div>

          <!-- Panel derecho: Lista de publicaciones -->
          <div class="flex-1 lg:max-w-xl">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-700">Últimas publicaciones</h2>
              <span class="text-sm text-gray-500">Mostrando {{ ultimasPublicaciones.length }} de {{ publicacionesStore.publicaciones.length }}</span>
            </div>

            <div class="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar">
              <!-- Loading state -->
              <div
                v-if="publicacionesStore.loading && publicacionesStore.publicaciones.length === 0"
                class="text-center py-8 bg-white rounded-lg border border-gray-200"
              >
                <i class="pi pi-spin pi-spinner text-3xl text-blue-500 mb-3"></i>
                <p class="text-gray-500 text-sm">Cargando...</p>
              </div>

              <!-- Empty state -->
              <div
                v-else-if="publicacionesStore.publicaciones.length === 0"
                class="text-center py-10 bg-white rounded-lg border border-gray-200"
              >
                <i class="pi pi-inbox text-4xl text-gray-300 mb-3"></i>
                <h4 class="font-semibold text-gray-600 mb-1">Sin publicaciones</h4>
                <p class="text-gray-400 text-sm">Crea tu primera publicación usando el formulario.</p>
              </div>

              <!-- Lista compacta de publicaciones (máximo 5) -->
              <div
                v-for="pub in ultimasPublicaciones"
                :key="pub.id"
                class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 group"
                :class="{'border-l-4 border-l-orange-400': isEditing && publicacionesStore.publicacion.id === pub.id}"
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
                      icon="pi pi-pencil"
                      severity="warning"
                      text
                      rounded
                      size="small"
                      @click="editarPublicacion(pub)"
                      v-tooltip.top="'Editar'"
                    />
                    <Button
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

            <!-- Botón para ver todas las publicaciones -->
            <div v-if="publicacionesStore.publicaciones.length > 0" class="mt-4">
              <Button
                label="Mostrar detalles"
                icon="pi pi-list"
                severity="secondary"
                outlined
                class="w-full"
                @click="verTodasPublicaciones"
              />
            </div>
          </div>
        </div>
      </div>
    </main>
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
