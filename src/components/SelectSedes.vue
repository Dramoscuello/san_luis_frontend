<script setup>
import Select from "primevue/select";
import {useSedesStore} from "@/stores/sedes.js";
import {useModalUserStore} from "@/stores/modalUsers.js";
import {useUserStore} from "@/stores/user.js";

const stateSedes = useSedesStore();
const storeModalUser = useModalUserStore();
const userStore = useUserStore();


const changeOptionSede = (event)=>{
  const sedeSeleccionada = stateSedes.sedes.find(sede => sede.id === event.value);
  if (sedeSeleccionada) {
    stateSedes.selectedSede.id = sedeSeleccionada.id;
    stateSedes.selectedSede.nombre = sedeSeleccionada.nombre;
    console.log('ID:', stateSedes.selectedSede.id);
    console.log('Nombre:', stateSedes.selectedSede.nombre);
  }
  if(storeModalUser.visibleModalUser) {
    userStore.user.sede_id = stateSedes.selectedSede.id
    userStore.user.sede_nombre = stateSedes.selectedSede.nombre;
  }else{
    //TODO
  }
}
</script>

<template>
    <Select
        v-model="stateSedes.selectedSede.id"
        :options="stateSedes.sedes"
        optionLabel="nombre"
        optionValue="id"
        placeholder="Seleccione una sede"
        class="w-64"
        @change="changeOptionSede"
    />
</template>

<style scoped>

</style>