<script setup>
import { ref, computed, onMounted } from "vue";
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import FileUpload from 'primevue/fileupload';
import { useSedesStore } from "@/stores/sedes.js";
import { useGradosStore } from "@/stores/grados.js";
import { useGruposStore } from "@/stores/grupos.js";
import { useEstudiantesStore } from "@/stores/estudiantes.js";
import { useModalSedeStore } from "@/stores/modalSedes.js";
import { useModalGradoStore } from "@/stores/modalGrados.js";
import { useModalGrupoStore } from "@/stores/modalGrupos.js";
import { useModalEstudianteStore } from "@/stores/modalEstudiantes.js";
import ModalSedes from "@/components/ModalSedes.vue";
import ModalGrados from "@/components/ModalGrados.vue";
import ModalGrupos from "@/components/ModalGrupos.vue";
import ModalEstudiantes from "@/components/ModalEstudiantes.vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";

// Librería para leer archivos Excel (.xlsx)
import * as XLSX from 'xlsx';

// Servicio para carga masiva
import { estudiantesService } from "@/services/estudiantesService.js";

// Stores
const sedesStore = useSedesStore();
const gradosStore = useGradosStore();
const gruposStore = useGruposStore();
const estudiantesStore = useEstudiantesStore();
const storeModalSedes = useModalSedeStore();
const storeModalGrados = useModalGradoStore();
const storeModalGrupos = useModalGrupoStore();
const storeModalEstudiantes = useModalEstudianteStore();
const toast = useToast();
const confirm = useConfirm();

// Navigation state
const currentView = ref('sedes'); // 'sedes' | 'grados' | 'grupos' | 'estudiantes'
const selectedSede = ref(null);
const selectedGrado = ref(null);
const selectedGrupo = ref(null);

// Estado para carga masiva de estudiantes
const selectedFile = ref(null);
const isUploading = ref(false);
const isUploadMenuOpen = ref(false);

// Page title
const pageTitle = computed(() => {
  if (currentView.value === 'estudiantes') {
    return `Estudiantes del grupo ${selectedGrupo.value?.nombre}`;
  } else if (currentView.value === 'grupos') {
    return `Grupos de ${selectedGrado.value?.nombre}`;
  } else if (currentView.value === 'grados') {
    return `Grados de ${selectedSede.value?.nombre}`;
  }
  return 'Gestión de sedes';
});

// Navigation functions
const navigateToSedes = () => {
  currentView.value = 'sedes';
  selectedSede.value = null;
  selectedGrado.value = null;
  selectedGrupo.value = null;
  gradosStore.clearGrados();
  gruposStore.clearGrupos();
  estudiantesStore.clearEstudiantes();
};

const navigateToGrados = async (sede) => {
  selectedSede.value = sede;
  selectedGrado.value = null;
  selectedGrupo.value = null;
  currentView.value = 'grados';
  gruposStore.clearGrupos();
  estudiantesStore.clearEstudiantes();
  
  try {
    await gradosStore.getGradosBySede(sede.id);
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los grados', life: 3000 });
  }
};

const navigateToGrupos = async (grado) => {
  selectedGrado.value = grado;
  selectedGrupo.value = null;
  currentView.value = 'grupos';
  estudiantesStore.clearEstudiantes();
  
  try {
    await gruposStore.getGruposByGrado(grado.id);
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los grupos', life: 3000 });
  }
};

const navigateToEstudiantes = async (grupo) => {
  selectedGrupo.value = grupo;
  currentView.value = 'estudiantes';
  
  try {
    await estudiantesStore.getEstudiantesByGrupo(grupo.id);
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cargar los estudiantes', life: 3000 });
  }
};

// ============ SEDES FUNCTIONS ============
const agregarNuevaSede = () => {
  sedesStore.sede.nombre = '';
  sedesStore.sede.codigo = '';
  sedesStore.sede.direccion = '';
  sedesStore.sede.id = null;
  sedesStore.sede.activa = true;
  storeModalSedes.toggleModalSede();
};

