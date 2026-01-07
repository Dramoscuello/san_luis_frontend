<script setup>
import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Button from "primevue/button";
import InputText from "primevue/inputtext";
import { onMounted, ref, watch } from "vue";
import { useUserStore } from "@/stores/user.js";
import { useModalUserStore } from "@/stores/modalUsers.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import ModalUsers from "@/components/ModalUsers.vue";
import { confirmAlert } from "@/lib/confirm.js";

const userStore = useUserStore();
const toast = useToast();
const confirm = useConfirm();
const storeModalUser = useModalUserStore();

const filters = ref({
  global: { value: null, matchMode: 'contains' }
});

const getRolBadgeClass = (rol) => {
  if (!rol) return 'bg-gray-500';
  const r = rol.toLowerCase();
  if (r === 'rector') return 'bg-green-600';     
  if (r === 'coordinador') return 'bg-blue-600'; 
  return 'bg-gray-500';
};

onMounted(async () => {
  await userStore.getDirectivos();
});

const nuevoDirectivo = () => {
  storeModalUser.setDirectivoMode(true);
  userStore.resetUser();
  storeModalUser.toggleModalUser();
};

const editarUsuario = (data) => {
  storeModalUser.setDirectivoMode(true);
  userStore.user.id = data.id;
  userStore.user.cedula = data.cedula;
  userStore.user.nombre_completo = data.nombre_completo;
  userStore.user.email = data.email;
  userStore.user.telefono  = data.telefono;
  userStore.user.rol = data.rol;
  userStore.user.sede_id  = data.sede_id; // Si aplica
  userStore.user.activo = data.activo;
  userStore.user.password = null;
  storeModalUser.toggleModalUser();
}

const toggleActivo = async (usuario) => {
  try {
    await userStore.updateUserEstado({ id: usuario.id, activo: !usuario.activo });
    // Actualizar localmente
    const index = userStore.directivos.findIndex(d => d.id === usuario.id);
    if (index !== -1) userStore.directivos[index].activo = !usuario.activo;
    
    toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Estado actualizado', life: 3000 });
  } catch (error) {
    console.error(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Error al cambiar estado', life: 3000 });
  }
};

const eliminarUsuario = async (data) => {
    try {
      await userStore.deleteUser(data.id);
      userStore.directivos = userStore.directivos.filter(d => d.id !== data.id);
      toast.add({ severity: 'success', summary: 'Éxito', detail: 'Usuario eliminado', life: 3000 });
    }catch (error) {
      console.log(error);
      toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}

const confirmarDeleteUsuario = (data) => {
  confirmAlert(
    confirm,
    `¿Estás seguro que deseas eliminar al directivo "${data.nombre_completo}"?`,
    () => eliminarUsuario(data),
    {
      header: 'Eliminar Directivo',
      acceptProps: {
        label: 'Eliminar',
        severity: 'danger'
      }
    }
  );
}

// Al cerrar el modal, refrescar la lista para ver cambios (creación/edición)
watch(() => storeModalUser.visibleModalUser, async (newVal) => {
    if (!newVal) {
        await userStore.getDirectivos();
    }
});

</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />
    <main class="flex-1 overflow-y-auto">
      <Header />
      <div class="p-8">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Directivos</h1>
          <Button label="Nuevo Directivo" icon="pi pi-plus" class="p-button-primary" @click="nuevoDirectivo" />
        </div>

        <div class="bg-white p-6 rounded-lg shadow-sm">
            
            <DataTable :value="userStore.directivos" :paginator="true" :rows="10" 
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                :rowsPerPageOptions="[5, 10, 20]"
                currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} directivos">
                
                <Column field="nombre_completo" header="Nombre" sortable></Column>
                <Column field="email" header="Email" sortable></Column>
                <Column field="cedula" header="Cédula" sortable></Column>
                <Column field="telefono" header="Teléfono" sortable></Column>
                <Column field="rol" header="Rol" sortable>
                    <template #body="slotProps">
                        <span :class="getRolBadgeClass(slotProps.data.rol)" class="px-3 py-1 rounded-full text-white text-xs font-semibold uppercase">
                            {{ slotProps.data.rol }}
                        </span>
                    </template>
                </Column>
                <Column field="activo" header="Estado" sortable>
                    <template #body="slotProps">
                        <span @click="toggleActivo(slotProps.data)"
                            :class="slotProps.data.activo ? 'bg-green-500' : 'bg-red-500'"
                            class="px-3 py-1 rounded-full text-white text-sm font-semibold cursor-pointer">
                            {{ slotProps.data.activo ? 'Activo' : 'Inactivo' }}
                        </span>
                    </template>
                </Column>
                <Column header="Opciones">
                    <template #body="slotProps">
                        <div class="flex gap-2">
                            <Button icon="pi pi-pencil" class="p-button-rounded p-button-sm p-button-info" @click="editarUsuario(slotProps.data)" />
                            <Button icon="pi pi-trash" class="p-button-rounded p-button-sm p-button-danger" @click="confirmarDeleteUsuario(slotProps.data)" />
                        </div>
                    </template>
                </Column>
            </DataTable>
        </div>
      </div>
    </main>
  </div>
  <ModalUsers />
</template>
