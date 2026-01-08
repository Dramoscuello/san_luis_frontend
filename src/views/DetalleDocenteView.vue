<script setup>
/**
 * ============================================
 * VISTA DE DETALLE DEL DOCENTE
 * ============================================
 * Muestra los módulos asociados al docente:
 * - Planeaciones
 * - Observador del estudiante
 * - Proyectos
 * - Cronograma individual
 */

import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Button from 'primevue/button';
import Paginator from 'primevue/paginator';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from "@/stores/user.js";
import { usePlaneacionesDestacadasStore } from "@/stores/planeacionesDestacadas.js";
import { useComentariosStore } from "@/stores/comentarios.js";
import { planeacionesService } from "@/services/planeacionesService.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";
import { usePeriodosStore } from "@/stores/periodos.js";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const destacadasStore = usePlaneacionesDestacadasStore();
const comentariosStore = useComentariosStore();
const toast = useToast();
const confirm = useConfirm();
const periodosStore = usePeriodosStore();

// Estado de navegación interna
const currentView = ref('modulos'); // 'modulos' | 'planeaciones'

// Datos del docente
const docente = ref(null);
const loading = ref(true);

// Planeaciones del docente
const planeaciones = ref([]);
const loadingPlaneaciones = ref(false);

// Paginación
const first = ref(0);
const rows = ref(8);

// Filtros
const filtroAsignatura = ref(null);
const filtroPeriodo = ref(null);

// Watcher para resetear página cuando cambia cualquier filtro
watch([filtroAsignatura, filtroPeriodo], () => {
  first.value = 0;
});

// Modal de comentarios
const modalComentariosVisible = ref(false);
const planeacionComentarios = ref(null);
const nuevoComentario = ref('');

// Modal de destacar
const modalDestacadaVisible = ref(false);
const planeacionADestacar = ref(null);
const razonDestacada = ref('');
const guardandoDestacada = ref(false);

// Módulos disponibles
const modulos = [
  {
    id: 'planeaciones',
    titulo: 'Planeaciones',
    icono: 'pi-file',
    color: 'bg-blue-600',
    activo: true
  },
  {
    id: 'observador',
    titulo: 'Observador del estudiante',
    icono: 'pi-users',
    color: 'bg-green-600',
    activo: false
  },
  {
    id: 'proyectos',
    titulo: 'Proyectos',
    icono: 'pi-briefcase',
    color: 'bg-purple-600',
    activo: false
  },
  {
    id: 'cronograma',
    titulo: 'Cronograma individual',
    icono: 'pi-calendar',
    color: 'bg-orange-600',
    activo: false
  }
];

// Obtener descripción del módulo
const getModuloDescripcion = (modulo) => {
  const nombre = docente.value?.nombre_completo || 'docente';
  switch (modulo.id) {
    case 'planeaciones':
      return `Módulo para ver las planeaciones del docente ${nombre}`;
    case 'observador':
      return `Módulo para ver el observador de estudiantes del docente ${nombre}`;
    case 'proyectos':
      return `Módulo para ver los proyectos pedagógicos del docente ${nombre}`;
    case 'cronograma':
      return `Módulo para ver el cronograma individual del docente ${nombre}`;
    default:
      return '';
  }
};

// Asignaturas del docente para el filtro
const asignaturasDocente = computed(() => {
  return docente.value?.asignaturas || [];
});

