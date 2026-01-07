<script setup>
/**
 * ============================================
 * VISTA DE GESTIÓN DE USUARIOS
 * ============================================
 * Esta vista permite:
 * - Ver todos los usuarios en una tabla paginada
 * - Crear, editar y eliminar usuarios individuales
 * - NUEVO: Crear usuarios de forma masiva desde un archivo XLSX
 */

// ============================================
// IMPORTS
// ============================================
import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import {ref, onMounted, computed} from 'vue';
import {useUserStore} from "@/stores/user.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import ModalUsers from "@/components/ModalUsers.vue";
import ModalAssignAsignaturas from "@/components/ModalAssignAsignaturas.vue";
import {useModalUserStore} from "@/stores/modalUsers.js";
import {useModalAssignAsignaturasStore} from "@/stores/modalAssignAsignaturas.js";
import SelectSedes from "@/components/SelectSedes.vue";
import {useSedesStore} from "@/stores/sedes.js";
import {confirmAlert} from "@/lib/confirm.js";
import FileUpload from 'primevue/fileupload';

// Librería para leer archivos Excel (.xlsx)
// Documentación: https://docs.sheetjs.com/
import * as XLSX from 'xlsx';

// Importamos el servicio directamente para la carga masiva
// (no usamos el store para evitar modificar el objeto user reactivo en cada iteración)
import {userService} from "@/services/userService.js";

// ============================================
// ESTADO REACTIVO
// ============================================
const currentPage = ref(0);
const rowsPerPage = ref(10);
const userStore = useUserStore();
const toast = useToast();
const confirm = useConfirm();
const storeModalUser = useModalUserStore();
const storeModalAssign = useModalAssignAsignaturasStore();
const stateSedes = useSedesStore();
const isUploadMenuOpen = ref(false);

const openAssignModal = (user) => {
    storeModalAssign.openModal(user);
};

// NUEVO: Estado para carga masiva
const selectedFile = ref(null);      // Archivo XLSX seleccionado
const isUploading = ref(false);      // Indicador de carga en progreso

// ============================================
// COMPUTED PROPERTIES
// ============================================
/**
 * Filtra los usuarios según la sede seleccionada
 * Si no hay sede seleccionada, muestra todos los usuarios
 */
const filteredUsers = computed(() => {
    if (storeModalUser.visibleModalUser){
      return userStore.users;
    }else{
      if (!stateSedes.selectedSede.id) {
        return userStore.users;
      }
        return userStore.users.filter(user => user.sede_id === stateSedes.selectedSede.id);
    } 
});

// ============================================
// LIFECYCLE HOOKS
// ============================================
onMounted(async () => {
  await userStore.getUsers();
});

// ============================================
// FUNCIONES EXISTENTES
// ============================================
/**
 * Retorna la clase de color para el badge del rol
 * Verde: Rector, Coordinador
 * Azul: Docente
 */
const getRolBadgeClass = (rol) => {
  if (!rol) return 'bg-gray-500';
  
  const rolNormalized = rol.toLowerCase();
  
  if (rolNormalized === 'rector' || rolNormalized === 'coordinador') {
    return 'bg-green-600';
  } else if (rolNormalized === 'docente') {
    return 'bg-blue-600';
  }
  
  return 'bg-gray-500';
};