const editarSede = (sede) => {
  sedesStore.sede.nombre = sede.nombre;
  sedesStore.sede.codigo = sede.codigo;
  sedesStore.sede.direccion = sede.direccion;
  sedesStore.sede.id = sede.id;
  sedesStore.sede.activa = sede.activa;
  storeModalSedes.toggleModalSede();
};

const toggleActivo = async (sede) => {
  try {
    await sedesStore.updateEstado({ id: sede.id, activa: !sede.activa });
  } catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const eliminarSede = async (sede) => {
  try {
    await sedesStore.deleteSede(sede.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Sede eliminada correctamente', life: 3000 });
  } catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const confirmDeleteSede = (sede) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar la sede "${sede.nombre}"?`,
    () => eliminarSede(sede),
    {
      header: 'Eliminar Sede',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
};

// ============ GRADOS FUNCTIONS ============
const agregarNuevoGrado = () => {
  gradosStore.clearGrado();
  gradosStore.grado.sede_id = selectedSede.value.id;
  storeModalGrados.toggleModalGrado();
};

const editarGrado = (grado) => {
  gradosStore.grado.nombre = grado.nombre;
  gradosStore.grado.id = grado.id;
  gradosStore.grado.sede_id = grado.sede_id;
  storeModalGrados.toggleModalGrado();
};

const eliminarGrado = async (grado) => {
  try {
    await gradosStore.deleteGrado(grado.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Grado eliminado correctamente', life: 3000 });
  } catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const confirmDeleteGrado = (grado) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar el grado "${grado.nombre}"?`,
    () => eliminarGrado(grado),
    {
      header: 'Eliminar Grado',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
};

// ============ GRUPOS FUNCTIONS ============
const agregarNuevoGrupo = () => {
  gruposStore.clearGrupo();
  gruposStore.grupo.grado_id = selectedGrado.value.id;
  storeModalGrupos.toggleModalGrupo();
};

const editarGrupo = (grupo) => {
  gruposStore.grupo.nombre = grupo.nombre;
  gruposStore.grupo.id = grupo.id;
  gruposStore.grupo.grado_id = grupo.grado_id;
  storeModalGrupos.toggleModalGrupo();
};

const eliminarGrupo = async (grupo) => {
  try {
    await gruposStore.deleteGrupo(grupo.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Grupo eliminado correctamente', life: 3000 });
  } catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const confirmDeleteGrupo = (grupo) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar el grupo "${grupo.nombre}"?`,
    () => eliminarGrupo(grupo),
    {
      header: 'Eliminar Grupo',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
};

// ============ ESTUDIANTES FUNCTIONS ============
const agregarNuevoEstudiante = () => {
  estudiantesStore.clearEstudiante();
  estudiantesStore.estudiante.grupo_id = selectedGrupo.value.id;
  storeModalEstudiantes.toggleModalEstudiante();
};

const editarEstudiante = (estudiante) => {
  estudiantesStore.estudiante.numero_documento = estudiante.numero_documento;
  estudiantesStore.estudiante.nombres = estudiante.nombres;
  estudiantesStore.estudiante.apellidos = estudiante.apellidos;
  estudiantesStore.estudiante.id = estudiante.id;
  estudiantesStore.estudiante.grupo_id = estudiante.grupo_id;
  storeModalEstudiantes.toggleModalEstudiante();
};

const eliminarEstudiante = async (estudiante) => {
  try {
    await estudiantesStore.deleteEstudiante(estudiante.id);
    toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Estudiante eliminado correctamente', life: 3000 });
  } catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const confirmDeleteEstudiante = (estudiante) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar al estudiante "${estudiante.nombres} ${estudiante.apellidos}"?`,
    () => eliminarEstudiante(estudiante),
    {
      header: 'Eliminar Estudiante',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
};

// ============ CARGA MASIVA DE ESTUDIANTES ============
const toggleUploadMenu = () => {
  isUploadMenuOpen.value = !isUploadMenuOpen.value;
  if (!isUploadMenuOpen.value) {
    selectedFile.value = null;
  }
};

const onFileSelect = (event) => {
  selectedFile.value = event.files[0];
};

const readXLSXFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

const processEstudiantes = async (estudiantesData) => {
  const result = { 
    success: 0,
    errors: []
  };
  
  for (let i = 0; i < estudiantesData.length; i++) {
    const row = estudiantesData[i];
    const rowNumber = i + 2;
    
    try {
      const numero_documento = row.numero_documento || row.Numero_Documento || row.NUMERO_DOCUMENTO || row.documento || row.Documento;
      const nombres = row.nombres || row.Nombres || row.NOMBRES;
      const apellidos = row.apellidos || row.Apellidos || row.APELLIDOS;
      
      const estudianteData = {
        numero_documento: numero_documento ? String(numero_documento).trim() : undefined,
        nombres: nombres ? String(nombres).trim() : undefined,
        apellidos: apellidos ? String(apellidos).trim() : undefined,
        grupo_id: selectedGrupo.value.id
      };
      
      const camposFaltantes = [];
      if (!estudianteData.numero_documento) camposFaltantes.push('numero_documento');
      if (!estudianteData.nombres) camposFaltantes.push('nombres');
      if (!estudianteData.apellidos) camposFaltantes.push('apellidos');
      
      if (camposFaltantes.length > 0) {
        throw new Error(`Fila ${rowNumber}: Campos faltantes: ${camposFaltantes.join(', ')}`);
      }
      
      const { data } = await estudiantesService.createEstudiante(estudianteData);
      estudiantesStore.estudiantes.push(data);
      result.success++;
      
    } catch (error) {
      let errorMessage = 'Error desconocido';
      
      if (error.response?.data) {
        const backendError = error.response.data;
        if (typeof backendError === 'string') {
          errorMessage = backendError;
        } else if (backendError.detail) {
          errorMessage = typeof backendError.detail === 'string' 
            ? backendError.detail 
            : JSON.stringify(backendError.detail);
        } else {
          errorMessage = JSON.stringify(backendError);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      result.errors.push({
        fila: rowNumber,
        documento: row.numero_documento || row.Numero_Documento || 'N/A',
        error: errorMessage
      });
    }
  }
  
  return result;
};

const uploadEstudiantes = async () => {
  if (!selectedFile.value) {
    toast.add({ 
      severity: 'warn', 
      summary: 'Archivo requerido', 
      detail: 'Por favor seleccione un archivo XLSX', 
      life: 3000 
    });
    return;
  }

  isUploading.value = true;
  
  try {
    const data = await readXLSXFile(selectedFile.value);
    
    if (data.length === 0) {
      toast.add({ 
        severity: 'warn', 
        summary: 'Archivo vacío', 
        detail: 'El archivo no contiene datos para procesar', 
        life: 3000 
      });
      return;
    }

    const result = await processEstudiantes(data);
    
    if (result.success > 0) {
      toast.add({ 
        severity: 'success', 
        summary: 'Estudiantes creados', 
        detail: `Se crearon ${result.success} estudiante(s) exitosamente`, 
        life: 5000 
      });
    }
    
    if (result.errors.length > 0) {
      toast.add({ 
        severity: 'warn', 
        summary: 'Algunos errores', 
        detail: `${result.errors.length} registro(s) no pudieron crearse. Ver consola para detalles.`, 
        life: 5000 
      });
      console.log('❌ Errores en carga masiva:', result.errors);
    }

    isUploadMenuOpen.value = false;
    selectedFile.value = null;
    
  } catch (error) {
    console.error('Error procesando archivo:', error);
    toast.add({ 
      severity: 'error', 
      summary: 'Error', 
      detail: 'Error al procesar el archivo. Verifique el formato.', 
      life: 3000 
    });
  } finally {
    isUploading.value = false;
  }
};

// Count functions for cards
const getGradosCount = (sede) => {
  return sede.cantidad_grados || 0;
};

const getGruposCount = (grado) => {
  return grado.cantidad_grupos || 0;
};

// Load initial data
onMounted(async () => {
  await sedesStore.getSedes();
});
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
      <div class="p-8" id="sedes-management">
        <!-- Header Section -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-4">{{ pageTitle }}</h1>
          
          <!-- Breadcrumb Navigation -->
          <nav class="mb-4 bg-white rounded-lg px-4 py-3 shadow-sm flex items-center gap-2">
            <!-- Home / Sedes -->
            <a 
              class="flex items-center gap-2 text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
              :class="{ 'text-gray-800': currentView === 'sedes' }"
              @click="navigateToSedes"
            >
              <i class="pi pi-home text-lg"></i>
              <span class="font-medium">Sedes</span>
            </a>

            <!-- Separator + Sede Name -->
            <template v-if="selectedSede">
              <span class="mx-2 text-gray-400">/</span>
              <a 
                v-if="currentView !== 'grados'"
                class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium transition-colors"
                @click="navigateToGrados(selectedSede)"
              >
                {{ selectedSede.nombre }}
              </a>
              <span v-else class="text-gray-800 font-medium">
                {{ selectedSede.nombre }}
              </span>
            </template>

            <!-- Separator + Grado Name -->
            <template v-if="selectedGrado">
              <span class="mx-2 text-gray-400">/</span>
              <a 
                v-if="currentView !== 'grupos'"
                class="text-blue-600 hover:text-blue-800 cursor-pointer font-medium transition-colors"
                @click="navigateToGrupos(selectedGrado)"
              >
                {{ selectedGrado.nombre }}
              </a>
              <span v-else class="text-gray-800 font-medium">
                {{ selectedGrado.nombre }}
              </span>
            </template>

            <!-- Separator + Grupo Name -->
            <template v-if="selectedGrupo">
              <span class="mx-2 text-gray-400">/</span>
              <span class="text-gray-800 font-medium">
                {{ selectedGrupo.nombre }}
              </span>
            </template>
          </nav>
        </div>

        <!-- ============ SEDES VIEW ============ -->
        <div v-if="currentView === 'sedes'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Sede Cards -->
          <div 
            v-for="sede in sedesStore.sedes" 
            :key="sede.id"
            class="sede-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <!-- Card Header -->
            <div class="card-header bg-blue-600 px-4 py-4">
              <h3 class="text-white text-lg font-semibold text-center truncate">
                {{ sede.nombre }}
              </h3>
            </div>
            
            <!-- Card Body -->
            <div class="card-body p-4 space-y-2">
              <div class="flex items-center gap-2 text-gray-600">
                <i class="pi pi-map-marker text-blue-500"></i>
                <span class="text-sm truncate">{{ sede.direccion || 'Sin dirección' }}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <i class="pi pi-hashtag text-blue-500"></i>
                <span class="text-sm">Código: {{ sede.codigo }}</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <i class="pi pi-book text-blue-500"></i>
                <span class="text-sm">{{ getGradosCount(sede) }} grado(s)</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600">
                <i class="pi pi-briefcase text-blue-500"></i>
                <span class="text-sm">{{ sede.cantidad_docentes || 0 }} docente(s)</span>
              </div>
              <div class="mt-3">
                <span 
                  :class="sede.activa ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'"
                  class="px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors"
                  @click="toggleActivo(sede)"
                >
                  {{ sede.activa ? 'Activa' : 'Inactiva' }}
                </span>
              </div>
            </div>
            
            <!-- Card Footer -->
            <div class="card-footer border-t border-gray-100 px-4 py-3 flex justify-between items-center bg-gray-50">
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-sm p-button-text"
                severity="danger"
                @click="confirmDeleteSede(sede)"
                v-tooltip.top="'Eliminar'"
              />
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-sm p-button-text"
                severity="info"
                @click="editarSede(sede)"
                v-tooltip.top="'Editar'"
              />
              <Button
                icon="pi pi-arrow-right"
                class="p-button-rounded p-button-sm p-button-text"
                :severity="sede.activa ? 'success' : 'secondary'"
                :disabled="!sede.activa"
                @click="navigateToGrados(sede)"
                v-tooltip.top="sede.activa ? 'Ver grados' : 'Sede inactiva'"
              />
            </div>
          </div>

          <!-- Add New Sede Card -->
          <div 
            class="add-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center min-h-[240px]"
            @click="agregarNuevaSede"
          >
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i class="pi pi-plus text-3xl text-blue-600"></i>
              </div>
              <span class="text-gray-500 font-medium">Agregar Sede</span>
            </div>
          </div>
        </div>

        <!-- ============ GRADOS VIEW ============ -->
        <div v-if="currentView === 'grados'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Grado Cards -->
          <div 
            v-for="grado in gradosStore.grados" 
            :key="grado.id"
            class="grado-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <!-- Card Header -->
            <div class="card-header bg-blue-600 px-4 py-4">
              <h3 class="text-white text-lg font-semibold text-center truncate">
                {{ grado.nombre }}
              </h3>
            </div>
            
            <!-- Card Body -->
            <div class="card-body p-4">
              <div class="flex items-center gap-2 text-gray-600">
                <i class="pi pi-users text-blue-500"></i>
                <span class="text-sm">{{ getGruposCount(grado) }} grupo(s)</span>
              </div>
            </div>
            
            <!-- Card Footer -->
            <div class="card-footer border-t border-gray-100 px-4 py-3 flex justify-between items-center bg-gray-50">
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-sm p-button-text"
                severity="danger"
                @click="confirmDeleteGrado(grado)"
                v-tooltip.top="'Eliminar'"
              />
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-sm p-button-text"
                severity="info"
                @click="editarGrado(grado)"
                v-tooltip.top="'Editar'"
              />
              <Button
                icon="pi pi-arrow-right"
                class="p-button-rounded p-button-sm p-button-text"
                severity="success"
                @click="navigateToGrupos(grado)"
                v-tooltip.top="'Ver grupos'"
              />
            </div>
          </div>

          <!-- Add New Grado Card -->
          <div 
            class="add-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center min-h-[200px]"
            @click="agregarNuevoGrado"
          >
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i class="pi pi-plus text-3xl text-blue-600"></i>
              </div>
              <span class="text-gray-500 font-medium">Agregar Grado</span>
            </div>
          </div>
        </div>

        <!-- ============ GRUPOS VIEW ============ -->
        <div v-if="currentView === 'grupos'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <!-- Grupo Cards -->
          <div 
            v-for="grupo in gruposStore.grupos" 
            :key="grupo.id"
            class="grupo-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
          >
            <!-- Card Header -->
            <div class="card-header bg-blue-600 px-4 py-4">
              <h3 class="text-white text-lg font-semibold text-center truncate">
                {{ grupo.nombre }}
              </h3>
            </div>
            
            <!-- Card Body -->
            <div class="card-body p-4">
              <div class="flex items-center gap-2 text-gray-600">
                <i class="pi pi-users text-blue-500"></i>
                <span class="text-sm">{{ grupo.cantidad_estudiantes || 0 }} estudiante(s)</span>
              </div>
              <div class="flex items-center gap-2 text-gray-600 mt-2">
                <i class="pi pi-user text-purple-500"></i>
                <span class="text-sm font-medium">{{ grupo.director_grupo || 'Sin director asignado' }}</span>
              </div>
            </div>
            
            <!-- Card Footer -->
            <div class="card-footer border-t border-gray-100 px-4 py-3 flex justify-between items-center bg-gray-50">
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-sm p-button-text"
                severity="danger"
                @click="confirmDeleteGrupo(grupo)"
                v-tooltip.top="'Eliminar'"
              />
              <Button
                icon="pi pi-pencil"
                class="p-button-rounded p-button-sm p-button-text"
                severity="info"
                @click="editarGrupo(grupo)"
                v-tooltip.top="'Editar'"
              />
              <Button
                icon="pi pi-arrow-right"
                class="p-button-rounded p-button-sm p-button-text"
                severity="success"
                @click="navigateToEstudiantes(grupo)"
                v-tooltip.top="'Ver estudiantes'"
              />
            </div>
          </div>

          <!-- Add New Grupo Card -->
          <div 
            class="add-card bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center min-h-[180px]"
            @click="agregarNuevoGrupo"
          >
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i class="pi pi-plus text-3xl text-blue-600"></i>
              </div>
              <span class="text-gray-500 font-medium">Agregar Grupo</span>
            </div>
          </div>
        </div>

        <!-- ============ ESTUDIANTES VIEW (DataTable) ============ -->
        <div v-if="currentView === 'estudiantes'">
          <!-- Header with actions -->
          <div class="flex justify-end items-center mb-4 gap-2">
            <Button
              label="Agregar estudiante"
              icon="pi pi-plus"
              severity="success"
              @click="agregarNuevoEstudiante"
            />
            
            <div class="relative">
              <Button
                label="Carga masiva"
                icon="pi pi-upload"
                severity="info"
                @click="toggleUploadMenu"
              />

              <!-- Menú desplegable de carga de archivos -->
              <div
                v-if="isUploadMenuOpen"
                class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
              >
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-sm font-semibold text-gray-700">Subir listado (.xlsx)</h3>
                    <Button 
                        icon="pi pi-times" 
                        class="p-button-rounded p-button-text p-button-sm text-gray-500" 
                        @click="toggleUploadMenu"
                    />
                </div>
                
                <div class="card flex flex-col gap-3">
                  <FileUpload
                    ref="fileupload"
                    mode="basic"
                    name="file"
                    accept=".xlsx"
                    :maxFileSize="1048576"
                    :multiple="false"
                    :auto="false"
                    @select="onFileSelect"
                    chooseLabel="Seleccionar archivo"
                    class="w-full"
                  />
                  
                  <span v-if="selectedFile" class="text-xs text-green-600 block truncate">
                    📄 {{ selectedFile.name }}
                  </span>
                  
                  <Button 
                    label="Procesar estudiantes" 
                    @click="uploadEstudiantes" 
                    severity="primary" 
                    class="w-full"
                    :loading="isUploading"
                    :disabled="!selectedFile || isUploading"
                    icon="pi pi-check"
                  />
                  
                  <div class="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded">
                    <p class="font-semibold mb-1">Formato requerido:</p>
                    <ul class="list-disc pl-4 space-y-0.5">
                        <li>numero_documento</li>
                        <li>nombres</li>
                        <li>apellidos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- DataTable -->
          <div class="bg-white rounded-xl shadow-md overflow-hidden">
            <DataTable 
              :value="estudiantesStore.estudiantes" 
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
                  <Button 
                    label="Agregar primer estudiante" 
                    icon="pi pi-plus" 
                    severity="success" 
                    class="mt-4"
                    @click="agregarNuevoEstudiante"
                  />
                </div>
              </template>
              
              <Column field="numero_documento" header="N° Documento" sortable style="width: 20%"></Column>
              <Column field="nombres" header="Nombres" sortable style="width: 30%"></Column>
              <Column field="apellidos" header="Apellidos" sortable style="width: 30%"></Column>
              <Column header="Opciones" style="width: 20%">
                <template #body="slotProps">
                  <div class="flex gap-2">
                    <Button
                      icon="pi pi-pencil"
                      class="p-button-rounded p-button-sm"
                      severity="info"
                      @click="editarEstudiante(slotProps.data)"
                      v-tooltip.top="'Editar'"
                    />
                    <Button
                      icon="pi pi-trash"
                      class="p-button-rounded p-button-sm"
                      severity="danger"
                      @click="confirmDeleteEstudiante(slotProps.data)"
                      v-tooltip.top="'Eliminar'"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>

        <!-- Empty State for cards -->
        <div 
          v-if="(currentView === 'grados' && gradosStore.grados.length === 0) || 
                (currentView === 'grupos' && gruposStore.grupos.length === 0)"
          class="text-center py-12"
        >
          <div class="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="pi pi-inbox text-4xl text-gray-400"></i>
          </div>
          <h3 class="text-lg font-medium text-gray-600 mb-2">
            {{ currentView === 'grados' ? 'No hay grados registrados' : 'No hay grupos registrados' }}
          </h3>
          <p class="text-gray-400 mb-4">
            {{ currentView === 'grados' ? 'Agrega el primer grado para esta sede' : 'Agrega el primer grupo para este grado' }}
          </p>
        </div>
      </div>
    </main>
  </div>

  <!-- Modals -->
  <ModalSedes />
  <ModalGrados />
  <ModalGrupos />
  <ModalEstudiantes />
</template>

<style scoped>
.sede-card,
.grado-card,
.grupo-card {
  min-height: 240px;
  display: flex;
  flex-direction: column;
}

.card-body {
  flex: 1;
}

.add-card:hover .pi-plus {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}
</style>