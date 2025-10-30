<script setup>

import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import {ref, onMounted} from 'vue';
import {useUserStore} from "@/stores/user.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import ModalUsers from "@/components/ModalUsers.vue";
import {useModalUserStore} from "@/stores/modalUsers.js";
import SelectSedes from "@/components/SelectSedes.vue";
import {useSedesStore} from "@/stores/sedes.js";
import {confirmAlert} from "@/lib/confirm.js";



const currentPage = ref(0);
const rowsPerPage = ref(10);
const userStore = useUserStore();
const toast = useToast();
const confirm = useConfirm();
const storeModalUser = useModalUserStore();
const stateSedes = useSedesStore();


onMounted(async () => {
  await userStore.getUsers();
});

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

const creacionMasiva = () => {
  console.log('Creación masiva');
  // Implementar lógica
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
            <Button
              label="Creación masiva"
              icon="pi pi-upload"
              severity="info"
              @click="creacionMasiva"
            />
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
          :value="userStore.users"
          :paginator="true"
          :rows="rowsPerPage"
          :rowsPerPageOptions="[5, 10, 20, 50]"
          v-model:first="currentPage"
          sortMode="multiple"
          tableStyle="min-width: 50rem"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} usuarios"
        >
          <Column field="email" header="Email" :sortable="true"></Column>
          <Column field="nombre_completo" header="Nombre Completo" :sortable="true"></Column>
          <Column field="cedula" header="Cédula" :sortable="true"></Column>
          <Column field="rol" header="Rol" :sortable="true"></Column>
          <Column field="sede_nombre" header="Sede" :sortable="true"></Column>
          <Column field="telefono" header="Teléfono" :sortable="true"></Column>
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
</template>

<style scoped>

</style>