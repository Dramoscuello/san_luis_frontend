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
import { useComentariosProyectosStore } from "@/stores/comentariosProyectos.js";
import proyectosService from "@/services/proyectosService.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";

const proyectosStore = useProyectosStore();
const userStore = useUserStore();
const comentariosStore = useComentariosProyectosStore();
const toast = useToast();
const confirm = useConfirm();

// Referencia al FileUpload
const fileUploadRef = ref(null);
const fileUploadEvidenciaRef = ref(null);

// Vista de detalle (inline, no modal)
const vistaDetalle = ref(false);
const proyectoSeleccionado = ref(null);

// Modal de comentarios
const modalComentariosVisible = ref(false);

// Evidencias
const evidencias = ref([]);
const loadingEvidencias = ref(false);
const modalEvidenciaVisible = ref(false);
const archivoEvidencia = ref(null);
const tituloEvidencia = ref('');
const fechaEvidencia = ref(null);
const enviandoEvidencia = ref(false);

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
    let msg = 'Error al guardar el proyecto';
    
    if (error.response?.data) {
      const data = error.response.data;
      if (data.detail) {
        if (Array.isArray(data.detail)) {
          // Si es un array (errores de validación Pydantic), extraemos los mensajes
          msg = data.detail.map(e => e.msg || JSON.stringify(e)).join(', ');
        } else {
          // Si es un string simple
          msg = String(data.detail);
        }
      } else if (data.message) {
        msg = String(data.message);
      }
    } else if (error.message) {
      msg = error.message;
    }
    
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
 * Ver Detalle de Proyecto (Vista inline tipo hoja)
 */
const verDetalle = async (proyecto) => {
  proyectoSeleccionado.value = proyecto;
  vistaDetalle.value = true;
  await cargarEvidencias(proyecto.id);
};

/**
 * Cargar evidencias del proyecto
 */
const cargarEvidencias = async (proyectoId) => {
  loadingEvidencias.value = true;
  try {
    const response = await proyectosService.getEvidencias(proyectoId);
    evidencias.value = response.data;
  } catch (error) {
    console.error('Error al cargar evidencias:', error);
    evidencias.value = [];
  } finally {
    loadingEvidencias.value = false;
  }
};

/**
 * Volver a la lista de proyectos
 */
const volverALista = () => {
  vistaDetalle.value = false;
  proyectoSeleccionado.value = null;
  evidencias.value = [];
};

/**
 * Abrir modal de agregar evidencia
 */
const abrirModalEvidencia = () => {
  archivoEvidencia.value = null;
  tituloEvidencia.value = '';
  fechaEvidencia.value = null;
  modalEvidenciaVisible.value = true;
};

/**
 * Manejar selección de archivo de evidencia
 */
const onSelectEvidencia = (event) => {
  archivoEvidencia.value = event.files[0];
};

/**
 * Limpiar archivo de evidencia
 */
const limpiarArchivoEvidencia = () => {
  archivoEvidencia.value = null;
  if (fileUploadEvidenciaRef.value) {
    fileUploadEvidenciaRef.value.clear();
  }
};

/**
 * Enviar evidencia al backend
 */
