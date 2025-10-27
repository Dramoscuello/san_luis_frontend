<script setup>
import {useModalSedeStore} from "@/stores/modalSedes.js";
import {useSedesStore} from "@/stores/sedes.js";
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useToast } from "primevue/usetoast";

const store = useModalSedeStore();
const sede = useSedesStore();
const toast = useToast();


const HandleSubmit = async () =>{
  try{
    await sede.updateSede();
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
        <InputText id="codigo" v-model="sede.sede.codigo" name="codigo" class="flex-auto" autocomplete="off" required/>
      </div>
      <div class="flex items-center gap-4 mb-4">
        <label for="nombre" class="font-semibold w-24">Sede</label>
        <InputText id="nombre" v-model="sede.sede.nombre" name="nombre" class="flex-auto" autocomplete="off" required/>
      </div>
      <div class="flex items-center gap-4 mb-4">
        <label for="direccion" class="font-semibold w-24">Dirección</label>
        <InputText id="direccion" v-model="sede.sede.direccion" name="direccion" class="flex-auto" autocomplete="off" required/>
      </div>

      <div class="flex justify-end gap-2">
        <Button type="button" label="Cancel" severity="secondary" @click="store.toggleModalSede"></Button>
        <Button type="submit" label="Save"></Button>
      </div>
    </form>
  </Dialog>
</template>

<style scoped>

</style>