const toggleActivo = async (usuario) => {
  try{
    await userStore.updateUserEstado({id: usuario.id, activo: !usuario.activo});
  }catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const crearUsuario = () => {
  stateSedes.clearSelectedSedes();
  userStore.resetUser();
  storeModalUser.toggleModalUser();
};

/**
 * Alterna la visibilidad del menú de carga masiva
 * Al cerrar el menú, limpia el archivo seleccionado
 */
const toggleUploadMenu = () => {
  isUploadMenuOpen.value = !isUploadMenuOpen.value;
  // Limpiar archivo seleccionado al cerrar el menú
  if (!isUploadMenuOpen.value) {
    selectedFile.value = null;
  }
};

const eliminarUsuario = async (data) => {
    try {
      await userStore.deleteUser(data.id);
    }catch (error) {
      console.log(error);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}

const confirmarDeleteUsuario = (data) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar al usuario "${data.nombre_completo}"?`,
    () => eliminarUsuario(data),
    {
      header: 'Eliminar Usuario',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
}

const editarUsuario = (data) => {
  userStore.user.id = data.id;
  userStore.user.cedula = data.cedula;
  userStore.user.nombre_completo = data.nombre_completo;
  userStore.user.email = data.email;
  userStore.user.telefono  = data.telefono;
  userStore.user.rol = data.rol;
  userStore.user.sede_id  = data.sede_id;
  userStore.user.sede_nombre = data.sede_nombre;
  userStore.user.activo = data.activo;
  userStore.user.password = null; // Limpiamos password al editar
  stateSedes.selectedSede.id = data.sede_id;
  stateSedes.selectedSede.nombre = data.sede_nombre;
  storeModalUser.toggleModalUser();
}

// ============================================
// FUNCIONES PARA CARGA MASIVA DE USUARIOS
// ============================================

/**
 * Maneja el evento de selección de archivo del componente FileUpload
 * @param {Object} event - Evento del componente FileUpload con los archivos seleccionados
 */
const onFileSelect = (event) => {
  // Guardamos el primer archivo seleccionado (solo permitimos uno)
  selectedFile.value = event.files[0];
};

/**
 * Lee un archivo XLSX y lo convierte a un array de objetos JavaScript
 * Cada objeto representa una fila del Excel, con las claves siendo los headers
 * 
 * @param {File} file - Archivo XLSX a leer
 * @returns {Promise<Array>} - Array de objetos con los datos del Excel
 */
const readXLSXFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        // Convertir el archivo a un array de bytes
        const data = new Uint8Array(e.target.result);
        
        // Leer el workbook (libro de Excel)
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Obtener la primera hoja del libro
        const firstSheetName = workbook.SheetNames[0];
        const firstSheet = workbook.Sheets[firstSheetName];
        
        // Convertir la hoja a JSON
        // NOTA: Asume que la primera fila contiene los nombres de las columnas (headers)
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = reject;
    
    // Leer el archivo como ArrayBuffer
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Procesa un array de datos de usuarios y los crea en la base de datos
 * - Procesa cada usuario individualmente
 * - Si un usuario falla, lo registra pero continúa con los demás
 * - Actualiza el state automáticamente con los usuarios creados exitosamente
 * 
 * @param {Array} usersData - Array de objetos con datos de usuarios del Excel
 * @returns {Object} - Resultado con conteo de éxitos y array de errores
 */
const processUsers = async (usersData) => {
  const result = { 
    success: 0,    // Contador de usuarios creados exitosamente
    errors: []     // Array con detalles de los errores
  };
  
  // Procesar cada fila del Excel (usamos índice para saber el número de fila)
  for (let i = 0; i < usersData.length; i++) {
    const row = usersData[i];
    const rowNumber = i + 2; // +2 porque la fila 1 son headers y el índice empieza en 0
    
    try {
      // Extraer valores con soporte para múltiples formatos de nombres de columnas
      const email = row.email || row.Email || row.EMAIL;
      const nombre_completo = row.nombre_completo || row.nombre || row.Nombre || row.NOMBRE;
      const cedulaRaw = row.cedula || row.Cedula || row.CEDULA;
      const rol = row.rol || row.Rol || row.ROL;
      const telefonoRaw = row.telefono || row.Telefono || row.TELEFONO;
      const sedeIdRaw = row.sede_id || row.Sede_Id || row.SEDE_ID;
      const passwordRaw = row.password || row.Password || row.PASSWORD;
      const activoRaw = row.activo ?? row.Activo ?? row.ACTIVO;
      
      // Construir objeto de usuario con tipos correctos
      // IMPORTANTE: sede_id debe ser número entero para el backend
      const userData = {
        email: email ? String(email).trim() : undefined,
        nombre_completo: nombre_completo ? String(nombre_completo).trim() : undefined,
        cedula: cedulaRaw ? String(cedulaRaw).trim() : undefined,
        rol: rol ? String(rol).trim() : undefined,
        telefono: telefonoRaw ? String(telefonoRaw).trim() : '',
        sede_id: sedeIdRaw ? parseInt(sedeIdRaw, 10) : undefined, // Convertir a número entero
        activo: activoRaw !== undefined ? Boolean(activoRaw) : true,
        password: passwordRaw ? String(passwordRaw) : undefined
      };
      
      // Validar que los campos requeridos estén presentes
      const camposFaltantes = [];
      if (!userData.email) camposFaltantes.push('email');
      if (!userData.nombre_completo) camposFaltantes.push('nombre_completo');
      if (!userData.cedula) camposFaltantes.push('cedula');
      if (!userData.rol) camposFaltantes.push('rol');
      if (!userData.sede_id || isNaN(userData.sede_id)) camposFaltantes.push('sede_id');
      if (!userData.password) camposFaltantes.push('password');
      
      if (camposFaltantes.length > 0) {
        throw new Error(`Fila ${rowNumber}: Campos faltantes o inválidos: ${camposFaltantes.join(', ')}`);
      }
      
      // Log para debugging (puedes comentar esto en producción)
      console.log(`📤 Fila ${rowNumber}: Enviando usuario:`, userData);
      
      // Llamar al servicio para crear el usuario en la base de datos
      const { data } = await userService.createUser({...userData});
      
      console.log(`✅ Fila ${rowNumber}: Usuario creado exitosamente`);
      
      // Agregar el usuario creado al state local
      // Esto actualiza automáticamente la tabla sin necesidad de recargar
      // NOTA: stateSedes.sedes ya está "desenvuelto" por Pinia, no necesita .value
      const sedeIndex = stateSedes.sedes.findIndex(item => item.id === data.sede_id);
      if (sedeIndex > -1) {
        data.sede_nombre = stateSedes.sedes[sedeIndex].nombre;
      }
      
      // Agregar al state para que la tabla se actualice automáticamente
      userStore.users.push(data);
      
      result.success++;
      
    } catch (error) {
      // Extraer mensaje de error detallado del backend si existe
      let errorMessage = 'Error desconocido';
      
      if (error.response?.data) {
        // El backend puede enviar el error en diferentes formatos
        const backendError = error.response.data;
        if (typeof backendError === 'string') {
          errorMessage = backendError;
        } else if (backendError.detail) {
          // FastAPI/Pydantic suele usar 'detail' para errores de validación
          errorMessage = typeof backendError.detail === 'string' 
            ? backendError.detail 
            : JSON.stringify(backendError.detail);
        } else if (backendError.message) {
          errorMessage = backendError.message;
        } else {
          errorMessage = JSON.stringify(backendError);
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error(`❌ Fila ${rowNumber}: Error -`, errorMessage);
      
      // Registrar el error pero continuar con los demás usuarios
      result.errors.push({
        fila: rowNumber,
        email: row.email || row.Email || row.EMAIL || 'N/A',
        error: errorMessage
      });
    }
  }
  
  return result;
};

/**
 * Función principal para procesar la carga masiva de usuarios
 * 1. Valida que haya un archivo seleccionado
 * 2. Lee el archivo XLSX
 * 3. Procesa cada usuario
 * 4. Muestra notificaciones con los resultados
 */
const upload = async () => {
  // Validar que hay un archivo seleccionado
  if (!selectedFile.value) {
    toast.add({ 
      severity: 'warn', 
      summary: 'Archivo requerido', 
      detail: 'Por favor seleccione un archivo XLSX', 
      life: 3000 
    });
    return;
  }

  // Activar indicador de carga
  isUploading.value = true;
  
  try {
    // Paso 1: Leer el archivo XLSX y convertirlo a array de objetos
    const data = await readXLSXFile(selectedFile.value);
    
    // Validar que el archivo tenga datos
    if (data.length === 0) {
      toast.add({ 
        severity: 'warn', 
        summary: 'Archivo vacío', 
        detail: 'El archivo no contiene datos para procesar', 
        life: 3000 
      });
      return;
    }

    // Paso 2: Procesar cada usuario del archivo
    const result = await processUsers(data);
    
    // Paso 3: Mostrar notificaciones con los resultados
    if (result.success > 0) {
      toast.add({ 
        severity: 'success', 
        summary: 'Usuarios creados', 
        detail: `Se crearon ${result.success} usuario(s) exitosamente`, 
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
      // Mostrar errores detallados en consola para debugging
      console.log('❌ Errores en carga masiva:', result.errors);
    }

    // Cerrar menú y limpiar estado
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
    // Desactivar indicador de carga
    isUploading.value = false;
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
      <div class="p-8" id="panel-users">
        <!-- Header Section -->
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Gestión de usuarios</h1>
          <div class="flex gap-3">
            <Button
              label="Crear usuario"
              icon="pi pi-user-plus"
              severity="success"
              @click="crearUsuario"
            />
            <div class="relative">
              <Button
                label="Creación masiva"
                icon="pi pi-upload"
                severity="info"
                @click="toggleUploadMenu"
              />

              <!-- Menú desplegable de carga de archivos -->
              <div
                v-if="isUploadMenuOpen"
                class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
              >
                <h3 class="text-sm font-semibold text-gray-700 mb-3">Subir archivo de usuarios</h3>
                <div class="card flex flex-col gap-3">
                  <!-- 
                    FileUpload configurado para selección manual:
                    - mode="basic": Muestra solo el botón de selección
                    - :auto="false": No sube automáticamente, solo selecciona
                    - @select: Captura el evento cuando se selecciona un archivo
                  -->
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
                  />
                  <!-- Mostrar nombre del archivo seleccionado -->
                  <span v-if="selectedFile" class="text-xs text-green-600">
                    📄 {{ selectedFile.name }}
                  </span>
                  <!-- 
                    Botón para iniciar la carga:
                    - :loading: Muestra spinner mientras procesa
                    - :disabled: Se deshabilita si no hay archivo seleccionado
                  -->
                  <Button 
                    label="Procesar usuarios" 
                    @click="upload" 
                    severity="info" 
                    class="w-full"
                    :loading="isUploading"
                    :disabled="!selectedFile || isUploading"
                    icon="pi pi-upload"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-4 mb-6">
          <label for="filter-sedes" class="text-sm font-semibold text-gray-700">
            Filtrar por sede:
          </label>
        <SelectSedes/>
        </div>


        <!-- DataTable -->
        <DataTable
          :value="filteredUsers"
          :paginator="true"
          :rows="rowsPerPage"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          v-model:first="currentPage"
          sortMode="multiple"
          tableStyle="min-width: 50rem"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
        >
          <Column field="nombre_completo" header="Nombre Completo" :sortable="true"></Column>
          <Column field="rol" header="Rol" :sortable="true">
            <template #body="slotProps">
              <span 
                :class="getRolBadgeClass(slotProps.data.rol)" 
                class="px-3 py-1 rounded-full text-white text-xs font-semibold uppercase tracking-wide"
              >
                {{ slotProps.data.rol }}
              </span>
            </template>
          </Column>
          <Column field="sede_nombre" header="Sede" :sortable="true">
            <template #body="slotProps">
              <span :class="{'text-gray-400 italic': !slotProps.data.sede_nombre}">
                {{ slotProps.data.sede_nombre || 'Sin sede...' }}
              </span>
            </template>
          </Column>
          <Column header="Asignaturas">
            <template #body="slotProps">
              <div v-if="slotProps.data.asignaturas && slotProps.data.asignaturas.length > 0" class="flex flex-wrap gap-1">
                <span 
                  v-for="asig in slotProps.data.asignaturas" 
                  :key="asig.id"
                  class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-200"
                >
                  {{ asig.nombre }}
                </span>
              </div>
              <span v-else class="text-gray-400 italic text-sm">Sin asignaturas asignadas...</span>
            </template>
          </Column>
          <Column field="activo" header="Estado">
            <template #body="slotProps">
              <span
                @click="toggleActivo(slotProps.data)"
                :class="slotProps.data.activo ? 'bg-green-500' : 'bg-red-500'"
                class="px-3 py-1 rounded-full text-white text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity"
              >
                {{ slotProps.data.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </template>
          </Column>
          <Column header="Opciones">
            <template #body="slotProps">
              <div class="flex gap-2">
                <Button
                    v-if="slotProps.data.rol === 'docente'"
                    icon="pi pi-list"
                    class="p-button-rounded p-button-sm"
                    severity="success"
                    v-tooltip.top="'Agregar asignaturas'"
                    @click="openAssignModal(slotProps.data)"
                />
                <Button
                    icon="pi pi-pencil"
                    class="p-button-rounded p-button-sm"
                    severity="info"
                    @click="editarUsuario(slotProps.data)"
                />
                <Button
                    icon="pi pi-trash"
                    class="p-button-rounded p-button-sm"
                    severity="danger"
                    @click="confirmarDeleteUsuario(slotProps.data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </main>
  </div>


  <ModalUsers/>
  <ModalAssignAsignaturas/>
</template>

<style scoped>

</style>