// Planeaciones filtradas
const planeacionesFiltradas = computed(() => {
  let resultado = planeaciones.value;

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

const totalRecords = computed(() => planeacionesFiltradas.value.length);

const onPageChange = (event) => {
  first.value = event.first;
};

// Cargar datos del docente
onMounted(async () => {
  const docenteId = route.params.id;
  
  if (!docenteId) {
    router.push({ name: 'usuarios' });
    return;
  }

  try {
    // Cargar docentes si no están cargados
    if (!userStore.docentes || userStore.docentes.length === 0) {
      await userStore.getDocentes();
    }
    
    // Buscar el docente
    docente.value = userStore.docentes.find(d => d.id === parseInt(docenteId));
    
    if (!docente.value) {
      toast.add({ severity: 'error', summary: 'Error', detail: 'Docente no encontrado', life: 3000 });
      router.push({ name: 'usuarios' });
      return;
    }

    // Cargar destacadas para saber cuáles planeaciones están destacadas
    await destacadasStore.getPlaneacionesDestacadas();
    
    // Cargar periodos para el filtro
    await periodosStore.getPeriodos();
  } catch (error) {
    console.error('Error al cargar docente:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los datos', life: 3000 });
  } finally {
    loading.value = false;
  }
});

// Navegar a un módulo
const navegarAModulo = async (modulo) => {
  if (!modulo.activo) return;
  
  if (modulo.id === 'planeaciones') {
    currentView.value = 'planeaciones';
    await cargarPlaneaciones();
  }
};

// Cargar planeaciones del docente
const cargarPlaneaciones = async () => {
  loadingPlaneaciones.value = true;
  try {
    const data = await planeacionesService.getPlaneaciones(docente.value.id);
    planeaciones.value = data;
  } catch (error) {
    console.error('Error al cargar planeaciones:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar las planeaciones', life: 3000 });
  } finally {
    loadingPlaneaciones.value = false;
  }
};

// Volver a los módulos
const volverAModulos = () => {
  currentView.value = 'modulos';
  planeaciones.value = [];
  first.value = 0;
  // Limpiar filtros
  filtroAsignatura.value = null;
  filtroPeriodo.value = null;
};

// Limpiar filtros
const limpiarFiltros = () => {
  filtroAsignatura.value = null;
  filtroPeriodo.value = null;
  first.value = 0;
};

// Volver a la lista de docentes
const volverADocentes = () => {
  router.push({ name: 'usuarios' });
};

// ============================================
// FUNCIONES PARA PLANEACIONES
// ============================================

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const getInitials = (nombre) => {
  if (!nombre) return '??';
  return nombre
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
};

const verArchivo = (planeacion) => {
  if (planeacion.drive_view_link) {
    window.open(planeacion.drive_view_link, '_blank');
  }
};

// ============================================
// FUNCIONES PARA DESTACAR
// ============================================

const abrirModalDestacar = (planeacion) => {
  planeacionADestacar.value = planeacion;
  razonDestacada.value = '';
  modalDestacadaVisible.value = true;
};

const cerrarModalDestacar = () => {
  modalDestacadaVisible.value = false;
  planeacionADestacar.value = null;
  razonDestacada.value = '';
};

const guardarDestacada = async () => {
  if (!razonDestacada.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Campo requerido', detail: 'La razón es obligatoria', life: 3000 });
    return;
  }

  guardandoDestacada.value = true;
  try {
    await destacadasStore.marcarComoDestacada(planeacionADestacar.value.id, razonDestacada.value.trim());
    toast.add({ severity: 'success', summary: 'Destacada', detail: 'La planeación ha sido marcada como destacada', life: 3000 });
    cerrarModalDestacar();
  } catch (error) {
    console.error('Error al destacar planeación:', error);
    const errorMsg = error.response?.data?.detail || 'No se pudo marcar la planeación como destacada';
    toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 5000 });
  } finally {
    guardandoDestacada.value = false;
  }
};

// ============================================
// FUNCIONES PARA COMENTARIOS
// ============================================

const abrirModalComentarios = async (planeacion) => {
  planeacionComentarios.value = planeacion;
  modalComentariosVisible.value = true;
  nuevoComentario.value = '';
  await comentariosStore.getComentarios(planeacion.id);
};

const cerrarModalComentarios = () => {
  modalComentariosVisible.value = false;
  planeacionComentarios.value = null;
  nuevoComentario.value = '';
  comentariosStore.limpiarComentarios();
};

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

