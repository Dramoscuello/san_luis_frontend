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
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from "@/stores/user.js";
import { usePlaneacionesDestacadasStore } from "@/stores/planeacionesDestacadas.js";
import { useComentariosStore } from "@/stores/comentarios.js";
import { useComentariosProyectosStore } from "@/stores/comentariosProyectos.js";
import { planeacionesService } from "@/services/planeacionesService.js";
import proyectosService from "@/services/proyectosService.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";
import { usePeriodosStore } from "@/stores/periodos.js";
import { authService } from "@/services/auth.js";
import { userService } from "@/services/userService.js";
import { estudiantesService } from "@/services/estudiantesService.js";
import { observadoresService } from "@/services/observadoresService.js";
import { generarObservador } from '@/utils/observadorGenerator';

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const destacadasStore = usePlaneacionesDestacadasStore();
const comentariosStore = useComentariosStore();
const comentariosProyectosStore = useComentariosProyectosStore();
const toast = useToast();
const confirm = useConfirm();
const periodosStore = usePeriodosStore();

// Estado de navegación interna
const currentView = ref('modulos'); // 'modulos' | 'planeaciones' | 'observador' | 'proyectos'

// Datos del docente
const docente = ref(null);
const loading = ref(true);

// Planeaciones del docente
const planeaciones = ref([]);
const loadingPlaneaciones = ref(false);

// Proyectos del docente
const proyectos = ref([]);
const loadingProyectos = ref(false);
const proyectoSeleccionado = ref(null);
const evidenciasProyecto = ref([]);
const loadingEvidencias = ref(false);

// Observador - Grupos del docente
const gruposDocente = ref([]);
const loadingGrupos = ref(false);
const grupoSeleccionado = ref(null);
const estudiantesGrupo = ref([]);
const loadingEstudiantes = ref(false);

// Paginación
const first = ref(0);
const rows = ref(8);

// Filtros
const filtroAsignatura = ref(null);
const filtroPeriodo = ref(null);

// Verificar rol de directivo (Coordinador o Rector)
const esDirectivo = computed(() => {
  const role = authService.getUserRole();
  return role === 'coordinador' || role === 'rector';
});

// Watcher para resetear página cuando cambia cualquier filtro
watch([filtroAsignatura, filtroPeriodo], () => {
  first.value = 0;
});

// Modal de comentarios (planeaciones)
const modalComentariosVisible = ref(false);
const planeacionComentarios = ref(null);
const nuevoComentario = ref('');

// Estado para edición de comentarios de planeaciones
const comentarioEditandoId = ref(null);
const contenidoEditado = ref('');
const editandoLoading = ref(false);

// Modal de comentarios de proyectos
const modalComentariosProyectoVisible = ref(false);
const nuevoComentarioProyecto = ref('');
const comentarioProyectoEditandoId = ref(null);
const contenidoProyectoEditado = ref('');

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
    color: 'bg-gradient-to-r from-blue-400 to-green-400',
    activo: true
  },
  {
    id: 'observador',
    titulo: 'Observador del estudiante',
    icono: 'pi-users',
    color: 'bg-gradient-to-r from-blue-400 to-green-400',
    activo: true
  },
  {
    id: 'proyectos',
    titulo: 'Proyectos',
    icono: 'pi-briefcase',
    color: 'bg-gradient-to-r from-blue-400 to-green-400',
    activo: true
  },
  {
    id: 'cronograma',
    titulo: 'Cronograma individual',
    icono: 'pi-calendar',
    color: 'bg-gradient-to-r from-blue-400 to-green-400',
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

// Cargar grupos del docente para el observador
const cargarGruposDocente = async () => {
  loadingGrupos.value = true;
  try {
    const data = await userService.getGruposDocente(docente.value.id);
    gruposDocente.value = data;
  } catch (error) {
    console.error('Error al cargar grupos del docente:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los grupos del docente', life: 3000 });
  } finally {
    loadingGrupos.value = false;
  }
};

