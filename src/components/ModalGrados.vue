<script setup>
import { useModalGradoStore } from "@/stores/modalGrados.js";
import { useGradosStore } from "@/stores/grados.js";
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useToast } from "primevue/usetoast";
import { useSedesStore } from "@/stores/sedes.js";

const store = useModalGradoStore();
const gradoStore = useGradosStore();
const sedesStore = useSedesStore(); // Nuevo
const toast = useToast();

const HandleSubmit = () => {
    if (gradoStore.grado.id) {
        actualizarGrado();
    } else {
        crearGrado();
    }
}

const crearGrado = async () => {
    try {
        await gradoStore.crearGrado();
        await sedesStore.getSedes(); // Refrescar sedes
        toast.add({ severity: 'success', summary: 'OK', detail: '¡Grado creado!', life: 3000 });
        store.toggleModalGrado();
    } catch (err) {
        console.log(err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}


const actualizarGrado = async () => {
    try {
        await gradoStore.updateGrado();
        await sedesStore.getSedes(); // Refrescar sedes (por si acaso cambia algo relevante)
        toast.add({ severity: 'success', summary: 'OK', detail: '¡Grado actualizado!', life: 3000 });
        store.toggleModalGrado();
    } catch (err) {
        console.log(err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}
</script>

<template>
    <Dialog v-model:visible="store.visibleModalGrado" modal header="Grado" :style="{ width: '28rem' }">
        <form @submit.prevent="HandleSubmit">
            <div class="flex items-center gap-4 mb-4">
                <label for="nombre_grado" class="font-semibold w-28">Nombre</label>
                <InputText 
                    id="nombre_grado" 
                    v-model="gradoStore.grado.nombre" 
                    name="nombre" 
                    class="flex-auto" 
                    autocomplete="off" 
                    placeholder="Ej: Primero, Segundo..."
                    required
                />
            </div>

            <div class="flex justify-end gap-2 mt-6">
                <Button type="button" label="Cerrar" severity="secondary" @click="store.toggleModalGrado"></Button>
                <Button type="submit" label="Guardar"></Button>
            </div>
        </form>
    </Dialog>
</template>

<style scoped>
</style>
