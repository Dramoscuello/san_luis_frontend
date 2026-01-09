<script setup>
import {useModalSedeStore} from "@/stores/modalSedes.js";
import {useSedesStore} from "@/stores/sedes.js";
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useToast } from "primevue/usetoast";

const store = useModalSedeStore();
const sedeStore = useSedesStore();
const toast = useToast();


const HandleSubmit =  () =>{
   if (sedeStore.sede.id) {
     actualizarSede();
   }else{
     crearSede();
   }
}

const crearSede = async () => {
  try{
    await sedeStore.crearSede();
    toast.add({ severity: 'success', summary: 'OK', detail: '¡Sede creada correctamente!', life: 3000 });
    store.toggleModalSede();
  }catch(err){
    console.log(err);
    let detail = 'Vuelva a intentarlo más tarde';
    if (err.response?.data?.detail) {
      detail = err.response.data.detail;
    } else if (err.response?.data?.message) {
      detail = err.response.data.message;
    }
    toast.add({ severity: 'error', summary: 'Error', detail: detail, life: 3000 });
  }
}


const actualizarSede = async () => {
  try{
    await sedeStore.updateSede();
    toast.add({ severity: 'success', summary: 'OK', detail: '¡Sede actualizada correctamente!', life: 3000 });
    store.toggleModalSede();
  }catch(err){
    console.log(err);
    let detail = 'Vuelva a intentarlo más tarde';
    if (err.response?.data?.detail) {
      detail = err.response.data.detail;
    } else if (err.response?.data?.message) {
      detail = err.response.data.message;
    }
    toast.add({ severity: 'error', summary: 'Error', detail: detail, life: 3000 });
  }
}
</script>

<template>
  <Dialog v-model:visible="store.visibleModalSede" modal header="Sedes" :style="{ width: '25rem' }">
    <form
    @submit.prevent="HandleSubmit"
    >
      <div class="flex items-center gap-4 mb-4">
        <label for="codigo" class="font-semibold w-24">Código</label>
        <InputText id="codigo" v-model="sedeStore.sede.codigo" name="codigo" class="flex-auto" autocomplete="off" required/>
      </div>
      <div class="flex items-center gap-4 mb-4">
        <label for="nombre" class="font-semibold w-24">Sede</label>
        <InputText id="nombre" v-model="sedeStore.sede.nombre" name="nombre" class="flex-auto" autocomplete="off" required/>
      </div>
      <div class="flex items-center gap-4 mb-4">
        <label for="direccion" class="font-semibold w-24">Dirección</label>
        <InputText id="direccion" v-model="sedeStore.sede.direccion" name="direccion" class="flex-auto" autocomplete="off" required/>
      </div>

      <div class="flex justify-end gap-2">
        <Button type="button" label="Cerrar" severity="secondary" @click="store.toggleModalSede"></Button>
        <Button type="submit" label="Guardar"></Button>
      </div>
    </form>
  </Dialog>
</template>

<style scoped>

</style>