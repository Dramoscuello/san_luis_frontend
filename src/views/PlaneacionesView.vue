<script setup>
/**
 * ============================================
 * VISTA DE GESTIÓN DE PLANEACIONES
 * ============================================
 * Esta vista permite:
 * - Docentes: Crear y gestionar sus propias planeaciones
 * - Coordinadores/Rector: Ver todas las planeaciones
 * El archivo adjunto es OBLIGATORIO
 */

import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import FileUpload from 'primevue/fileupload';
import Paginator from 'primevue/paginator';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import { onMounted, computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { usePlaneacionesStore } from "@/stores/planeaciones.js";
import { useAsignaturasStore } from "@/stores/asignaturas.js";
import { useSedesStore } from "@/stores/sedes.js";
import { usePeriodosStore } from "@/stores/periodos.js";
import { useUserStore } from "@/stores/user.js";
import { usePlaneacionesDestacadasStore } from "@/stores/planeacionesDestacadas.js";
import { useComentariosStore } from "@/stores/comentarios.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";

const planeacionesStore = usePlaneacionesStore();
const asignaturasStore = useAsignaturasStore();
const sedesStore = useSedesStore();
const periodosStore = usePeriodosStore();
const userStore = useUserStore();
const destacadasStore = usePlaneacionesDestacadasStore();
const comentariosStore = useComentariosStore();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// Usuario actual desde el store
const currentUser = computed(() => userStore.userLogged);
const isDocente = computed(() => currentUser.value?.rol?.trim().toLowerCase() === 'docente');

// Computed para saber si estamos editando
const isEditing = computed(() => planeacionesStore.modoEdicion);
const archivoActual = computed(() => planeacionesStore.planeacion.nombre_archivo);

// Asignatura seleccionada para el formulario
const asignaturaSeleccionada = ref(null);

// Referencia al FileUpload para limpiarlo
const fileUploadRef = ref(null);

// ============================================
// MODAL DESTACAR PLANEACION (Solo Coordinadores/Rector)
// ============================================
const modalDestacadaVisible = ref(false);
const planeacionADestacar = ref(null);
const razonDestacada = ref('');
const guardandoDestacada = ref(false);

// ============================================
// MODAL COMENTARIOS
// ============================================
const modalComentariosVisible = ref(false);
const planeacionComentarios = ref(null);
const nuevoComentario = ref('');

// Estado para edición de comentarios
const comentarioEditandoId = ref(null);
const contenidoEditado = ref('');
const editandoLoading = ref(false);

// Computed para verificar si es directivo (coordinador o rector)
const isDirectivo = computed(() => {
  const rol = currentUser.value?.rol?.trim().toLowerCase();
  return rol === 'coordinador' || rol === 'rector';
});

// ============================================
// PARA DOCENTES: Últimas 5 planeaciones
// ============================================

// Mostrar solo las 5 planeaciones más recientes (para docentes)
const ultimasPlaneaciones = computed(() => {
  return planeacionesStore.planeaciones.slice(0, 5);
});

// Ir a ver todas las planeaciones del docente
const verTodasPlaneaciones = () => {
  router.push({ name: 'mis_planeaciones' });
};

// ============================================
// FILTROS Y PAGINACIÓN (Solo para Coordinadores/Rector)
// ============================================

// Filtros seleccionados
const filtroSede = ref(null);
const filtroAsignatura = ref(null);
const filtroPeriodo = ref(null);

// Paginación
const first = ref(0);
const rows = ref(8);

// Watcher para resetear página cuando cambia cualquier filtro
watch([filtroSede, filtroAsignatura, filtroPeriodo], () => {
  first.value = 0;
});

// Planeaciones filtradas (se aplican todos los filtros activos simultáneamente)
const planeacionesFiltradas = computed(() => {
  let resultado = planeacionesStore.planeaciones;

  if (filtroSede.value) {
    resultado = resultado.filter(p => p.sede_id === filtroSede.value.id);
  }
  
  if (filtroAsignatura.value) {
    resultado = resultado.filter(p => p.asignatura?.id === filtroAsignatura.value.id);
  }
  
  if (filtroPeriodo.value) {
    resultado = resultado.filter(p => p.periodo?.id === filtroPeriodo.value.id);
  }

  return resultado;
});

// Planeaciones paginadas
const planeacionesPaginadas = computed(() => {
  const start = first.value;
  const end = start + rows.value;
  return planeacionesFiltradas.value.slice(start, end);
});

// Total de registros (para el paginator)
const totalRecords = computed(() => planeacionesFiltradas.value.length);

// Función para cambiar de página
const onPageChange = (event) => {
  first.value = event.first;
};

// Limpiar todos los filtros
const limpiarFiltros = () => {
  filtroSede.value = null;
  filtroAsignatura.value = null;
  filtroPeriodo.value = null;
  first.value = 0;
};

// Opciones de asignaturas (para docentes: sus asignaturas asignadas, para otros: todas)
const asignaturasOptions = computed(() => {
  if (isDocente.value && currentUser.value?.asignaturas?.length > 0) {
    return currentUser.value.asignaturas;
  }
  return asignaturasStore.asignaturas;
});

onMounted(async () => {
  // Primero cargar el usuario logueado si no tiene rol
  if (!userStore.userLogged.rol) {
    await userStore.getUserLogged();
  }

  // Cargar planeaciones según rol
  if (userStore.userLogged.rol?.toLowerCase() === 'docente') {
    await planeacionesStore.getMisPlaneaciones();
  } else {
    await planeacionesStore.getPlaneaciones();
    // Cargar datos para los filtros y destacadas (coordinadores/rector)
    await Promise.all([
      asignaturasStore.getAsignaturas(),
      sedesStore.getSedes(),
      periodosStore.getPeriodos(),
      destacadasStore.getPlaneacionesDestacadas()
    ]);
  }
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
 * Maneja la selección de archivo
 */
const onFileSelect = (event) => {
  planeacionesStore.planeacion.archivo = event.files[0];
};

/**
 * Limpia el archivo seleccionado (nuevo)
 */
const clearNewFile = () => {
  planeacionesStore.planeacion.archivo = null;
};

/**
 * Limpia el formulario y sale del modo edición
 */
const limpiarFormulario = () => {
  planeacionesStore.resetPlaneacion();
  asignaturaSeleccionada.value = null;
  // Limpiar el FileUpload
  if (fileUploadRef.value) {
    fileUploadRef.value.clear();
  }
};

/**
 * Carga una planeación en el formulario para editar
 */
const editarPlaneacion = (planeacion) => {
  planeacionesStore.setPlaneacionParaEditar(planeacion);

  // Buscar la asignatura en las opciones
  asignaturaSeleccionada.value = asignaturasOptions.value.find(
    a => a.id === planeacion.asignatura_id
  ) || null;

  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Maneja el cambio de asignatura seleccionada
 */
const onAsignaturaChange = (event) => {
  planeacionesStore.planeacion.asignatura_id = event.value?.id || null;
};

/**
 * Guarda la planeación (crear o actualizar)
 */
const guardarPlaneacion = async () => {
  const titulo = planeacionesStore.planeacion.titulo?.trim() || '';
  const asignaturaId = planeacionesStore.planeacion.asignatura_id;
  const archivo = planeacionesStore.planeacion.archivo;
  const archivoExistente = planeacionesStore.planeacion.nombre_archivo;

  // Validaciones
  if (!titulo) {
    toast.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El titulo es obligatorio', life: 3000 });
    return;
  }
  if (titulo.length < 5) {
    toast.add({ severity: 'warn', summary: 'Titulo muy corto', detail: 'El titulo debe tener al menos 5 caracteres', life: 3000 });
    return;
  }

  if (!asignaturaId) {
    toast.add({ severity: 'warn', summary: 'Campo requerido', detail: 'Debe seleccionar una asignatura', life: 3000 });
    return;
  }

  // Archivo obligatorio solo al crear
  if (!isEditing.value && !archivo) {
    toast.add({ severity: 'warn', summary: 'Archivo requerido', detail: 'Debe adjuntar un archivo de planeacion', life: 3000 });
    return;
  }

  try {
    if (isEditing.value) {
      await planeacionesStore.actualizarPlaneacion();
      toast.add({ severity: 'success', summary: 'Actualizado', detail: 'La planeacion ha sido actualizada', life: 3000 });
    } else {
      await planeacionesStore.crearPlaneacion();
      toast.add({ severity: 'success', summary: 'Creado', detail: 'La planeacion se ha creado correctamente', life: 3000 });
    }
    // Limpiar formulario
    asignaturaSeleccionada.value = null;
    // Limpiar el FileUpload
    if (fileUploadRef.value) {
      fileUploadRef.value.clear();
    }
  } catch (error) {
    console.error('Error al guardar:', error);

    let errorMsg = 'Ocurrio un error al guardar la planeacion';
    const detail = error.response?.data?.detail;

    if (detail) {
      if (typeof detail === 'string') {
        errorMsg = detail;
      } else if (Array.isArray(detail)) {
        errorMsg = detail.map(e => e.msg || e.message).join(', ');
      }
    }

    toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 5000 });
  }
};

/**
 * Elimina una planeación
 */
const eliminarPlaneacion = async (planeacion) => {
  try {
    await planeacionesStore.eliminarPlaneacion(planeacion.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'La planeacion ha sido eliminada', life: 3000 });

    if (isEditing.value && planeacionesStore.planeacion.id === planeacion.id) {
      limpiarFormulario();
    }
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar la planeacion', life: 3000 });
  }
};

/**
 * Confirma la eliminación
 */
const confirmarEliminar = (planeacion) => {
  confirmAlert(
    confirm,
    `¿Estas seguro que deseas eliminar la planeacion "${planeacion.titulo}"?`,
    () => eliminarPlaneacion(planeacion),
    {
      header: 'Eliminar Planeacion',
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
const verArchivo = (planeacion) => {
  if (planeacion.drive_view_link) {
    window.open(planeacion.drive_view_link, '_blank');
  }
};

// ============================================
// FUNCIONES PARA DESTACAR PLANEACIONES
// ============================================

/**
 * Abre el modal para destacar una planeacion
 */
const abrirModalDestacar = (planeacion) => {
  planeacionADestacar.value = planeacion;
  razonDestacada.value = '';
  modalDestacadaVisible.value = true;
};

/**
 * Cierra el modal de destacar
 */
const cerrarModalDestacar = () => {
  modalDestacadaVisible.value = false;
  planeacionADestacar.value = null;
  razonDestacada.value = '';
};

/**
 * Guarda la planeacion como destacada
 */
const guardarDestacada = async () => {
  if (!razonDestacada.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Campo requerido', detail: 'La razon es obligatoria', life: 3000 });
    return;
  }

  guardandoDestacada.value = true;
  try {
    await destacadasStore.marcarComoDestacada(planeacionADestacar.value.id, razonDestacada.value.trim());
    toast.add({ severity: 'success', summary: 'Destacada', detail: 'La planeacion ha sido marcada como destacada', life: 3000 });
    cerrarModalDestacar();
  } catch (error) {
    console.error('Error al destacar planeacion:', error);
    const errorMsg = error.response?.data?.detail || 'No se pudo marcar la planeacion como destacada';
    toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 5000 });
  } finally {
    guardandoDestacada.value = false;
  }
};

// ============================================
// FUNCIONES PARA COMENTARIOS
// ============================================

/**
 * Abre el modal de comentarios y carga los comentarios de la planeación
 */
const abrirModalComentarios = async (planeacion) => {
  planeacionComentarios.value = planeacion;
  modalComentariosVisible.value = true;
  nuevoComentario.value = '';
  await comentariosStore.getComentarios(planeacion.id);
};

/**
 * Cierra el modal de comentarios
 */
const cerrarModalComentarios = () => {
  modalComentariosVisible.value = false;
  planeacionComentarios.value = null;
  nuevoComentario.value = '';
  comentariosStore.limpiarComentarios();
};

/**
 * Envía un nuevo comentario
 */
const enviarComentario = async () => {
  if (!nuevoComentario.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El comentario no puede estar vacío', life: 3000 });
    return;
  }

  try {
    await comentariosStore.crearComentario(planeacionComentarios.value.id, nuevoComentario.value.trim());
    nuevoComentario.value = '';
    toast.add({ severity: 'success', summary: 'Enviado', detail: 'Comentario agregado correctamente', life: 3000 });
  } catch (error) {
    console.error('Error al enviar comentario:', error);
    const errorMsg = error.response?.data?.detail || 'No se pudo enviar el comentario';
    toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 5000 });
  }
};

