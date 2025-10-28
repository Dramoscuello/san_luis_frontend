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
     console.log('VOY A ACTUALIZAR');
   }else{
     crearSede();
     console.log('VOY A CREAR');
   }
}

const crearSede = async () => {
  try{
    await sedeStore.crearSede();
    toast.add({ severity: 'info', summary: 'OK', detail: '¡Sede actualizada!', life: 3000 });
    store.toggleModalSede();
  }catch(err){
    console.log(err);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
}


const actualizarSede = async () => {
  try{
    await sedeStore.updateSede();
    toast.add({ severity: 'info', summary: 'OK', detail: '¡Sede actualizada!', life: 3000 });
    store.toggleModalSede();
  }catch(err){
    console.log(err);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
}
</script>

<template>
  <Dialog v-model:visible="store.visibleModalSede" modal header="Sedes" :style="{ width: '25rem' }">
    <form
    @submit.prevent="HandleSubmit"
    >
      <span class="text-surface-500 dark:text-surface-400 block mb-8">Actualizar información</span>
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