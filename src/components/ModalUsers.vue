<script setup>
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dropdown from 'primevue/dropdown';
import {useModalUserStore} from '@/stores/modalUsers.js';
import {useUserStore} from "@/stores/user.js";
import { useToast } from "primevue/usetoast";
import SelectSedes from "@/components/SelectSedes.vue";
import {computed, ref} from "vue";

const storeModalUser = useModalUserStore();
const storeUser = useUserStore();
const toast = useToast();
const closable = false;

const roles = ref([
    {name: 'Rector', value: 'rector'},
    {name: 'Coordinador', value: 'coordinador'},
    {name: 'Docente', value: 'docente'}
]);

const rolesComputed = computed(() => {
    if (storeModalUser.isDirectivoMode) {
        return roles.value.filter(r => r.value !== 'docente');
    }
    return roles.value;
});

const requiresSede = computed(() => {
    return storeUser.user.rol === 'docente';
});

const HandleSubmit = ()=>{
  // Modo docente forzado
  if (storeModalUser.isDocenteMode && !storeUser.user.id) {
      storeUser.user.rol = 'docente';
  }

  // Si no requiere sede (rector/coordinador), limpiamos el valor
  if (!requiresSede.value) {
    storeUser.user.sede_id = null;
  }
  
  if(storeUser.user.id){
    actualizarUser();
  }else{
    crearUser();
  }
}

const creacion = computed(()=>{
  return storeUser.user.id === null;
});


const actualizarUser = async () => {
  try{
    await storeUser.updateUser();
    await storeUser.getUsers(); // Recargar datos del servidor para verificar persistencia real
    toast.add({ severity: 'success', summary: 'OK', detail: '¡Usuario actualizado!', life: 3000 });
  }catch (e){
    console.error(e);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
  finally {
    storeModalUser.toggleModalUser();
  }
}

const crearUser = async () => {
  try{
    await storeUser.createUser();
    toast.add({ severity: 'success', summary: 'OK', detail: '¡Usuario creado!', life: 3000 });
  }catch (e){
    console.error(e);
    toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
  }
  finally {
    storeModalUser.toggleModalUser();
  }
}

</script>

<template>
  <Dialog v-model:visible="storeModalUser.visibleModalUser" modal header="Usuarios" :style="{ width: '25rem' }" :closable="closable">
    <form
      @submit.prevent="HandleSubmit"
    >
      <div class="flex items-center gap-4 mb-4">
        <label for="cedula" class="font-semibold w-24">Cedula</label>
        <InputText id="cedula" v-model="storeUser.user.cedula" name="cedula" class="flex-auto" autocomplete="off" required/>
      </div>

      <div class="flex items-center gap-4 mb-4">
        <label for="nombre" class="font-semibold w-24">Nombres y apellidos</label>
        <InputText id="nombre" v-model="storeUser.user.nombre_completo" name="nombre" class="flex-auto" autocomplete="off" required/>
      </div>

      <div class="flex items-center gap-4 mb-4">
        <label for="email" class="font-semibold w-24">Email</label>
        <InputText id="email" v-model="storeUser.user.email" name="email" class="flex-auto" autocomplete="off" required/>
      </div>

      <div v-if="creacion" class="flex items-center gap-4 mb-4">
        <label for="pass" class="font-semibold w-24">Password</label>
        <InputText id="pass" v-model="storeUser.user.password" name="pass" type="password" class="flex-auto" autocomplete="off" required/>
      </div>

      <div class="flex items-center gap-4 mb-4">
        <label for="telefono" class="font-semibold w-24">Telefono</label>
        <InputText id="telefono" v-model="storeUser.user.telefono" name="telefono" class="flex-auto" autocomplete="off" required/>
      </div>

      <div class="flex items-center gap-4 mb-4" v-if="!storeModalUser.isDocenteMode">
        <label for="rol" class="font-semibold w-24">Rol</label>
        <Dropdown 
            id="rol" 
            v-model="storeUser.user.rol" 
            :options="rolesComputed" 
            optionLabel="name" 
            optionValue="value" 
            placeholder="Seleccione un rol" 
            class="flex-auto" 
            required
        />
      </div>

      <div v-if="requiresSede" class="flex items-center gap-4 mb-4">
        <label class="font-semibold w-24">Sede</label>
        <SelectSedes/>
      </div>


      <div class="flex justify-end gap-2">
        <Button type="button" label="Cerrar" severity="secondary" @click="storeModalUser.toggleModalUser"></Button>
        <Button type="submit" label="Guardar"></Button>
      </div>
    </form>
  </Dialog>
</template>

<style scoped>

</style>