/**
 * Elimina un comentario
 */
const eliminarComentarioHandler = async (comentario) => {
  try {
    await comentariosStore.eliminarComentario(comentario.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Comentario eliminado', life: 3000 });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el comentario', life: 5000 });
  }
};

/**
 * Confirma la eliminación de un comentario
 */
const confirmarEliminarComentario = (comentario) => {
  confirmAlert(
    confirm,
    '¿Estás seguro que deseas eliminar este comentario?',
    () => eliminarComentarioHandler(comentario),
    {
      header: 'Eliminar Comentario',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
};

/**
 * Inicia la edición de un comentario
 */
const iniciarEdicion = (comentario) => {
  comentarioEditandoId.value = comentario.id;
  contenidoEditado.value = comentario.contenido;
};

/**
 * Cancela la edición del comentario
 */
const cancelarEdicion = () => {
  comentarioEditandoId.value = null;
  contenidoEditado.value = '';
};

/**
 * Guarda el comentario editado
 */
const guardarEdicion = async (comentarioId) => {
  if (!contenidoEditado.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El comentario no puede estar vacio', life: 3000 });
    return;
  }

  editandoLoading.value = true;
  try {
    await comentariosStore.actualizarComentario(comentarioId, contenidoEditado.value.trim());
    toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Comentario actualizado correctamente', life: 3000 });
    cancelarEdicion();
  } catch (error) {
    console.error('Error al actualizar comentario:', error);
    const errorMsg = error.response?.data?.detail || 'No se pudo actualizar el comentario';
    toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 5000 });
  } finally {
    editandoLoading.value = false;
  }
};

