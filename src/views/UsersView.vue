<script setup>
/**
 * ============================================
 * VISTA DE GESTIÓN DE DOCENTES (ANTES USUARIOS)
 * ============================================
 */

import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import {ref, onMounted, computed, watch} from 'vue';
import {useUserStore} from "@/stores/user.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import ModalUsers from "@/components/ModalUsers.vue";
import ModalAssignAsignaturas from "@/components/ModalAssignAsignaturas.vue";
import ModalAssignGrupos from "@/components/ModalAssignGrupos.vue";
import {useModalUserStore} from "@/stores/modalUsers.js";
import {useModalAssignAsignaturasStore} from "@/stores/modalAssignAsignaturas.js";
import {useModalAssignGruposStore} from "@/stores/modalAssignGrupos.js";
import SelectSedes from "@/components/SelectSedes.vue";
import {useSedesStore} from "@/stores/sedes.js";
import {confirmAlert} from "@/lib/confirm.js";
import FileUpload from 'primevue/fileupload';
import * as XLSX from 'xlsx';
import {userService} from "@/services/userService.js";

const currentPage = ref(0);
const rowsPerPage = ref(10);
const userStore = useUserStore();
const toast = useToast();
const confirm = useConfirm();
const storeModalUser = useModalUserStore();
const storeModalAssign = useModalAssignAsignaturasStore();
const storeModalAssignGrupos = useModalAssignGruposStore();
const stateSedes = useSedesStore();
const isUploadMenuOpen = ref(false);

const openAssignModal = (user) => {
    storeModalAssign.openModal(user);
};

const openAssignGruposModal = (user) => {
    storeModalAssignGrupos.openModal(user);
};

const selectedFile = ref(null);
const isUploading = ref(false);

const filteredUsers = computed(() => {
    // Si el modal está abierto, mostramos todos (o mantenemos estado previo, pero mostramos todos impide que se vacíe si selecciono sede nueva)
    // El problema real es que selectedSede cambia globalmente.
    // Si el modal está abierto, ignoramos selectedSede para el filtrado de la tabla
    if (storeModalUser.visibleModalUser) {
        return userStore.docentes || [];
    }

    let users = userStore.docentes || [];
    if (stateSedes.selectedSede && stateSedes.selectedSede.id) {
        return users.filter(user => user.sede_id === stateSedes.selectedSede.id);
    }
    return users;
});

onMounted(async () => {
  await Promise.all([
    userStore.getDocentes(),
    stateSedes.getSedes()
  ]);
});

// Refrescar lista al cerrar modal
watch(() => storeModalUser.visibleModalUser, async (newVal) => {
    if (!newVal) {
        await userStore.getDocentes();
    }
});

