<script setup>
import Select from "primevue/select";
import {useSedesStore} from "@/stores/sedes.js";
import {useModalUserStore} from "@/stores/modalUsers.js";
import {useUserStore} from "@/stores/user.js";
import {computed} from 'vue';

const stateSedes = useSedesStore();
const storeModalUser = useModalUserStore();
const userStore = useUserStore();

const sedesConTodas = computed(() => {
  if (storeModalUser.visibleModalUser){
    return stateSedes.sedes;
  }else{
    return [{id: null, nombre: 'Todas las sedes'}, ...stateSedes.sedes];
  }
});

const changeOptionSede = (event) => {
  const sedeSeleccionada = stateSedes.sedes.find(sede => sede.id === event.value);
  if (sedeSeleccionada) {
    stateSedes.selectedSede.id = sedeSeleccionada.id;
    stateSedes.selectedSede.nombre = sedeSeleccionada.nombre;
    if (storeModalUser.visibleModalUser) {
      userStore.user.sede_id = stateSedes.selectedSede.id;
      userStore.user.sede_nombre = stateSedes.selectedSede.nombre;
    }
  } else {
    stateSedes.selectedSede.id = null;
    stateSedes.selectedSede.nombre = null;
  }
}
</script>

<template>
    <Select
        v-model="stateSedes.selectedSede.id"
        :options="sedesConTodas"
        optionLabel="nombre"
        optionValue="id"
        placeholder="Seleccione una sede"
        class="w-64"
        @change="changeOptionSede"
    />
</template>

<style scoped>

</style>