<script setup>
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import {useSedesStore} from "@/stores/sedes.js";
import {useModalSedeStore} from "@/stores/modalSedes.js";
import ModalSedes from "@/components/ModalSedes.vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";


const store = useSedesStore();
const storeModalSedes = useModalSedeStore();
const toast = useToast();
const confirm = useConfirm();




const toggleActivo = async (sede) => {
  try{
    await store.updateEstado({id: sede.id, active: !sede.active});
  }catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const editarSede = (sede) => {
  store.sede.nombre = sede.nombre;
  store.sede.codigo = sede.codigo;
  store.sede.direccion = sede.direccion;
  store.sede.id = sede.id;
  store.sede.active = sede.active;
  storeModalSedes.toggleModalSede();
}

const eliminarSede = async (sede) => {
  try{
    await store.deleteSede(sede.id);
  }catch (error) {
    console.log(error);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
};

const confirmDeleteSede = (sede) => {
  confirm.require({
    message: '¿Estás seguro que deseas eliminar esta sede?',
    header: 'Alerta',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cerrar',
      severity: 'secondary',
      outlined: true
    },
    acceptProps: {
      label: 'Confirmar'
    },
    accept: () => {
      eliminarSede(sede);
    }
  });
};

const agregarNuevaSede = () => {
  // Limpiar los datos del formulario para modo "crear"
  store.sede.nombre = '';
  store.sede.codigo = '';
  store.sede.direccion = '';
  store.sede.id = null;
  store.sede.active = true;
  storeModalSedes.toggleModalSede();
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
      <div class="p-8" id="sedes-table">
        <!-- Header Section -->
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-800">Gestión de sedes</h1>
          <Button
            label="Agregar sede"
            icon="pi pi-plus"
            severity="success"
            @click="agregarNuevaSede"
          />
        </div>

        <DataTable :value="store.sedes" :paginator="false" tableStyle="min-width: 50rem">
          <Column field="nombre" header="Sede"></Column>
          <Column field="codigo" header="Código"></Column>
          <Column field="direccion" header="Dirección"></Column>
          <Column field="active" header="Activo">
            <template #body="slotProps">
              <span
                @click="toggleActivo(slotProps.data)"
                :class="slotProps.data.active ? 'bg-green-500' : 'bg-red-500'"
                class="px-3 py-1 rounded-full text-white text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity"
              >
                {{ slotProps.data.active ? 'Activo' : 'Inactivo' }}
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
                  @click="editarSede(slotProps.data)"
                />
                <Button
                  icon="pi pi-trash"
                  class="p-button-rounded p-button-sm"
                  severity="danger"
                  @click="confirmDeleteSede(slotProps.data)"
                />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </main>
  </div>

  <ModalSedes />
</template>