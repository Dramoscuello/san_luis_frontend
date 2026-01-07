<script setup>
import { useModalAreaStore } from "@/stores/modalAreas.js";
import { useAreasStore } from "@/stores/areas.js";
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { useToast } from "primevue/usetoast";

const store = useModalAreaStore();
const areaStore = useAreasStore();
const toast = useToast();

const HandleSubmit = () => {
    if (areaStore.area.id) {
        actualizarArea();
    } else {
        crearArea();
    }
}

const crearArea = async () => {
    try {
        await areaStore.crearArea();
        toast.add({ severity: 'info', summary: 'OK', detail: '¡Área creada!', life: 3000 });
        store.visibleModalArea = false;
    } catch (err) {
        console.log(err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}

const actualizarArea = async () => {
    try {
        await areaStore.updateArea();
        toast.add({ severity: 'info', summary: 'OK', detail: '¡Área actualizada!', life: 3000 });
        store.visibleModalArea = false;
    } catch (err) {
        console.log(err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}
</script>

<template>
    <Dialog v-model:visible="store.visibleModalArea" modal header="Área" :style="{ width: '25rem' }">
        <form @submit.prevent="HandleSubmit">
            <div class="flex items-center gap-4 mb-4">
                <label for="nombre" class="font-semibold w-24">Nombre</label>
                <InputText id="nombre" v-model="areaStore.area.nombre" name="nombre" class="flex-auto" autocomplete="off" required />
            </div>
            <div class="flex items-center gap-4 mb-4">
                <label for="descripcion" class="font-semibold w-24">Descripción</label>
                <InputText id="descripcion" v-model="areaStore.area.descripcion" name="descripcion" class="flex-auto" autocomplete="off" />
            </div>

            <div class="flex justify-end gap-2">
                <Button type="button" label="Cerrar" severity="secondary" @click="store.visibleModalArea = false"></Button>
                <Button type="submit" label="Guardar"></Button>
            </div>
        </form>
    </Dialog>
</template>

<style scoped>

</style>
