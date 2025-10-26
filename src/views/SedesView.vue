<script setup>
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import {useSedesStore} from "@/stores/sedes.js";
import {useModalSedeStore} from "@/stores/modalSedes.js";
import ModalSedes from "@/components/ModalSedes.vue";

const store = useSedesStore();
const storeModalSedes = useModalSedeStore();




const toggleActivo = (sede) => {
  store.updateEstado({id: sede.id, active: !sede.active});
};

const editarSede = (sede) => {
  store.sede.nombre = sede.nombre;
  store.sede.codigo = sede.codigo;
  store.sede.direccion = sede.direccion;
  store.sede.id = sede.id;
  store.sede.active = sede.active;
  storeModalSedes.toggleModalSede();
}

const eliminarSede = (sede) => {
  console.log('Eliminar sede:', sede);
  // Aquí puedes agregar la lógica para eliminar
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
                  v-tooltip.top="'Editar'"
                />
                <Button
                  icon="pi pi-trash"
                  class="p-button-rounded p-button-sm"
                  severity="danger"
                  @click="eliminarSede(slotProps.data)"
                  v-tooltip.top="'Eliminar'"
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