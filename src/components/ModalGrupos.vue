<script setup>
import { useModalGrupoStore } from "@/stores/modalGrupos.js";
import { useGruposStore } from "@/stores/grupos.js";
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useToast } from "primevue/usetoast";

const store = useModalGrupoStore();
const grupoStore = useGruposStore();
const toast = useToast();


const HandleSubmit = () => {
    if (grupoStore.grupo.id) {
        actualizarGrupo();
    } else {
        crearGrupo();
    }
}

const crearGrupo = async () => {
    try {
        await grupoStore.crearGrupo();
        toast.add({ severity: 'success', summary: 'OK', detail: '¡Grupo creado!', life: 3000 });
        store.toggleModalGrupo();
    } catch (err) {
        console.log(err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}


const actualizarGrupo = async () => {
    try {
        await grupoStore.updateGrupo();
        toast.add({ severity: 'success', summary: 'OK', detail: '¡Grupo actualizado!', life: 3000 });
        store.toggleModalGrupo();
    } catch (err) {
        console.log(err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}
</script>

<template>
    <Dialog v-model:visible="store.visibleModalGrupo" modal header="Grupo" :style="{ width: '28rem' }">
        <form @submit.prevent="HandleSubmit">
            <div class="flex items-center gap-4 mb-4">
                <label for="nombre_grupo" class="font-semibold w-28">Nombre</label>
                <InputText 
                    id="nombre_grupo" 
                    v-model="grupoStore.grupo.nombre" 
                    name="nombre" 
                    class="flex-auto" 
                    autocomplete="off" 
                    placeholder="Ej: A, B, C..."
                    required
                />
            </div>

            <div class="flex justify-end gap-2 mt-6">
                <Button type="button" label="Cerrar" severity="secondary" @click="store.toggleModalGrupo"></Button>
                <Button type="submit" label="Guardar"></Button>
            </div>
        </form>
    </Dialog>
</template>

<style scoped>
</style>