// Navegar a un módulo
const navegarAModulo = async (modulo) => {
  if (!modulo.activo) return;
  
  if (modulo.id === 'planeaciones') {
    currentView.value = 'planeaciones';
    await cargarPlaneaciones();
  } else if (modulo.id === 'observador') {
    currentView.value = 'observador';
    await cargarGruposDocente();
  } else if (modulo.id === 'proyectos') {
    currentView.value = 'proyectos';
    await cargarProyectos();
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

// Cargar proyectos del docente
const cargarProyectos = async () => {
  loadingProyectos.value = true;
  try {
    const response = await proyectosService.getProyectos(docente.value.id);
    proyectos.value = response.data;
  } catch (error) {
    console.error('Error al cargar proyectos:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los proyectos', life: 3000 });
  } finally {
    loadingProyectos.value = false;
  }
};

// Volver a los módulos
const volverAModulos = () => {
  currentView.value = 'modulos';
  planeaciones.value = [];
  proyectos.value = [];
  proyectoSeleccionado.value = null;
  gruposDocente.value = [];
  grupoSeleccionado.value = null;
  estudiantesGrupo.value = [];
  first.value = 0;
  // Limpiar filtros
  filtroAsignatura.value = null;
  filtroPeriodo.value = null;
};

// Navegar a un grupo específico (observador) - Cargar estudiantes
const navegarAGrupo = async (grupo) => {
  grupoSeleccionado.value = grupo;
  loadingEstudiantes.value = true;
  try {
    const data = await estudiantesService.getEstudiantesByGrupo(grupo.id);
    estudiantesGrupo.value = data;
  } catch (error) {
    console.error('Error al cargar estudiantes:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los estudiantes del grupo', life: 3000 });
  } finally {
    loadingEstudiantes.value = false;
  }
};

// Volver a la lista de grupos (desde estudiantes)
const volverAGrupos = () => {
  grupoSeleccionado.value = null;
  estudiantesGrupo.value = [];
};

