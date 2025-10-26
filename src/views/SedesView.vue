<script setup>
import { ref } from 'vue';
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import {useSedesStore} from "@/stores/sedes.js";

const store = useSedesStore();




const toggleActivo = (sede) => {
  store.updateEstado({id: sede.id, active: !sede.active});
  //sede.active = !sede.active;
  //console.log(sede);
};

const editarSede = (sede) => {
  console.log('Editar sede:', sede);
  // Aquí puedes agregar la lógica para editar
};

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
</template>