/**
 * Formatea la fecha del comentario
 */
const formatComentarioDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
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
          <h1 class="text-2xl font-bold text-gray-800">
            {{ isDocente ? 'Mis Planeaciones' : 'Gestion de Planeaciones' }}
          </h1>
          <p class="text-gray-500 text-sm mt-1">
            {{ isDocente ? 'Sube y gestiona tus planeaciones de clase' : 'Visualiza las planeaciones de todos los docentes' }}
          </p>
        </div>

        <div class="flex gap-6 flex-col lg:flex-row">
          <!-- Panel izquierdo: Editor de planeación (solo para docentes) -->
          <div v-if="isDocente" class="flex-1 lg:max-w-2xl">
            <Card class="shadow-sm border-t-4" :class="isEditing ? 'border-orange-500' : 'border-green-500'">
              <template #title>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <i :class="isEditing ? 'pi pi-pencil text-orange-500' : 'pi pi-plus text-green-500'"></i>
                    <span :class="isEditing ? 'text-orange-600' : 'text-green-600'">
                      {{ isEditing ? 'Editar Planeacion' : 'Nueva Planeacion' }}
                    </span>
                  </div>
                  <span v-if="isEditing" class="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">
                    Editando ID: {{ planeacionesStore.planeacion.id }}
                  </span>
                </div>
              </template>
              <template #content>
                <!-- Título -->
                <div class="mb-4">
                  <label for="titulo" class="block font-semibold text-gray-700 mb-2">Titulo *</label>
                  <InputText
                    id="titulo"
                    v-model="planeacionesStore.planeacion.titulo"
                    placeholder="Ej: Planeacion semana 1 - Algebra"
                    class="w-full"
                  />
                </div>

                <!-- Asignatura -->
                <div class="mb-4">
                  <label for="asignatura" class="block font-semibold text-gray-700 mb-2">Asignatura *</label>
                  <Select
                    id="asignatura"
                    v-model="asignaturaSeleccionada"
                    :options="asignaturasOptions"
                    optionLabel="nombre"
                    placeholder="Selecciona una asignatura"
                    class="w-full"
                    @change="onAsignaturaChange"
                  />
                </div>

                <!-- Sección de Archivos -->
                <div class="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <label class="block font-semibold text-gray-700 mb-2">
                    Archivo de planeacion *
                    <span class="text-red-500 text-xs font-normal ml-1">(Obligatorio)</span>
                  </label>

                  <!-- Archivo existente (Modo Edición) -->
                  <div v-if="archivoActual" class="flex items-center justify-between bg-white p-3 rounded border border-green-200 mb-3">
                    <div class="flex items-center gap-3">
                      <i class="pi pi-file-pdf text-red-500 text-xl"></i>
                      <div>
                        <p class="text-sm font-medium text-gray-700">{{ archivoActual }}</p>
                        <p class="text-xs text-gray-500">Archivo actual en Drive</p>
                      </div>
                    </div>
                  </div>

                  <!-- Selector de nuevo archivo -->
                  <div class="flex items-center gap-3">
                    <div class="flex-1">
                      <FileUpload
                        ref="fileUploadRef"
                        mode="basic"
                        name="archivo"
                        accept=".pdf,.docx,.doc"
                        :maxFileSize="10485760"
                        :auto="false"
                        @select="onFileSelect"
                        :chooseLabel="isEditing && archivoActual ? 'Reemplazar archivo' : 'Seleccionar archivo'"
                        class="w-full"
                      />
                    </div>

                    <span v-if="planeacionesStore.planeacion.archivo" class="text-sm text-green-600 flex items-center gap-2 bg-green-50 px-3 py-2 rounded border border-green-200">
                      <i class="pi pi-file"></i>
                      {{ planeacionesStore.planeacion.archivo.name }}
                      <i
                        class="pi pi-times cursor-pointer text-red-500 hover:text-red-700"
                        @click="clearNewFile"
                        v-tooltip="'Cancelar seleccion'"
                      ></i>
                    </span>
                  </div>
                  <small class="text-gray-500 block mt-2">
                    Formatos: PDF, Word (max. 10MB).
                    <span v-if="isEditing && archivoActual" class="text-orange-600">
                      Subir un nuevo archivo reemplazara al actual.
                    </span>
                  </small>
                </div>

                <!-- Botones de acción -->
                <div class="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <Button
                    v-if="isEditing"
                    label="Cancelar Edicion"
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
                    :label="isEditing ? 'Guardar Cambios' : 'Subir Planeacion'"
                    :icon="isEditing ? 'pi pi-check' : 'pi pi-upload'"
                    :severity="isEditing ? 'warning' : 'success'"
                    @click="guardarPlaneacion"
                    :loading="planeacionesStore.loading"
                  />
                </div>
              </template>
            </Card>
          </div>

          <!-- Panel derecho: Lista de planeaciones -->
          <div :class="isDocente ? 'flex-1 lg:max-w-xl' : 'flex-1'">
            <!-- Filtros (solo para Coordinadores/Rector) -->
            <div v-if="!isDocente" class="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <i class="pi pi-filter text-blue-500"></i>
                  Filtrar planeaciones
                </h3>
                <Button
                  v-if="filtroSede || filtroAsignatura || filtroPeriodo"
                  label="Limpiar filtros"
                  icon="pi pi-times"
                  severity="secondary"
                  text
                  size="small"
                  @click="limpiarFiltros"
                />
              </div>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Por Sede</label>
                  <Select
                    v-model="filtroSede"
                    :options="sedesStore.sedes"
                    optionLabel="nombre"
                    placeholder="Selecciona sede"
                    class="w-full"
                    showClear
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Por Asignatura</label>
                  <Select
                    v-model="filtroAsignatura"
                    :options="asignaturasStore.asignaturas"
                    optionLabel="nombre"
                    placeholder="Selecciona asignatura"
                    class="w-full"
                    showClear
                  />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Por Periodo</label>
                  <Select
                    v-model="filtroPeriodo"
                    :options="periodosStore.periodos"
                    optionLabel="nombre"
                    placeholder="Selecciona periodo"
                    class="w-full"
                    showClear
                  />
                </div>
              </div>
              <p v-if="filtroSede || filtroAsignatura || filtroPeriodo" class="text-xs text-blue-600 mt-2">
                <i class="pi pi-info-circle mr-1"></i>
                Los filtros se combinan para refinar la búsqueda.
              </p>
            </div>

            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-700">
                {{ isDocente ? 'Últimas planeaciones' : 'Todas las planeaciones' }}
              </h2>
              <span class="text-sm text-gray-500">
                <template v-if="isDocente">
                  Mostrando {{ ultimasPlaneaciones.length }} de {{ planeacionesStore.planeaciones.length }}
                </template>
                <template v-else>
                  {{ totalRecords }} planeaciones
                </template>
              </span>
            </div>

            <div :class="[
              'max-h-[calc(100vh-280px)] overflow-y-auto pr-2 custom-scrollbar',
              isDocente ? 'space-y-3' : 'grid grid-cols-1 lg:grid-cols-2 gap-4'
            ]">
              <!-- Loading state -->
              <div
                v-if="planeacionesStore.loading && planeacionesStore.planeaciones.length === 0"
                class="text-center py-8 bg-white rounded-lg border border-gray-200"
                :class="{ 'lg:col-span-2': !isDocente }"
              >
                <i class="pi pi-spin pi-spinner text-3xl text-green-500 mb-3"></i>
                <p class="text-gray-500 text-sm">Cargando...</p>
              </div>

              <!-- Empty state -->
              <div
                v-else-if="planeacionesStore.planeaciones.length === 0"
                class="text-center py-10 bg-white rounded-lg border border-gray-200"
                :class="{ 'lg:col-span-2': !isDocente }"
              >
                <i class="pi pi-file text-4xl text-gray-300 mb-3"></i>
                <h4 class="font-semibold text-gray-600 mb-1">Sin planeaciones</h4>
                <p class="text-gray-400 text-sm">
                  {{ isDocente ? 'Sube tu primera planeacion usando el formulario.' : 'No hay planeaciones registradas.' }}
                </p>
              </div>

              <!-- Lista de planeaciones -->
              <div
                v-for="plan in (isDocente ? ultimasPlaneaciones : planeacionesPaginadas)"
                :key="plan.id"
                class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 group"
                :class="{'border-l-4 border-l-orange-400': isEditing && planeacionesStore.planeacion.id === plan.id}"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1 min-w-0">
                    <!-- Título -->
                    <h3 class="font-semibold text-gray-800 truncate">{{ plan.titulo }}</h3>

                    <!-- Info del docente (solo para coordinadores/rector) -->
                    <div v-if="!isDocente && plan.docente" class="flex items-center gap-2 mt-1">
                      <div class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold">
                        {{ getInitials(plan.docente.nombre_completo) }}
                      </div>
                      <span class="text-xs text-gray-500">{{ plan.docente.nombre_completo }}</span>
                    </div>

                    <!-- Asignatura -->
                    <div class="flex items-center gap-2 mt-2 flex-wrap">
                      <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-200">
                        {{ plan.asignatura?.nombre || 'Sin asignatura' }}
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
                      icon="pi pi-eye"
                      severity="info"
                      text
                      rounded
                      size="small"
                      @click="verArchivo(plan)"
                      v-tooltip.top="'Ver archivo'"
                    />
                    <!-- Boton comentarios -->
                    <Button
                      icon="pi pi-comments"
                      severity="secondary"
                      text
                      rounded
                      size="small"
                      @click="abrirModalComentarios(plan)"
                      v-tooltip.top="'Ver comentarios'"
                    />
                    <!-- Boton destacar (solo coordinadores/rector) -->
                    <Button
                      v-if="!isDocente"
                      :icon="destacadasStore.esDestacada(plan.id) ? 'pi pi-star-fill' : 'pi pi-star'"
                      :severity="destacadasStore.esDestacada(plan.id) ? 'warning' : 'secondary'"
                      text
                      rounded
                      size="small"
                      @click="!destacadasStore.esDestacada(plan.id) && abrirModalDestacar(plan)"
                      v-tooltip.top="destacadasStore.esDestacada(plan.id) ? 'Planeacion destacada' : 'Marcar como destacada'"
                      :class="{ 'cursor-default': destacadasStore.esDestacada(plan.id) }"
                    />
                    <Button
                      v-if="isDocente"
                      icon="pi pi-pencil"
                      severity="warning"
                      text
                      rounded
                      size="small"
                      @click="editarPlaneacion(plan)"
                      v-tooltip.top="'Editar'"
                    />
                    <Button
                      v-if="isDocente"
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

            <!-- Paginator (solo para Coordinadores/Rector) -->
            <div v-if="!isDocente && totalRecords > rows" class="mt-4">
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

            <!-- Botón Más detalles (solo para Docentes) -->
            <div v-if="isDocente && planeacionesStore.planeaciones.length > 0" class="mt-4">
              <Button
                label="Más detalles"
                icon="pi pi-list"
                severity="secondary"
                outlined
                class="w-full"
                @click="verTodasPlaneaciones"
              />
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal para destacar planeacion -->
    <Dialog
      v-model:visible="modalDestacadaVisible"
      modal
      header="Destacar Planeacion"
      :style="{ width: '450px' }"
      :closable="!guardandoDestacada"
      :closeOnEscape="!guardandoDestacada"
    >
      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-3">
          Vas a destacar la planeacion: <strong>{{ planeacionADestacar?.titulo }}</strong>
        </p>
        <label for="razon" class="block font-semibold text-gray-700 mb-2">
          Razon del destacado <span class="text-red-500">*</span>
        </label>
        <Textarea
          id="razon"
          v-model="razonDestacada"
          rows="4"
          placeholder="Escribe la razon por la cual esta planeacion merece ser destacada..."
          class="w-full"
          :disabled="guardandoDestacada"
        />
        <small class="text-gray-500">Este campo es obligatorio</small>
      </div>
      <template #footer>
        <Button
          label="Cancelar"
          severity="secondary"
          text
          @click="cerrarModalDestacar"
          :disabled="guardandoDestacada"
        />
        <Button
          label="Destacar"
          icon="pi pi-star-fill"
          severity="warning"
          @click="guardarDestacada"
          :loading="guardandoDestacada"
        />
      </template>
    </Dialog>

    <!-- Modal de Comentarios -->
    <Dialog
      v-model:visible="modalComentariosVisible"
      modal
      :header="`Comentarios: ${planeacionComentarios?.titulo || ''}`"
      :style="{ width: '40vw' }"
      :breakpoints="{ '960px': '70vw', '640px': '90vw' }"
      @hide="cerrarModalComentarios"
    >
      <!-- Área de comentarios -->
      <div class="flex flex-col h-[400px]">
        <!-- Lista de comentarios con scroll -->
        <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <!-- Loading state -->
          <div v-if="comentariosStore.loading" class="flex items-center justify-center h-full">
            <i class="pi pi-spin pi-spinner text-2xl text-blue-500"></i>
          </div>

          <!-- Sin comentarios -->
          <div v-else-if="comentariosStore.comentarios.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400">
            <i class="pi pi-comments text-4xl mb-2"></i>
            <p>No se tienen comentarios</p>
          </div>

          <!-- Lista de comentarios -->
          <div v-else class="space-y-3">
            <div
              v-for="comentario in comentariosStore.comentarios"
              :key="comentario.id"
              class="bg-gray-50 rounded-lg p-3 border border-gray-100 group"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-start gap-3 flex-1">
                  <!-- Avatar -->
                  <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {{ getInitials(comentario.coordinador?.nombre_completo || comentario.autor_nombre) }}
                  </div>
                  <!-- Contenido -->
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-gray-800 text-sm">
                        {{ comentario.coordinador?.nombre_completo || comentario.autor_nombre || 'Coordinador' }}
                      </span>
                      <span class="text-xs text-gray-400">
                        {{ formatComentarioDate(comentario.created_at) }}
                      </span>
                    </div>
                    <!-- Modo edición -->
                    <div v-if="comentarioEditandoId === comentario.id" class="mt-2">
                      <div class="flex gap-2 items-center">
                        <InputText
                          v-model="contenidoEditado"
                          class="flex-1 text-sm"
                          :disabled="editandoLoading"
                          @keyup.enter="guardarEdicion(comentario.id)"
                          @keyup.escape="cancelarEdicion"
                        />
                        <Button
                          icon="pi pi-check"
                          severity="success"
                          text
                          rounded
                          size="small"
                          @click="guardarEdicion(comentario.id)"
                          :loading="editandoLoading"
                          v-tooltip.top="'Guardar'"
                        />
                        <Button
                          icon="pi pi-times"
                          severity="secondary"
                          text
                          rounded
                          size="small"
                          @click="cancelarEdicion"
                          :disabled="editandoLoading"
                          v-tooltip.top="'Cancelar'"
                        />
                      </div>
                    </div>
                    <!-- Modo visualización -->
                    <p v-else class="text-gray-700 text-sm mt-1">{{ comentario.contenido }}</p>
                  </div>
                </div>
                <!-- Botones editar y eliminar (solo directivos) -->
                <div v-if="isDirectivo && comentarioEditandoId !== comentario.id" class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <Button
                    icon="pi pi-pencil"
                    severity="warning"
                    text
                    rounded
                    size="small"
                    @click="iniciarEdicion(comentario)"
                    v-tooltip.top="'Editar comentario'"
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    @click="confirmarEliminarComentario(comentario)"
                    v-tooltip.top="'Eliminar comentario'"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input para nuevo comentario (solo directivos) -->
        <div v-if="isDirectivo" class="pt-4 border-t border-gray-200 mt-4">
          <div class="flex gap-2">
            <InputText
              v-model="nuevoComentario"
              placeholder="Escribe un comentario..."
              class="flex-1"
              @keyup.enter="enviarComentario"
              :disabled="comentariosStore.enviando"
            />
            <Button
              icon="pi pi-send"
              severity="primary"
              @click="enviarComentario"
              :loading="comentariosStore.enviando"
              v-tooltip.top="'Enviar comentario'"
            />
          </div>
        </div>

        <!-- Mensaje para docentes -->
        <div v-else class="pt-4 border-t border-gray-200 mt-4">
          <p class="text-sm text-gray-400 text-center">
            <i class="pi pi-info-circle mr-1"></i>
            Solo los coordinadores pueden agregar comentarios
          </p>
        </div>
      </div>
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
