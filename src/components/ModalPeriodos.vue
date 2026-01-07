<script setup>
import { useModalPeriodosStore } from "@/stores/modalPeriodos.js";
import { usePeriodosStore } from "@/stores/periodos.js";
import Dialog from 'primevue/dialog';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import { useToast } from "primevue/usetoast";

const store = useModalPeriodosStore();
const periodosStore = usePeriodosStore();
const toast = useToast();

// Formatear fecha a YYYY-MM-DD
const formatDateToString = (date) => {
    if (!date) return null;
    if (typeof date === 'string') return date;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const HandleSubmit = async () => {
    try {
        const data = {
            fecha_inicio: formatDateToString(periodosStore.periodo.fecha_inicio),
            fecha_fin: formatDateToString(periodosStore.periodo.fecha_fin)
        };
        await periodosStore.updatePeriodo(periodosStore.periodo.id, data);
        toast.add({ severity: 'info', summary: 'OK', detail: 'Fechas actualizadas', life: 3000 });
        store.visibleModalPeriodo = false;
    } catch (err) {
        console.log(err);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}
</script>

<template>
    <Dialog v-model:visible="store.visibleModalPeriodo" modal header="Editar Periodo" :style="{ width: '25rem' }">
        <form @submit.prevent="HandleSubmit">
            <div class="flex flex-col gap-2 mb-4">
                <label for="fecha_inicio" class="font-semibold">Fecha de inicio</label>
                <DatePicker
                    id="fecha_inicio"
                    v-model="periodosStore.periodo.fecha_inicio"
                    dateFormat="yy-mm-dd"
                    showIcon
                    class="w-full"
                />
            </div>
            <div class="flex flex-col gap-2 mb-4">
                <label for="fecha_fin" class="font-semibold">Fecha de fin</label>
                <DatePicker
                    id="fecha_fin"
                    v-model="periodosStore.periodo.fecha_fin"
                    dateFormat="yy-mm-dd"
                    showIcon
                    class="w-full"
                />
            </div>

            <div class="flex justify-end gap-2">
                <Button type="button" label="Cerrar" severity="secondary" @click="store.visibleModalPeriodo = false"></Button>
                <Button type="submit" label="Guardar"></Button>
            </div>
        </form>
    </Dialog>
</template>

<style scoped>

</style>
