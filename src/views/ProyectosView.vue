<script setup>
/**
 * ============================================
 * VISTA DE GESTIÓN DE PROYECTOS PEDAGÓGICOS
 * ============================================
 * Vista para docentes:
 * - Crear nuevos proyectos (Formulario izquierda)
 * - Ver lista de proyectos creados (Derecha)
 * - Editar y Eliminar proyectos
 */

import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Calendar from 'primevue/calendar';
import FileUpload from 'primevue/fileupload';
import Dialog from 'primevue/dialog';
import { onMounted, computed, ref } from 'vue';
import { useProyectosStore } from "@/stores/proyectos.js";
import { useUserStore } from "@/stores/user.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";

const proyectosStore = useProyectosStore();
const userStore = useUserStore();
const toast = useToast();
const confirm = useConfirm();

// Referencia al FileUpload
const fileUploadRef = ref(null);

// Modal de detalle
const modalDetalleVisible = ref(false);
const proyectoSeleccionado = ref(null);

// Usuario actual
const currentUser = computed(() => userStore.userLogged);

// Estado de edición
const isEditing = computed(() => proyectosStore.modoEdicion);
const archivoActual = computed(() => proyectosStore.proyecto.nombre_archivo_original);

onMounted(async () => {
  if (!userStore.userLogged.id) {
    await userStore.getUserLogged();
  }
  await proyectosStore.getProyectos();
});

/**
 * Formatear fechas para mostrar en la lista
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  // Se asume que viene YYYY-MM-DD del backend, pero creamos objeto Date manejando zona horaria local
  const date = new Date(dateString + 'T00:00:00'); 
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Seleccionar archivo en FileUpload
 */
const onFileSelect = (event) => {
  proyectosStore.proyecto.archivo = event.files[0];
};

/**
 * Limpiar archivo seleccionado
 */
const clearNewFile = () => {
  proyectosStore.proyecto.archivo = null;
  if (fileUploadRef.value) {
    fileUploadRef.value.clear();
  }
};

/**
 * Limpiar formulario / Cancelar edición
 */
const limpiarFormulario = () => {
  proyectosStore.resetProyecto();
  clearNewFile();
};

/**
 * Cargar proyecto para editar
 */
const editarProyecto = (proyecto) => {
  proyectosStore.setProyectoParaEditar(proyecto);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Guardar Proyecto (Crear o Actualizar)
 */
const guardarProyecto = async () => {
  // Validaciones
  if (!proyectosStore.proyecto.titulo?.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'El título es obligatorio', life: 3000 });
    return;
  }
  if (!proyectosStore.proyecto.descripcion?.trim()) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'La descripción es obligatoria', life: 3000 });
    return;
  }
  if (!proyectosStore.proyecto.fecha_inicio) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'La fecha de inicio es obligatoria', life: 3000 });
    return;
  }
  
  // Archivo obligatorio al crear
  if (!isEditing.value && !proyectosStore.proyecto.archivo) {
    toast.add({ severity: 'warn', summary: 'Requerido', detail: 'El archivo adjunto es obligatorio', life: 3000 });
    return;
  }

  try {
    if (isEditing.value) {
      await proyectosStore.actualizarProyecto();
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Proyecto actualizado correctamente', life: 3000 });
    } else {
      await proyectosStore.crearProyecto();
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Proyecto creado correctamente', life: 3000 });
    }
    clearNewFile();
  } catch (error) {
    console.error(error);
    const msg = error.response?.data?.detail || 'Error al guardar el proyecto';
    toast.add({ severity: 'error', summary: 'Error', detail: msg, life: 5000 });
  }
};

/**
 * Eliminar Proyecto
 */
const eliminarProyecto = async (proyecto) => {
  try {
    await proyectosStore.eliminarProyecto(proyecto.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'El proyecto ha sido eliminado', life: 3000 });
    if (isEditing.value && proyectosStore.proyecto.id === proyecto.id) {
      limpiarFormulario();
    }
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el proyecto', life: 3000 });
  }
};

const confirmarEliminar = (proyecto) => {
  confirmAlert(
    confirm,
    `¿Estás seguro de eliminar el proyecto "${proyecto.titulo}"?`,
    () => eliminarProyecto(proyecto),
    {
       header: 'Eliminar Proyecto',
       acceptProps: { label: 'Eliminar', severity: 'danger' }
    }
  );
};

/**
 * Ver Detalle de Proyecto
 */
const verDetalle = (proyecto) => {
  proyectoSeleccionado.value = proyecto;
  modalDetalleVisible.value = true;
};

/**
 * Ver Archivo Adjunto
 */
const verArchivo = (link) => {
  if (link) window.open(link, '_blank');
};