const eliminarComentarioHandler = async (comentario) => {
  try {
    await comentariosStore.eliminarComentario(comentario.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Comentario eliminado', life: 3000 });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el comentario', life: 5000 });
  }
};

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
        <!-- Loading state -->
        <div v-if="loading" class="flex items-center justify-center h-64">
          <i class="pi pi-spin pi-spinner text-4xl text-blue-500"></i>
        </div>

        <template v-else>
          <!-- Header Section -->
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-800 mb-4">
              Detalle del docente: {{ docente?.nombre_completo }}
            </h1>
            
            <!-- Breadcrumb Navigation -->
            <nav class="mb-4 bg-white rounded-lg px-4 py-3 shadow-sm flex items-center gap-2">
              <!-- Home / Docentes -->
              <a 
                class="flex items-center gap-2 text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
                @click="volverADocentes"
              >
                <i class="pi pi-users text-lg"></i>
                <span class="font-medium">Docentes</span>
              </a>

              <!-- Separator + Docente Name -->
              <span class="mx-2 text-gray-400">/</span>
              <a 
                v-if="currentView !== 'modulos'"
                class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium transition-colors"
                @click="volverAModulos"
              >
                {{ docente?.nombre_completo }}
              </a>
              <span v-else class="text-gray-800 font-medium">
                {{ docente?.nombre_completo }}
              </span>

              <!-- Separator + Module Name (if in a module) -->
              <template v-if="currentView === 'planeaciones'">
                <span class="mx-2 text-gray-400">/</span>
                <span class="text-gray-800 font-medium">Planeaciones</span>
              </template>
            </nav>
          </div>

          <!-- ============ MÓDULOS VIEW (Cards) ============ -->
          <div v-if="currentView === 'modulos'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div 
              v-for="modulo in modulos" 
              :key="modulo.id"
              class="modulo-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              :class="{ 'opacity-60': !modulo.activo }"
            >
              <!-- Card Header -->
              <div class="card-header px-4 py-4" :class="modulo.color">
                <h3 class="text-white text-lg font-semibold text-center truncate">
                  {{ modulo.titulo }}
                </h3>
              </div>
              
              <!-- Card Body -->
              <div class="card-body p-4">
                <div class="flex items-start gap-2 text-gray-600">
                  <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                  <span class="text-sm">{{ getModuloDescripcion(modulo) }}</span>
                </div>
              </div>
              
              <!-- Card Footer -->
              <div class="card-footer border-t border-gray-100 px-4 py-3 flex justify-end items-center bg-gray-50">
                <Button
                  icon="pi pi-arrow-right"
                  class="p-button-rounded p-button-sm p-button-text"
                  :severity="modulo.activo ? 'success' : 'secondary'"
                  :disabled="!modulo.activo"
                  @click="navegarAModulo(modulo)"
                  v-tooltip.top="modulo.activo ? 'Entrar' : 'Próximamente'"
                />
              </div>
            </div>
          </div>

          <!-- ============ PLANEACIONES VIEW ============ -->
          <div v-if="currentView === 'planeaciones'">
            <!-- Loading planeaciones -->
            <div v-if="loadingPlaneaciones" class="flex items-center justify-center h-64">
              <i class="pi pi-spin pi-spinner text-3xl text-blue-500"></i>
            </div>

            <template v-else>
              <!-- Filtros -->
              <div class="bg-white rounded-lg border border-gray-200 p-4 mb-4 shadow-sm">
                <div class="flex items-center justify-between mb-3">
                  <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <i class="pi pi-filter text-blue-500"></i>
                    Filtrar planeaciones
                  </h3>
                  <Button
                    v-if="filtroAsignatura || filtroPeriodo"
                    label="Limpiar filtros"
                    icon="pi pi-times"
                    severity="secondary"
                    text
                    size="small"
                    @click="limpiarFiltros"
                  />
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs text-gray-500 mb-1">Por Asignatura</label>
                    <Select
                      v-model="filtroAsignatura"
                      :options="asignaturasDocente"
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
                <p v-if="filtroAsignatura || filtroPeriodo" class="text-xs text-blue-600 mt-2">
                  <i class="pi pi-info-circle mr-1"></i>
                  Mostrando {{ totalRecords }} planeación(es) filtrada(s).
                </p>
              </div>

              <!-- Empty state: Sin planeaciones del docente -->
              <div
                v-if="planeaciones.length === 0"
                class="text-center py-12 bg-white rounded-lg border border-gray-200"
              >
                <i class="pi pi-file text-4xl text-gray-300 mb-3"></i>
                <h4 class="font-semibold text-gray-600 mb-1">Sin planeaciones</h4>
                <p class="text-gray-400 text-sm">Este docente no tiene planeaciones registradas.</p>
              </div>

              <!-- Empty state: Sin resultados por filtros -->
              <div
                v-else-if="planeacionesFiltradas.length === 0"
                class="text-center py-12 bg-white rounded-lg border border-gray-200"
              >
                <i class="pi pi-filter-slash text-4xl text-gray-300 mb-3"></i>
                <h4 class="font-semibold text-gray-600 mb-1">Sin resultados</h4>
                <p class="text-gray-400 text-sm">No hay planeaciones que coincidan con los filtros seleccionados.</p>
                <Button
                  label="Limpiar filtros"
                  icon="pi pi-times"
                  severity="secondary"
                  text
                  size="small"
                  class="mt-3"
                  @click="limpiarFiltros"
                />
              </div>

              <!-- Grid de planeaciones -->
              <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div
                  v-for="plan in planeacionesPaginadas"
                  :key="plan.id"
                  class="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200 group"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="flex-1 min-w-0">
                      <!-- Título -->
                      <h3 class="font-semibold text-gray-800 truncate">{{ plan.titulo }}</h3>

                      <!-- Asignatura y Periodo -->
                      <div class="flex items-center gap-2 mt-2 flex-wrap">
                        <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-200">
                          {{ plan.asignatura?.nombre || 'Sin asignatura' }}
                        </span>
                        <span v-if="plan.periodo" class="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs border border-purple-200">
                          Período {{ plan.periodo.nombre }}
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
                      <Button
                        icon="pi pi-comments"
                        severity="secondary"
                        text
                        rounded
                        size="small"
                        @click="abrirModalComentarios(plan)"
                        v-tooltip.top="'Ver comentarios'"
                      />
                      <Button
                        :icon="destacadasStore.esDestacada(plan.id) ? 'pi pi-star-fill' : 'pi pi-star'"
                        :severity="destacadasStore.esDestacada(plan.id) ? 'warning' : 'secondary'"
                        text
                        rounded
                        size="small"
                        @click="!destacadasStore.esDestacada(plan.id) && abrirModalDestacar(plan)"
                        v-tooltip.top="destacadasStore.esDestacada(plan.id) ? 'Planeación destacada' : 'Marcar como destacada'"
                        :class="{ 'cursor-default': destacadasStore.esDestacada(plan.id) }"
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
            </template>
          </div>
        </template>
      </div>
    </main>

    <!-- Modal para destacar planeación -->
    <Dialog
      v-model:visible="modalDestacadaVisible"
      modal
      header="Destacar Planeación"
      :style="{ width: '450px' }"
      :closable="!guardandoDestacada"
      :closeOnEscape="!guardandoDestacada"
    >
      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-3">
          Vas a destacar la planeación: <strong>{{ planeacionADestacar?.titulo }}</strong>
        </p>
        <label for="razon" class="block font-semibold text-gray-700 mb-2">
          Razón del destacado <span class="text-red-500">*</span>
        </label>
        <Textarea
          id="razon"
          v-model="razonDestacada"
          rows="4"
          placeholder="Escribe la razón por la cual esta planeación merece ser destacada..."
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
                <div class="flex items-start gap-3">
                  <!-- Avatar -->
                  <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {{ getInitials(comentario.coordinador?.nombre_completo || comentario.autor_nombre) }}
                  </div>
                  <!-- Contenido -->
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-gray-800 text-sm">
                        {{ comentario.coordinador?.nombre_completo || comentario.autor_nombre || 'Coordinador' }}
                      </span>
                      <span class="text-xs text-gray-400">
                        {{ formatComentarioDate(comentario.created_at) }}
                      </span>
                    </div>
                    <p class="text-gray-700 text-sm mt-1">{{ comentario.contenido }}</p>
                  </div>
                </div>
                <!-- Botón eliminar -->
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  text
                  rounded
                  size="small"
                  class="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  @click="confirmarEliminarComentario(comentario)"
                  v-tooltip.top="'Eliminar comentario'"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Input para nuevo comentario -->
        <div class="pt-4 border-t border-gray-200 mt-4">
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