const enviarEvidencia = async () => {
  // Validaciones
  if (!archivoEvidencia.value) {
    toast.add({ severity: 'warn', summary: 'Archivo requerido', detail: 'Selecciona un archivo', life: 3000 });
    return;
  }
  if (!tituloEvidencia.value || tituloEvidencia.value.length < 5) {
    toast.add({ severity: 'warn', summary: 'Título requerido', detail: 'El título debe tener al menos 5 caracteres', life: 3000 });
    return;
  }
  if (!fechaEvidencia.value) {
    toast.add({ severity: 'warn', summary: 'Fecha requerida', detail: 'Selecciona la fecha de la evidencia', life: 3000 });
    return;
  }

  enviandoEvidencia.value = true;
  try {
    const formData = new FormData();
    formData.append('archivo', archivoEvidencia.value);
    formData.append('titulo', tituloEvidencia.value);
    
    // Formatear fecha a YYYY-MM-DD
    const fecha = new Date(fechaEvidencia.value);
    const fechaFormateada = fecha.toISOString().split('T')[0];
    formData.append('fecha_evidencia', fechaFormateada);


    await proyectosService.crearEvidencia(proyectoSeleccionado.value.id, formData);
    
    toast.add({ severity: 'success', summary: 'Evidencia agregada', detail: 'La evidencia se ha subido correctamente', life: 3000 });
    modalEvidenciaVisible.value = false;
    
    // Recargar evidencias
    await cargarEvidencias(proyectoSeleccionado.value.id);
  } catch (error) {
    console.error('Error al subir evidencia:', error);
    const errorMsg = error.response?.data?.detail || 'No se pudo subir la evidencia';
    toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 5000 });
  } finally {
    enviandoEvidencia.value = false;
  }
};

/**
 * Formatear tamaño de archivo
 */
const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

/**
 * Eliminar evidencia
 */
const eliminarEvidencia = async (evidencia) => {
  try {
    await proyectosService.eliminarEvidencia(proyectoSeleccionado.value.id, evidencia.id);
    toast.add({ severity: 'success', summary: 'Eliminada', detail: 'La evidencia ha sido eliminada', life: 3000 });
    await cargarEvidencias(proyectoSeleccionado.value.id);
  } catch (error) {
    console.error('Error al eliminar evidencia:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la evidencia', life: 5000 });
  }
};

/**
 * Confirmar eliminar evidencia
 */
const confirmarEliminarEvidencia = (evidencia) => {
  confirmAlert(
    confirm,
    `¿Estás seguro de eliminar la evidencia "${evidencia.titulo}"?`,
    () => eliminarEvidencia(evidencia),
    {
      header: 'Eliminar Evidencia',
      acceptProps: { label: 'Eliminar', severity: 'danger' }
    }
  );
};

/**
 * Ver Archivo Adjunto
 */
const verArchivo = (link) => {
  if (link) window.open(link, '_blank');
};

/**
 * Obtener iniciales del nombre
 */
const getInitials = (nombre) => {
  if (!nombre) return '??';
  return nombre.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
};

/**
 * Editar proyecto desde vista de detalle
 */
const editarDesdeDetalle = () => {
  editarProyecto(proyectoSeleccionado.value);
  volverALista();
};

/**
 * Confirmar eliminar desde vista de detalle
 */
const confirmarEliminarDesdeDetalle = () => {
  confirmAlert(
    confirm,
    `¿Estás seguro de eliminar el proyecto "${proyectoSeleccionado.value.titulo}"?`,
    async () => {
      await eliminarProyecto(proyectoSeleccionado.value);
      volverALista();
    },
    {
       header: 'Eliminar Proyecto',
       acceptProps: { label: 'Eliminar', severity: 'danger' }
    }
  );
};

/**
 * Abrir modal de comentarios
 */
const abrirComentarios = async () => {
  modalComentariosVisible.value = true;
  await comentariosStore.getComentarios(proyectoSeleccionado.value.id);
};

/**
 * Formatear fecha de comentario
 */
const formatComentarioDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <Header />

      <div class="p-8">
        <!-- Header Section -->
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-800">Proyectos Pedagógicos</h1>
            <p class="text-gray-500 text-sm mt-1">
              {{ vistaDetalle ? 'Detalle del proyecto' : 'Gestiona tus proyectos transversales y de aula' }}
            </p>
          </div>
          <Button 
            v-if="vistaDetalle" 
            label="Volver" 
            icon="pi pi-arrow-left" 
            severity="secondary" 
            outlined
            @click="volverALista"
          />
        </div>

        <!-- ========================================== -->
        <!-- VISTA DE DETALLE (Hoja de Proyecto) -->
        <!-- ========================================== -->
        <div v-if="vistaDetalle && proyectoSeleccionado" class="flex justify-center">
          <div class="w-full max-w-4xl bg-white shadow-xl rounded-xl border border-gray-200 min-h-[700px] flex flex-col">
            
            <!-- CABECERA DE LA HOJA -->
            <div class="p-8 border-b border-gray-100">
              <!-- Título y Estado -->
              <div class="flex justify-between items-start mb-6">
                <h2 class="text-2xl font-bold text-gray-800 font-serif">{{ proyectoSeleccionado.titulo }}</h2>
                <span class="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs uppercase tracking-wide font-semibold">
                  {{ proyectoSeleccionado.estado || 'Activo' }}
                </span>
              </div>

              <!-- Info Grid: Docente y Fechas -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-sm text-gray-600">
                <div>
                  <p class="uppercase text-xs font-bold text-gray-400 mb-1">Docente Responsable</p>
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                      {{ getInitials(proyectoSeleccionado.docente?.nombre_completo || currentUser.nombre_completo) }}
                    </div>
                    <span class="font-medium">{{ proyectoSeleccionado.docente?.nombre_completo || currentUser.nombre_completo }}</span>
                  </div>
                </div>
                <div>
                  <p class="uppercase text-xs font-bold text-gray-400 mb-1">Período de Ejecución</p>
                  <div class="flex items-center gap-2 font-medium">
                    <span>{{ formatDate(proyectoSeleccionado.fecha_inicio) }}</span>
                    <i class="pi pi-arrow-right text-xs text-gray-400"></i>
                    <span>{{ proyectoSeleccionado.fecha_fin_estimada ? formatDate(proyectoSeleccionado.fecha_fin_estimada) : 'En curso' }}</span>
                  </div>
                </div>
              </div>

              <!-- Descripción -->
              <div class="mb-4">
                <h3 class="text-xs uppercase font-bold text-gray-400 mb-2">Descripción</h3>
                <p class="text-gray-700 leading-relaxed whitespace-pre-line">{{ proyectoSeleccionado.descripcion }}</p>
              </div>

              <!-- Objetivos -->
              <div v-if="proyectoSeleccionado.objetivos" class="mb-4">
                <h3 class="text-xs uppercase font-bold text-gray-400 mb-2">Objetivos</h3>
                <p class="text-gray-700 leading-relaxed whitespace-pre-line">{{ proyectoSeleccionado.objetivos }}</p>
              </div>

              <!-- Archivo Adjunto -->
              <div v-if="proyectoSeleccionado.nombre_archivo_original" class="mt-4">
                <h3 class="text-xs uppercase font-bold text-gray-400 mb-2">Documento Adjunto</h3>
                <button 
                  @click="verArchivo(proyectoSeleccionado.drive_view_link)"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors border border-blue-200"
                >
                  <i class="pi pi-file-pdf"></i>
                  <span class="text-sm font-medium">{{ proyectoSeleccionado.nombre_archivo_original }}</span>
                  <i class="pi pi-external-link text-xs"></i>
                </button>
              </div>
            </div>

            <!-- CUERPO: EVIDENCIAS -->
            <div class="flex-1 p-8 bg-gray-50/50">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <i class="pi pi-folder-open text-yellow-500"></i>
                  Evidencias del Proyecto
                  <span v-if="evidencias.length > 0" class="text-sm font-normal text-gray-400">({{ evidencias.length }})</span>
                </h3>
                <Button 
                  icon="pi pi-plus" 
                  label="Agregar Evidencia"
                  severity="success"
                  size="small"
                  @click="abrirModalEvidencia"
                />
              </div>

              <!-- Loading Evidencias -->
              <div v-if="loadingEvidencias" class="flex justify-center py-10">
                <i class="pi pi-spin pi-spinner text-2xl text-blue-500"></i>
              </div>

              <!-- Empty State Evidencias -->
              <div v-else-if="evidencias.length === 0" class="border-2 border-dashed border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center text-gray-400 bg-white">
                <i class="pi pi-images text-4xl mb-3 opacity-50"></i>
                <p class="font-medium">Sin evidencias registradas</p>
                <p class="text-xs mt-1">Agrega la primera evidencia de tu proyecto</p>
              </div>

              <!-- Lista de Evidencias -->
              <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  v-for="evidencia in evidencias" 
                  :key="evidencia.id"
                  class="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div class="flex items-start gap-3">
                    <!-- Icono según tipo -->
                    <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <i :class="[
                        'text-blue-600 text-lg',
                        evidencia.tipo_archivo === 'pdf' ? 'pi pi-file-pdf' :
                        evidencia.tipo_archivo === 'docx' || evidencia.tipo_archivo === 'doc' ? 'pi pi-file-word' :
                        ['jpg', 'jpeg', 'png'].includes(evidencia.tipo_archivo) ? 'pi pi-image' :
                        evidencia.tipo_archivo === 'mp4' ? 'pi pi-video' :
                        ['xls', 'xlsx'].includes(evidencia.tipo_archivo) ? 'pi pi-file-excel' :
                        'pi pi-file'
                      ]"></i>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h4 class="font-semibold text-gray-800 text-sm truncate">{{ evidencia.titulo }}</h4>
                      <p class="text-xs text-gray-400 mt-1">
                        {{ formatDate(evidencia.fecha_evidencia) }} • {{ formatFileSize(evidencia.tamano_bytes) }}
                      </p>
                      <p class="text-xs text-gray-500 mt-1 truncate">{{ evidencia.nombre_archivo_original }}</p>
                    </div>
                    <!-- Botones acciones -->
                    <div class="flex gap-1">
                      <Button 
                        icon="pi pi-external-link"
                        text
                        rounded
                        size="small"
                        severity="info"
                        @click="verArchivo(evidencia.drive_view_link)"
                      />
                      <Button 
                        icon="pi pi-times"
                        text
                        rounded
                        size="small"
                        severity="danger"
                        @click="confirmarEliminarEvidencia(evidencia)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- FOOTER: BOTONES DE ACCIÓN -->
            <div class="p-6 border-t border-gray-100 bg-white rounded-b-xl">
              <div class="flex justify-center gap-4">
                <Button 
                  icon="pi pi-pencil" 
                  label="Editar"
                  severity="warning" 
                  outlined
                  @click="editarDesdeDetalle"
                />
                <Button 
                  icon="pi pi-trash" 
                  label="Eliminar"
                  severity="danger" 
                  outlined
                  @click="confirmarEliminarDesdeDetalle"
                />
                <Button 
                  icon="pi pi-comments" 
                  label="Comentarios"
                  severity="info" 
                  outlined
                  @click="abrirComentarios"
                >
                  <template #icon>
                    <span class="relative">
                      <i class="pi pi-comments"></i>
                      <span v-if="comentariosStore.comentarios.length > 0" class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                        {{ comentariosStore.comentarios.length }}
                      </span>
                    </span>
                  </template>
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- VISTA DE LISTA (Formulario + Proyectos) -->
        <!-- ========================================== -->
        <div v-else class="flex gap-6 flex-col lg:flex-row">
          
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

    <!-- Modal de Comentarios -->
    <Dialog 
      v-model:visible="modalComentariosVisible" 
      modal 
      header="Comentarios del Proyecto" 
      :style="{ width: '40vw' }"
      :breakpoints="{ '960px': '75vw', '641px': '90vw' }"
    >
      <div class="flex flex-col h-[400px]">
        <!-- Lista de Comentarios -->
        <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 p-1">
          <!-- Loading -->
          <div v-if="comentariosStore.loading" class="flex justify-center p-8">
            <i class="pi pi-spin pi-spinner text-blue-500 text-2xl"></i>
          </div>

          <!-- Empty State -->
          <div v-else-if="comentariosStore.comentarios.length === 0" class="text-center text-gray-400 py-12">
            <i class="pi pi-comment text-4xl mb-3 opacity-50"></i>
            <p class="font-medium">No hay comentarios aún</p>
            <p class="text-xs mt-1">Los comentarios de los directivos aparecerán aquí</p>
          </div>

          <!-- Lista -->
          <div 
            v-else
            v-for="comentario in comentariosStore.comentarios" 
            :key="comentario.id" 
            class="bg-gray-50 p-4 rounded-lg border border-gray-100"
          >
            <!-- Header del comentario -->
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                {{ getInitials(comentario.coordinador?.nombre_completo || 'Usuario') }}
              </div>
              <div>
                <span class="text-sm font-semibold text-gray-700 block">
                  {{ comentario.coordinador?.nombre_completo || 'Coordinador' }}
                </span>
                <span class="text-xs text-gray-400">
                  {{ formatComentarioDate(comentario.created_at) }}
                </span>
              </div>
              <span class="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full uppercase font-semibold">
                {{ comentario.coordinador?.rol || 'Directivo' }}
              </span>
            </div>
            <!-- Contenido -->
            <p class="text-sm text-gray-600 whitespace-pre-wrap pl-11">{{ comentario.contenido }}</p>
          </div>
        </div>

        <!-- Footer info -->
        <div class="mt-4 pt-4 border-t border-gray-100 text-center">
          <p class="text-xs text-gray-400 italic">Solo los directivos pueden agregar comentarios.</p>
        </div>
      </div>
    </Dialog>

    <!-- Modal de Agregar Evidencia -->
    <Dialog 
      v-model:visible="modalEvidenciaVisible" 
      modal 
      header="Agregar Evidencia" 
      :style="{ width: '500px' }"
      :closable="!enviandoEvidencia"
      :closeOnEscape="!enviandoEvidencia"
    >
      <div class="space-y-5">
        <!-- Título -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Título de la evidencia <span class="text-red-500">*</span>
          </label>
          <InputText 
            v-model="tituloEvidencia" 
            class="w-full"
            placeholder="Ej: Registro fotográfico actividad..."
            :disabled="enviandoEvidencia"
          />
          <small class="text-gray-400">Mínimo 5 caracteres</small>
        </div>
        
        <!-- Fecha -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Fecha de la evidencia <span class="text-red-500">*</span>
          </label>
          <Calendar 
            v-model="fechaEvidencia" 
            class="w-full"
            dateFormat="dd/mm/yy"
            placeholder="Selecciona la fecha"
            :maxDate="new Date()"
            showIcon
            :disabled="enviandoEvidencia"
          />
        </div>



        <!-- Archivo -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Archivo <span class="text-red-500">*</span>
          </label>
          
          <div v-if="archivoEvidencia" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <i class="pi pi-file text-blue-600 text-xl"></i>
                <div>
                  <p class="font-medium text-gray-800 text-sm">{{ archivoEvidencia.name }}</p>
                  <p class="text-xs text-gray-500">{{ formatFileSize(archivoEvidencia.size) }}</p>
                </div>
              </div>
              <Button 
                icon="pi pi-times" 
                text 
                rounded 
                severity="danger"
                size="small"
                @click="limpiarArchivoEvidencia"
                :disabled="enviandoEvidencia"
              />
            </div>
          </div>

          <FileUpload
            v-else
            ref="fileUploadEvidenciaRef"
            mode="basic"
            accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.mp4,.xls,.xlsx"
            :maxFileSize="10485760"
            chooseLabel="Seleccionar archivo"
            class="w-full"
            @select="onSelectEvidencia"
            :disabled="enviandoEvidencia"
          />
          <div class="mt-2 text-xs text-gray-400 space-y-1">
            <p><i class="pi pi-info-circle mr-1"></i>Formatos permitidos: PDF, DOCX, JPG, PNG, MP4, XLS, XLSX</p>
            <p><i class="pi pi-exclamation-triangle mr-1"></i>Tamaño máximo: 10 MB</p>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <Button 
            label="Cancelar" 
            severity="secondary" 
            text
            @click="modalEvidenciaVisible = false"
            :disabled="enviandoEvidencia"
          />
          <Button 
            label="Agregar Evidencia" 
            icon="pi pi-upload"
            @click="enviarEvidencia"
            :loading="enviandoEvidencia"
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