</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <Header />

      <div class="p-8">
        <!-- Header Section -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Proyectos Pedagógicos</h1>
          <p class="text-gray-500 text-sm mt-1">
            Gestiona tus proyectos transversales y de aula
          </p>
        </div>

        <div class="flex gap-6 flex-col lg:flex-row">
          
          <!-- IZQUIERDA: FORMULARIO -->
          <div class="flex-1 lg:max-w-xl">
            <Card class="shadow-sm border-t-4" :class="isEditing ? 'border-orange-500' : 'border-blue-500'">
              <template #title>
                <div class="flex items-center gap-2 text-lg">
                  <i :class="isEditing ? 'pi pi-pencil text-orange-500' : 'pi pi-plus-circle text-blue-500'"></i>
                  <span :class="isEditing ? 'text-orange-700' : 'text-blue-700'">
                    {{ isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto' }}
                  </span>
                </div>
              </template>
              
              <template #content>
                <div class="space-y-4">
                  <!-- Título -->
                  <div>
                    <label class="block font-semibold text-gray-700 mb-1 text-sm">Título *</label>
                    <InputText 
                      v-model="proyectosStore.proyecto.titulo" 
                      placeholder="Ej: Proyecto de Lectoescritura"
                      class="w-full" 
                    />
                  </div>

                  <!-- Descripción -->
                  <div>
                    <label class="block font-semibold text-gray-700 mb-1 text-sm">Descripción *</label>
                    <Textarea 
                      v-model="proyectosStore.proyecto.descripcion" 
                      rows="3" 
                      placeholder="Breve descripción del proyecto..."
                      class="w-full"
                    />
                  </div>

                  <!-- Objetivos -->
                  <div>
                    <label class="block font-semibold text-gray-700 mb-1 text-sm">Objetivos</label>
                    <Textarea 
                      v-model="proyectosStore.proyecto.objetivos" 
                      rows="3" 
                      placeholder="Objetivos generales y específicos..."
                      class="w-full"
                    />
                  </div>

                  <!-- Fechas -->
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block font-semibold text-gray-700 mb-1 text-sm">Fecha Inicio *</label>
                      <Calendar 
                        v-model="proyectosStore.proyecto.fecha_inicio" 
                        dateFormat="dd/mm/yy"
                        showIcon 
                        class="w-full"
                        placeholder="Selecciona fecha"
                      />
                    </div>
                    <div>
                      <label class="block font-semibold text-gray-700 mb-1 text-sm">Fecha Fin</label>
                      <Calendar 
                        v-model="proyectosStore.proyecto.fecha_fin_estimada" 
                        dateFormat="dd/mm/yy"
                        showIcon 
                        class="w-full"
                         placeholder="Selecciona fecha"
                      />
                    </div>
                  </div>

                  <!-- Archivo Adjunto -->
                  <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                     <label class="block font-semibold text-gray-700 mb-2 text-sm">
                        Documento del Proyecto * 
                        <span class="text-gray-400 font-normal text-xs">(PDF, Word)</span>
                     </label>

                     <div v-if="isEditing && archivoActual" class="flex items-center justify-between bg-white p-2 rounded border border-blue-100 mb-3">
                        <div class="flex items-center gap-2 overflow-hidden">
                           <i class="pi pi-file text-blue-500"></i>
                           <span class="text-sm text-gray-600 truncate">{{ archivoActual }}</span>
                        </div>
                     </div>

                     <div class="flex items-center gap-2">
                        <div class="flex-1">
                          <FileUpload
                            ref="fileUploadRef"
                            mode="basic"
                            name="archivo"
                            accept=".pdf,.docx,.doc"
                            :maxFileSize="10485760"
                            :auto="false"
                            @select="onFileSelect"
                            :chooseLabel="isEditing && archivoActual ? 'Cambiar archivo' : 'Seleccionar archivo'"
                            class="w-full"
                          />
                        </div>
                        <Button
                          v-if="proyectosStore.proyecto.archivo"
                          icon="pi pi-times"
                          severity="danger"
                          text
                          rounded
                          @click="clearNewFile"
                          v-tooltip="'Quitar archivo seleccionado'"
                        />
                     </div>
                  </div>
                </div>

                <!-- Botones Formulario -->
                <div class="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100">
                  <Button 
                    label="Cancelar" 
                    icon="pi pi-times" 
                    severity="secondary" 
                    outlined 
                    @click="limpiarFormulario"
                  />
                  <Button 
                    :label="isEditing ? 'Guardar Cambios' : 'Crear Proyecto'" 
                    :icon="isEditing ? 'pi pi-check' : 'pi pi-save'" 
                    :loading="proyectosStore.loading"
                    @click="guardarProyecto"
                  />
                </div>
              </template>
            </Card>
          </div>

          <!-- DERECHA: LISTA DE PROYECTOS -->
          <div class="flex-1 lg:max-w-xl">
             <div class="flex justify-between items-center mb-4">
               <h2 class="text-lg font-bold text-gray-700">Mis Proyectos</h2>
               <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                 {{ proyectosStore.proyectos.length }}
               </span>
             </div>

             <!-- Loading -->
             <div v-if="proyectosStore.loading && proyectosStore.proyectos.length === 0" class="flex justify-center py-8">
               <i class="pi pi-spin pi-spinner text-3xl text-blue-500"></i>
             </div>

             <!-- Empty State -->
             <div v-else-if="proyectosStore.proyectos.length === 0" class="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
               <i class="pi pi-folder-open text-4xl text-gray-300 mb-3"></i>
               <p class="text-gray-500">No tienes proyectos creados aún.</p>
             </div>

             <!-- List -->
             <div v-else class="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-2 custom-scrollbar">
                <div 
                  v-for="proj in proyectosStore.proyectos" 
                  :key="proj.id"
                  class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow flex flex-col gap-2 relative group"
                  :class="{'border-l-4 border-l-orange-500': isEditing && proyectosStore.proyecto.id === proj.id}"
                >
                   <div class="flex items-start justify-between">
                     <div>
                       <h3 class="font-semibold text-gray-800 text-base mb-1">{{ proj.titulo }}</h3>
                       <p class="text-xs text-gray-500 mb-2 line-clamp-2">{{ proj.descripcion }}</p>
                       <div class="flex items-center gap-3 text-xs text-gray-400">
                          <span v-if="proj.fecha_inicio">
                            <i class="pi pi-calendar mr-1"></i>
                            {{ formatDate(proj.fecha_inicio) }}
                          </span>
                          <span v-if="proj.fecha_fin_estimada">
                             <i class="pi pi-arrow-right mx-1"></i>
                             {{ formatDate(proj.fecha_fin_estimada) }}
                          </span>
                       </div>
                     </div>
                     
                     <!-- Actions -->
                     <div class="flex gap-1">
                        <Button 
                          icon="pi pi-eye" 
                          text 
                          rounded 
                          severity="info" 
                          size="small" 
                          @click="verDetalle(proj)"
                          v-tooltip.top="'Ver detalle'"
                        />
                        <Button 
                          icon="pi pi-pencil" 
                          text 
                          rounded 
                          severity="warning" 
                          size="small"
                          @click="editarProyecto(proj)" 
                          v-tooltip.top="'Editar'"
                        />
                        <Button 
                          icon="pi pi-trash" 
                          text 
                          rounded 
                          severity="danger" 
                          size="small"
                          @click="confirmarEliminar(proj)" 
                          v-tooltip.top="'Eliminar'"
                        />
                     </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </main>

    <!-- Dialogue Detalle Proyecto -->
    <Dialog 
      v-model:visible="modalDetalleVisible" 
      modal 
      :header="proyectoSeleccionado?.titulo" 
      class="w-[90vw] md:w-[50vw]"
    >
       <div v-if="proyectoSeleccionado" class="space-y-4">
         <div>
            <h4 class="font-semibold text-gray-700">Descripción</h4>
            <p class="text-gray-600 text-sm whitespace-pre-line">{{ proyectoSeleccionado.descripcion }}</p>
         </div>
         <div v-if="proyectoSeleccionado.objetivos">
            <h4 class="font-semibold text-gray-700">Objetivos</h4>
            <p class="text-gray-600 text-sm whitespace-pre-line">{{ proyectoSeleccionado.objetivos }}</p>
         </div>
         <div class="flex gap-4 p-4 bg-gray-50 rounded text-sm">
             <div>
                <span class="block text-gray-500 text-xs">Fecha Inicio</span>
                <span class="font-medium">{{ formatDate(proyectoSeleccionado.fecha_inicio) }}</span>
             </div>
             <div v-if="proyectoSeleccionado.fecha_fin_estimada">
                <span class="block text-gray-500 text-xs">Fecha Fin</span>
                <span class="font-medium">{{ formatDate(proyectoSeleccionado.fecha_fin_estimada) }}</span>
             </div>
         </div>
       </div>
       <template #footer>
          <div class="flex justify-end gap-2">
             <Button label="Cerrar" text severity="secondary" @click="modalDetalleVisible = false" />
             <Button 
                v-if="proyectoSeleccionado?.drive_view_link"
                label="Ver Documento" 
                icon="pi pi-external-link" 
                @click="verArchivo(proyectoSeleccionado.drive_view_link)" 
             />
          </div>
       </template>
    </Dialog>
  </div>
</template>

<style scoped>
/* Custom Scrollbar for lists */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #f1f1f1; 
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1; 
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; 
}
</style>
