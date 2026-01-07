<script setup>
import { useModalEstudianteStore } from "@/stores/modalEstudiantes.js";
import { useEstudiantesStore } from "@/stores/estudiantes.js";
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useToast } from "primevue/usetoast";

const store = useModalEstudianteStore();
const estudianteStore = useEstudiantesStore();
const toast = useToast();


const HandleSubmit = () => {
    if (estudianteStore.estudiante.id) {
        actualizarEstudiante();
    } else {
        crearEstudiante();
    }
}

const crearEstudiante = async () => {
    try {
        await estudianteStore.crearEstudiante();
        toast.add({ severity: 'success', summary: 'OK', detail: '¡Estudiante creado!', life: 3000 });
        store.toggleModalEstudiante();
    } catch (err) {
        console.log(err);
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.detail || 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}


const actualizarEstudiante = async () => {
    try {
        await estudianteStore.updateEstudiante();
        toast.add({ severity: 'success', summary: 'OK', detail: '¡Estudiante actualizado!', life: 3000 });
        store.toggleModalEstudiante();
    } catch (err) {
        console.log(err);
        toast.add({ severity: 'error', summary: 'Error', detail: err.response?.data?.detail || 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}
</script>

<template>
    <Dialog v-model:visible="store.visibleModalEstudiante" modal header="Estudiante" :style="{ width: '32rem' }">
        <form @submit.prevent="HandleSubmit">
            <div class="flex items-center gap-4 mb-4">
                <label for="numero_documento" class="font-semibold w-36">N° Documento</label>
                <InputText 
                    id="numero_documento" 
                    v-model="estudianteStore.estudiante.numero_documento" 
                    name="numero_documento" 
                    class="flex-auto" 
                    autocomplete="off" 
                    placeholder="Ej: 1234567890"
                    required
                />
            </div>
            <div class="flex items-center gap-4 mb-4">
                <label for="nombres" class="font-semibold w-36">Nombres</label>
                <InputText 
                    id="nombres" 
                    v-model="estudianteStore.estudiante.nombres" 
                    name="nombres" 
                    class="flex-auto" 
                    autocomplete="off" 
                    placeholder="Nombres del estudiante"
                    required
                />
            </div>
            <div class="flex items-center gap-4 mb-4">
                <label for="apellidos" class="font-semibold w-36">Apellidos</label>
                <InputText 
                    id="apellidos" 
                    v-model="estudianteStore.estudiante.apellidos" 
                    name="apellidos" 
                    class="flex-auto" 
                    autocomplete="off" 
                    placeholder="Apellidos del estudiante"
                    required
                />
            </div>

            <div class="flex justify-end gap-2 mt-6">
                <Button type="button" label="Cerrar" severity="secondary" @click="store.toggleModalEstudiante"></Button>
                <Button type="submit" label="Guardar"></Button>
            </div>
        </form>
    </Dialog>
</template>

<style scoped>
</style>