const toggleActivo = async (usuario) => {
  try{
    await userStore.updateUserEstado({id: usuario.id, activo: !usuario.activo});
    // Actualizar localmente la lista
    const k = userStore.docentes.findIndex(u => u.id === usuario.id);
    if(k > -1) userStore.docentes[k].activo = !usuario.activo;
  }catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const crearUsuario = () => {
  stateSedes.clearSelectedSedes();
  storeModalUser.setDocenteMode(true);
  userStore.resetUser();
  storeModalUser.toggleModalUser();
};

const toggleUploadMenu = () => {
  isUploadMenuOpen.value = !isUploadMenuOpen.value;
  if (!isUploadMenuOpen.value) {
    selectedFile.value = null;
  }
};

const eliminarUsuario = async (data) => {
    try {
      await userStore.deleteUser(data.id);
      const k = userStore.docentes.findIndex(u => u.id === data.id);
      if(k > -1) userStore.docentes.splice(k, 1);
    }catch (error) {
      console.log(error);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}

const confirmarDeleteUsuario = (data) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar al docente "${data.nombre_completo}"?`,
    () => eliminarUsuario(data),
    {
      header: 'Eliminar Docente',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
}

const editarUsuario = (data) => {
  storeModalUser.setDocenteMode(true);
  userStore.user.id = data.id;
  userStore.user.cedula = data.cedula;
  userStore.user.nombre_completo = data.nombre_completo;
  userStore.user.email = data.email;
  userStore.user.telefono  = data.telefono;
  userStore.user.rol = data.rol;
  userStore.user.sede_id  = data.sede_id;
  userStore.user.sede_nombre = data.sede_nombre;
  userStore.user.activo = data.activo;
  userStore.user.password = null;
  stateSedes.selectedSede.id = data.sede_id;
  stateSedes.selectedSede.nombre = data.sede_nombre;
  storeModalUser.toggleModalUser();
}

// === CARGA MASIVA ===
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

const processUsers = async (usersData) => {
  const result = { success: 0, errors: [] };
  for (let i = 0; i < usersData.length; i++) {
    const row = usersData[i];
    const rowNumber = i + 2;
    try {
      const email = row.email || row.Email || row.EMAIL;
      const nombre_completo = row.nombre_completo || row.nombre || row.Nombre || row.NOMBRE;
      const cedulaRaw = row.cedula || row.Cedula || row.CEDULA;
      const rol = row.rol || row.Rol || row.ROL || 'docente'; // Default a docente
      const telefonoRaw = row.telefono || row.Telefono || row.TELEFONO;
      const sedeIdRaw = row.sede_id || row.Sede_Id || row.SEDE_ID;
      const passwordRaw = row.password || row.Password || row.PASSWORD;
      const activoRaw = row.activo ?? row.Activo ?? row.ACTIVO;
      
      const userData = {
        email: email ? String(email).trim() : undefined,
        nombre_completo: nombre_completo ? String(nombre_completo).trim() : undefined,
        cedula: cedulaRaw ? String(cedulaRaw).trim() : undefined,
        rol: rol ? String(rol).trim() : undefined,
        telefono: telefonoRaw ? String(telefonoRaw).trim() : '',
        sede_id: sedeIdRaw ? parseInt(sedeIdRaw, 10) : undefined,
        activo: activoRaw !== undefined ? Boolean(activoRaw) : true,
        password: passwordRaw ? String(passwordRaw) : undefined
      };
      
      const camposFaltantes = [];
      if (!userData.email) camposFaltantes.push('email');
      if (!userData.nombre_completo) camposFaltantes.push('nombre_completo');
      if (!userData.cedula) camposFaltantes.push('cedula');
      if (!userData.rol) camposFaltantes.push('rol');
      if (!userData.password) camposFaltantes.push('password');
      
      if (camposFaltantes.length > 0) {
        throw new Error(`Fila ${rowNumber}: Campos faltantes: ${camposFaltantes.join(', ')}`);
      }
      
      const { data } = await userService.createUser({...userData});

      // Agregar al store si es docente
      if ((data.rol || '').toLowerCase() === 'docente') {
           // Buscar el nombre de la sede en el store
           const sedeEncontrada = stateSedes.sedes.find(s => s.id === data.sede_id);
           data.sede_nombre = sedeEncontrada ? sedeEncontrada.nombre : null;
           userStore.docentes.push(data);
      }
      
      result.success++;
    } catch (error) {
      // ... manejo simplificado ...
      let errorMessage = 'Error desconocido';
      if (error.response?.data) errorMessage = JSON.stringify(error.response.data);
      else if (error.message) errorMessage = error.message;
      
      result.errors.push({ fila: rowNumber, error: errorMessage });
    }
  }
  return result;
};

const upload = async () => {
  if (!selectedFile.value) {
    toast.add({ severity: 'warn', summary: 'Archivo requerido', detail: 'Seleccione archivo', life: 3000 });
    return;
  }
  isUploading.value = true;
  try {
    const data = await readXLSXFile(selectedFile.value);
    if (data.length === 0) {
       toast.add({ severity: 'warn', summary: 'Vacío', detail: 'Sin datos', life: 3000 });
       return;
    }
    const result = await processUsers(data);
    if (result.success > 0) toast.add({ severity: 'success', summary: 'Docentes creados', detail: `${result.success} docentes.`, life: 5000 });
    if (result.errors.length > 0) toast.add({ severity: 'warn', summary: 'Errores partiales', detail: `${result.errors.length} fallos.`, life: 5000 });
    isUploadMenuOpen.value = false;
    selectedFile.value = null;
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error procesando archivo', life: 3000 });
  } finally {
    isUploading.value = false;
  }
};

</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />
    <main class="flex-1 overflow-y-auto">
      <Header />
      <div class="p-8" id="panel-users">
        
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Gestión de Docentes</h1>
          <div class="flex gap-3">
            <Button
              label="Crear docente"
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
              <!-- Menú carga masiva -->
              <div v-if="isUploadMenuOpen" class="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                <h3 class="text-sm font-semibold text-gray-700 mb-3">Subir docentes (XLSX)</h3>
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
                  />
                  <span v-if="selectedFile" class="text-xs text-green-600">📄 {{ selectedFile.name }}</span>
                  <Button 
                    label="Procesar" 
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

        <!-- Filtros -->
        <div class="flex items-center gap-4 mb-6">
          <label for="filter-sedes" class="text-sm font-semibold text-gray-700">Filtrar por sede:</label>
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
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} docentes"
        >
          <Column field="nombre_completo" header="Nombre Completo" :sortable="true"></Column>
          <!-- Rol eliminado -->
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
          <Column header="Dirección de grado">
            <template #body="slotProps">
              <div v-if="slotProps.data.grupos && slotProps.data.grupos.length > 0" class="flex flex-wrap gap-1">
                <span 
                  v-for="grupo in slotProps.data.grupos" 
                  :key="grupo.id"
                  class="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs border border-purple-200 font-semibold"
                >
                  {{ grupo.grado_nombre }} - {{ grupo.nombre }}
                </span>
              </div>
              <span v-else class="text-gray-400 italic text-sm">Sin grupos...</span>
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
              <div class="flex items-center">
                <!-- Grupo Asignación -->
                <div class="flex gap-2">
                  <Button
                      icon="pi pi-users"
                      class="p-button-rounded p-button-sm"
                      severity="help"
                      v-tooltip.top="'Asignar grupos'"
                      @click="openAssignGruposModal(slotProps.data)"
                  />
                  <Button
                      icon="pi pi-list"
                      class="p-button-rounded p-button-sm p-button-outlined"
                      style="color: #1d4ed8; border-color: #1d4ed8; background-color: #eff6ff;"
                      v-tooltip.top="'Agregar asignaturas'"
                      @click="openAssignModal(slotProps.data)"
                  />
                </div>

                <!-- Separador -->
                <div class="w-px h-6 bg-gray-300 mx-3"></div>

                <!-- Grupo Edición -->
                <div class="flex gap-2">
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
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </main>
  </div>

  <ModalUsers/>
  <ModalAssignAsignaturas/>
  <ModalAssignGrupos/>
</template>

<style scoped>
</style>