// Generar reporte de observaciones de un estudiante (para directivos)
const handleReportObservador = async (estudiante) => {
  try {
    console.log(`Generando reporte para: ${estudiante.nombres} ${estudiante.apellidos}`);
    const historial = await observadoresService.getHistorialObservaciones(estudiante.id);
    
    if (!historial || historial.length === 0) {
      toast.add({ severity: 'warn', summary: 'Sin observaciones', detail: 'Este estudiante no tiene observaciones registradas para generar el reporte.', life: 4000 });
      return;
    }

    // Mapear historial al formato esperado para el documento
    const mapPeriodos = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };
    const observacionesMap = {};

    historial.forEach(obs => {
      if (obs.periodo && mapPeriodos[obs.periodo]) {
        observacionesMap[mapPeriodos[obs.periodo]] = {
          fortalezas: obs.fortalezas,
          dificultades: obs.dificultades,
          compromisos: obs.compromisos
        };
      }
    });

    // Obtener datos del estudiante desde el historial (viene anidado en cada observación)
    const estudianteData = historial[0]?.estudiante || estudiante;

    // Formatear fecha de nacimiento
    let fechaNacimiento = '';
    if (estudianteData.fecha_nacimiento) {
      const fecha = new Date(estudianteData.fecha_nacimiento);
      fechaNacimiento = fecha.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    // Construir datos del estudiante con la información completa
    const datosEstudiante = {
      nombre: `${estudianteData.nombres} ${estudianteData.apellidos}`,
      grado: grupoSeleccionado.value?.grado?.nombre || '',
      anio: new Date().getFullYear().toString(),
      edad: estudianteData.edad || '',
      fechaNacimiento: fechaNacimiento,
      lugarNacimiento: estudianteData.lugar_nacimiento || '',
      tipoDocumento: estudianteData.tipo_documento || 'T.I.',
      numeroDocumento: estudianteData.numero_documento || '',
      rh: estudianteData.rh || '',
      eps: estudianteData.eps || '',
      nombrePadre: estudianteData.nombre_padre || '',
      ocupacionPadre: estudianteData.ocupacion_padre || '',
      celularPadre: estudianteData.celular_padre || '',
      nombreMadre: estudianteData.nombre_madre || '',
      ocupacionMadre: estudianteData.ocupacion_madre || '',
      celularMadre: estudianteData.celular_madre || '',
      acudiente: estudianteData.nombre_acudiente || '',
      celularAcudiente: estudianteData.celular_acudiente || ''
    };

    toast.add({ severity: 'info', summary: 'Generando documento', detail: 'Por favor espere...', life: 2000 });
    await generarObservador(datosEstudiante, observacionesMap);
    
  } catch (error) {
    console.error("Error al generar reporte:", error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo generar el reporte.', life: 3000 });
  }
};

// Ver detalle de un proyecto
const verDetalleProyecto = async (proyecto) => {
  proyectoSeleccionado.value = proyecto;
  await cargarEvidencias(proyecto.id);
};

// Cargar evidencias del proyecto
const cargarEvidencias = async (proyectoId) => {
  loadingEvidencias.value = true;
  try {
    const response = await proyectosService.getEvidencias(proyectoId);
    evidenciasProyecto.value = response.data;
  } catch (error) {
    console.error('Error al cargar evidencias:', error);
    evidenciasProyecto.value = [];
  } finally {
    loadingEvidencias.value = false;
  }
};

// Volver a la lista de proyectos
const volverAProyectos = () => {
  proyectoSeleccionado.value = null;
  evidenciasProyecto.value = [];
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

const abrirEnlace = (url) => {
  if (url) window.open(url, '_blank');
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
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

// ============================================
// FUNCIONES PARA COMENTARIOS DE PROYECTOS
// ============================================

const abrirComentariosProyecto = async () => {
  modalComentariosProyectoVisible.value = true;
  nuevoComentarioProyecto.value = '';
  comentarioProyectoEditandoId.value = null;
  contenidoProyectoEditado.value = '';
  await comentariosProyectosStore.getComentarios(proyectoSeleccionado.value.id);
};

const cerrarComentariosProyecto = () => {
  modalComentariosProyectoVisible.value = false;
  nuevoComentarioProyecto.value = '';
  comentarioProyectoEditandoId.value = null;
  contenidoProyectoEditado.value = '';
  comentariosProyectosStore.limpiarComentarios();
};

const enviarComentarioProyecto = async () => {
  if (!nuevoComentarioProyecto.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El comentario no puede estar vacío', life: 3000 });
    return;
  }

  try {
    await comentariosProyectosStore.crearComentario(proyectoSeleccionado.value.id, nuevoComentarioProyecto.value.trim());
    nuevoComentarioProyecto.value = '';
    toast.add({ severity: 'success', summary: 'Enviado', detail: 'Comentario agregado correctamente', life: 3000 });
  } catch (error) {
    console.error('Error al enviar comentario:', error);
    const errorMsg = error.response?.data?.detail || 'No se pudo enviar el comentario';
    toast.add({ severity: 'error', summary: 'Error', detail: errorMsg, life: 5000 });
  }
};

const iniciarEdicionComentarioProyecto = (comentario) => {
  comentarioProyectoEditandoId.value = comentario.id;
  contenidoProyectoEditado.value = comentario.contenido;
};

const cancelarEdicionComentarioProyecto = () => {
  comentarioProyectoEditandoId.value = null;
  contenidoProyectoEditado.value = '';
};

const guardarEdicionComentarioProyecto = async (comentarioId) => {
  if (!contenidoProyectoEditado.value.trim()) {
    toast.add({ severity: 'warn', summary: 'Campo requerido', detail: 'El comentario no puede estar vacío', life: 3000 });
    return;
  }

  try {
    await comentariosProyectosStore.actualizarComentario(comentarioId, contenidoProyectoEditado.value.trim());
    comentarioProyectoEditandoId.value = null;
    contenidoProyectoEditado.value = '';
    toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Comentario actualizado', life: 3000 });
  } catch (error) {
    console.error('Error al actualizar comentario:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el comentario', life: 5000 });
  }
};

const eliminarComentarioProyectoHandler = async (comentario) => {
  try {
    await comentariosProyectosStore.eliminarComentario(comentario.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Comentario eliminado', life: 3000 });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar el comentario', life: 5000 });
  }
};

const confirmarEliminarComentarioProyecto = (comentario) => {
  confirmAlert(
    confirm,
    '¿Estás seguro que deseas eliminar este comentario?',
    () => eliminarComentarioProyectoHandler(comentario),
    {
      header: 'Eliminar Comentario',
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
              <template v-if="currentView === 'observador'">
                <span class="mx-2 text-gray-400">/</span>
                <a 
                  v-if="grupoSeleccionado"
                  class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium transition-colors"
                  @click="volverAGrupos"
                >
                  Observador del estudiante
                </a>
                <span v-else class="text-gray-800 font-medium">Observador del estudiante</span>
                
                <!-- Nombre del grupo seleccionado -->
                <template v-if="grupoSeleccionado">
                  <span class="mx-2 text-gray-400">/</span>
                  <span class="text-gray-800 font-medium">{{ grupoSeleccionado?.grado?.nombre }}-{{ grupoSeleccionado?.nombre }}</span>
                </template>
              </template>
              <template v-if="currentView === 'proyectos'">
                <span class="mx-2 text-gray-400">/</span>
                <a 
                  v-if="proyectoSeleccionado"
                  class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium transition-colors"
                  @click="volverAProyectos"
                >
                  Proyectos
                </a>
                <span v-else class="text-gray-800 font-medium">Proyectos</span>
                
                <!-- Nombre del proyecto seleccionado -->
                <template v-if="proyectoSeleccionado">
                  <span class="mx-2 text-gray-400">/</span>
                  <span class="text-gray-800 font-medium">{{ proyectoSeleccionado.titulo }}</span>
                </template>
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
                       
                      />
                      <Button
                        icon="pi pi-comments"
                        severity="secondary"
                        text
                        rounded
                        size="small"
                        @click="abrirModalComentarios(plan)"
                       
                      />
                      <Button
                        :icon="destacadasStore.esDestacada(plan.id) ? 'pi pi-star-fill' : 'pi pi-star'"
                        :severity="destacadasStore.esDestacada(plan.id) ? 'warning' : 'secondary'"
                        text
                        rounded
                        size="small"
                        @click="!destacadasStore.esDestacada(plan.id) && abrirModalDestacar(plan)"
                       
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

          <!-- ============ OBSERVADOR VIEW (Grupos y Estudiantes) ============ -->
          <div v-if="currentView === 'observador'">
            <!-- Loading grupos -->
            <div v-if="loadingGrupos" class="flex items-center justify-center h-64">
              <i class="pi pi-spin pi-spinner text-3xl text-blue-500"></i>
            </div>

            <template v-else>
              <!-- ======= VISTA DE ESTUDIANTES DEL GRUPO ======= -->
              <div v-if="grupoSeleccionado">
                <!-- Loading estudiantes -->
                <div v-if="loadingEstudiantes" class="flex items-center justify-center h-64">
                  <i class="pi pi-spin pi-spinner text-3xl text-blue-500"></i>
                </div>

                <template v-else>
                  <div class="bg-white rounded-xl shadow-md overflow-hidden">
                    <DataTable 
                      :value="estudiantesGrupo" 
                      :paginator="true"
                      :rows="10"
                      :rowsPerPageOptions="[5, 10, 20, 50]"
                      tableStyle="min-width: 50rem"
                      stripedRows
                      :globalFilterFields="['numero_documento', 'nombres', 'apellidos']"
                    >
                      <template #empty>
                        <div class="text-center py-8">
                          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i class="pi pi-users text-3xl text-gray-400"></i>
                          </div>
                          <p class="text-gray-500">No hay estudiantes registrados en este grupo</p>
                        </div>
                      </template>
                      
                      <Column field="numero_documento" header="N° Documento" sortable style="width: 20%"></Column>
                      <Column field="nombres" header="Nombres" sortable style="width: 30%"></Column>
                      <Column field="apellidos" header="Apellidos" sortable style="width: 30%"></Column>
                      <Column header="Opciones" style="width: 20%">
                        <template #body="slotProps">
                          <div class="flex gap-2">
                            <Button
                              icon="pi pi-file-pdf"
                              class="p-button-rounded p-button-sm"
                              severity="warning"
                              @click="handleReportObservador(slotProps.data)"
                            />
                          </div>
                        </template>
                      </Column>
                    </DataTable>
                  </div>
                </template>
              </div>

              <!-- ======= VISTA DE GRUPOS ======= -->
              <template v-else>
                <!-- Grid de grupos -->
                <div v-if="gruposDocente.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div 
                    v-for="grupo in gruposDocente" 
                    :key="grupo.id"
                    class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <!-- Card Header -->
                    <div class="card-header bg-gradient-to-r from-blue-400 to-green-400 px-4 py-4">
                      <h3 class="text-white text-lg font-semibold text-center truncate">
                        {{ grupo?.grado?.nombre }}-{{ grupo.nombre }}
                      </h3>
                    </div>
                    
                    <!-- Card Body -->
                    <div class="p-6 flex flex-col items-center justify-center min-h-[100px]">
                        <i class="pi pi-users text-4xl text-blue-200 mb-2"></i>
                        <span class="text-gray-500 font-medium">Grupo a cargo</span>
                    </div>
                    
                    <!-- Card Footer -->
                    <div class="border-t border-gray-100 px-4 py-3 flex justify-end items-center bg-gray-50">
                      <Button
                        icon="pi pi-arrow-right"
                        label="Entrar"
                        class="p-button-sm p-button-text"
                        severity="primary"
                        @click="navegarAGrupo(grupo)"
                      />
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div v-else class="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
                    <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <i class="pi pi-folder-open text-2xl text-gray-400"></i>
                    </div>
                    <h3 class="text-lg font-medium text-gray-800 mb-1">Sin grupos asignados</h3>
                    <p class="text-gray-500 text-center max-w-md">
                        Este docente no tiene grupos asignados como director de grupo actualmente.
                    </p>
                </div>
              </template>
            </template>
          </div>

          <!-- ============ PROYECTOS VIEW ============ -->
          <div v-if="currentView === 'proyectos'">
            <!-- Loading proyectos -->
            <div v-if="loadingProyectos" class="flex items-center justify-center h-64">
              <i class="pi pi-spin pi-spinner text-3xl text-blue-500"></i>
            </div>

            <template v-else>
              <!-- ======= VISTA DE DETALLE DEL PROYECTO (Hoja) ======= -->
              <div v-if="proyectoSeleccionado" class="flex justify-center">
                <div class="w-full max-w-4xl bg-white shadow-xl rounded-xl border border-gray-200 min-h-[600px] flex flex-col">
                  
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
                            {{ getInitials(docente?.nombre_completo) }}
                          </div>
                          <span class="font-medium">{{ docente?.nombre_completo }}</span>
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
                        @click="abrirEnlace(proyectoSeleccionado.drive_view_link)"
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
                        <span v-if="evidenciasProyecto.length > 0" class="text-sm font-normal text-gray-400">({{ evidenciasProyecto.length }})</span>
                      </h3>
                    </div>

                    <!-- Loading Evidencias -->
                    <div v-if="loadingEvidencias" class="flex justify-center py-10">
                      <i class="pi pi-spin pi-spinner text-2xl text-blue-500"></i>
                    </div>

                    <!-- Empty State Evidencias -->
                    <div v-else-if="evidenciasProyecto.length === 0" class="border-2 border-dashed border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center text-gray-400 bg-white">
                      <i class="pi pi-images text-4xl mb-3 opacity-50"></i>
                      <p class="font-medium">Sin evidencias registradas</p>
                      <p class="text-xs mt-1">Este proyecto aún no tiene evidencias subidas.</p>
                    </div>

                    <!-- Lista de Evidencias -->
                    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        v-for="evidencia in evidenciasProyecto" 
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
                          <!-- Botón ver -->
                          <Button 
                            icon="pi pi-external-link"
                            text
                            rounded
                            size="small"
                            severity="info"
                            @click="abrirEnlace(evidencia.drive_view_link)"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- FOOTER: Solo botón de comentarios para directivos -->
                  <div class="p-6 border-t border-gray-100 bg-white rounded-b-xl">
                    <div class="flex justify-center">
                      <Button 
                        icon="pi pi-comments" 
                        label="Comentar"
                        severity="info" 
                        @click="abrirComentariosProyecto"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <!-- ======= VISTA DE LISTA DE PROYECTOS (Cards) ======= -->
              <template v-else>
                <!-- Empty state: Sin proyectos del docente -->
                <div
                  v-if="proyectos.length === 0"
                  class="text-center py-12 bg-white rounded-lg border border-gray-200"
                >
                  <i class="pi pi-briefcase text-4xl text-gray-300 mb-3"></i>
                  <h4 class="font-semibold text-gray-600 mb-1">Sin proyectos</h4>
                  <p class="text-gray-400 text-sm">Este docente no tiene proyectos registrados.</p>
                </div>

                <!-- Grid de proyectos como Cards -->
                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div
                    v-for="proyecto in proyectos"
                    :key="proyecto.id"
                    class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                  >
                    <!-- Card Header -->
                    <div class="px-4 py-4 bg-gradient-to-r from-blue-400 to-green-400">
                      <h3 class="text-white text-lg font-semibold text-center truncate">
                        {{ proyecto.titulo }}
                      </h3>
                    </div>
                    
                    <!-- Card Body -->
                    <div class="p-4">
                      <div class="flex items-start gap-2 text-gray-600 mb-3">
                        <i class="pi pi-info-circle text-blue-500 mt-0.5"></i>
                        <span class="text-sm line-clamp-3">{{ proyecto.descripcion }}</span>
                      </div>
                      
                      <!-- Fechas -->
                      <div class="flex items-center gap-2 text-xs text-gray-400">
                        <i class="pi pi-calendar"></i>
                        <span>{{ formatDate(proyecto.fecha_inicio) }}</span>
                        <span v-if="proyecto.fecha_fin_estimada">
                          → {{ formatDate(proyecto.fecha_fin_estimada) }}
                        </span>
                      </div>
                      
                      <!-- Estado badge -->
                      <div class="mt-3">
                        <span class="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs uppercase font-semibold">
                          {{ proyecto.estado || 'Activo' }}
                        </span>
                      </div>
                    </div>
                    
                    <!-- Card Footer -->
                    <div class="border-t border-gray-100 px-4 py-3 flex justify-end items-center bg-gray-50">
                      <Button
                        icon="pi pi-arrow-right"
                        class="p-button-rounded p-button-sm p-button-text"
                        severity="success"
                        @click="verDetalleProyecto(proyecto)"
                       
                      />
                    </div>
                  </div>
                </div>
              </template>
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
                <div v-if="esDirectivo && comentarioEditandoId !== comentario.id" class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
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

        <!-- Input para nuevo comentario -->
        <div v-if="esDirectivo" class="pt-4 border-t border-gray-200 mt-4">
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
             
            />
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Modal de Comentarios de Proyectos -->
    <Dialog
      v-model:visible="modalComentariosProyectoVisible"
      modal
      :header="`Comentarios: ${proyectoSeleccionado?.titulo || ''}`"
      :style="{ width: '50vw' }"
      :breakpoints="{ '960px': '75vw', '640px': '95vw' }"
      @hide="cerrarComentariosProyecto"
    >
      <div class="flex flex-col h-[500px]">
        <!-- Lista de comentarios con scroll -->
        <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <!-- Loading state -->
          <div v-if="comentariosProyectosStore.loading" class="flex items-center justify-center h-full">
            <i class="pi pi-spin pi-spinner text-2xl text-blue-500"></i>
          </div>

          <!-- Sin comentarios -->
          <div v-else-if="comentariosProyectosStore.comentarios.length === 0" class="flex flex-col items-center justify-center h-full text-gray-400">
            <i class="pi pi-comments text-4xl mb-2"></i>
            <p>No hay comentarios aún</p>
            <p class="text-xs mt-1">Agrega el primer comentario a este proyecto</p>
          </div>

          <!-- Lista de comentarios -->
          <div v-else class="space-y-3">
            <div
              v-for="comentario in comentariosProyectosStore.comentarios"
              :key="comentario.id"
              class="bg-gray-50 rounded-lg p-4 border border-gray-100 group"
            >
              <div class="flex items-start justify-between gap-2">
                <div class="flex items-start gap-3 flex-1">
                  <!-- Avatar -->
                  <div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {{ getInitials(comentario.coordinador?.nombre_completo) }}
                  </div>
                  <!-- Contenido -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-semibold text-gray-800 text-sm">
                        {{ comentario.coordinador?.nombre_completo || 'Coordinador' }}
                      </span>
                      <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded-full uppercase font-semibold">
                        {{ comentario.coordinador?.rol || 'Directivo' }}
                      </span>
                      <span class="text-xs text-gray-400">
                        {{ formatComentarioDate(comentario.created_at) }}
                      </span>
                    </div>
                    
                    <!-- Modo edición -->
                    <div v-if="comentarioProyectoEditandoId === comentario.id" class="mt-2">
                      <Textarea
                        v-model="contenidoProyectoEditado"
                        rows="2"
                        class="w-full text-sm"
                        autoResize
                      />
                      <div class="flex gap-2 mt-2">
                        <Button
                          label="Guardar"
                          icon="pi pi-check"
                          size="small"
                          @click="guardarEdicionComentarioProyecto(comentario.id)"
                        />
                        <Button
                          label="Cancelar"
                          severity="secondary"
                          text
                          size="small"
                          @click="cancelarEdicionComentarioProyecto"
                        />
                      </div>
                    </div>
                    
                    <!-- Modo lectura -->
                    <p v-else class="text-gray-700 text-sm whitespace-pre-wrap">{{ comentario.contenido }}</p>
                  </div>
                </div>
                
                <!-- Botones de acción (solo si no está editando) -->
                <div v-if="comentarioProyectoEditandoId !== comentario.id" class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    icon="pi pi-pencil"
                    severity="secondary"
                    text
                    rounded
                    size="small"
                    @click="iniciarEdicionComentarioProyecto(comentario)"
                   
                  />
                  <Button
                    icon="pi pi-trash"
                    severity="danger"
                    text
                    rounded
                    size="small"
                    @click="confirmarEliminarComentarioProyecto(comentario)"
                   
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Input para nuevo comentario -->
        <div class="pt-4 border-t border-gray-200 mt-4">
          <div class="flex gap-2">
            <Textarea
              v-model="nuevoComentarioProyecto"
              placeholder="Escribe un comentario..."
              class="flex-1"
              rows="2"
              autoResize
              @keydown.enter.prevent="enviarComentarioProyecto"
              :disabled="comentariosProyectosStore.enviando"
            />
            <Button
              icon="pi pi-send"
              severity="primary"
              @click="enviarComentarioProyecto"
              :loading="comentariosProyectosStore.enviando"
             
              class="self-end"
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
