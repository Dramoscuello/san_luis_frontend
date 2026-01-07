<script setup>
import { onMounted } from "vue";
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import { useAreasStore } from "@/stores/areas.js";
import { useModalAreaStore } from "@/stores/modalAreas.js";
import ModalAreas from "@/components/ModalAreas.vue";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";

const store = useAreasStore();
const storeModalAreas = useModalAreaStore();
const toast = useToast();
const confirm = useConfirm();

onMounted(async () => {
    await store.getAreas();
});

const toggleActivo = async (area) => {
    try {
        await store.updateEstado({ id: area.id, activa: !area.activa });
    } catch (error) {
        console.log(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
};

const editarArea = (area) => {
    store.area.nombre = area.nombre;
    store.area.id = area.id;
    store.area.activa = area.activa;
    storeModalAreas.toggleModalArea();
}

const eliminarArea = async (area) => {
    try {
        await store.deleteArea(area.id);
    } catch (error) {
        console.log(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
};

const confirmDeleteArea = (area) => {
    confirmAlert(
        confirm,
        `¿Estás seguro que deseas eliminar el área "${area.nombre}"?`,
        () => eliminarArea(area),
        {
            header: 'Eliminar Área',
            acceptProps: {
                label: 'Eliminar',
                severity: 'danger'
            }
        }
    );
};

const agregarNuevaArea = () => {
    store.area.nombre = '';
    store.area.id = null;
    store.area.activa = true;
    storeModalAreas.toggleModalArea();
};
</script>

<template>
    <div class="flex h-screen bg-gray-50">
        <!-- Sidebar -->
        <Sidebar />

        <!-- Main Content Area -->
        <main class="flex-1 overflow-y-auto">
            <!-- Top Bar -->
            <Header />

            <!-- Page Content -->
            <div class="p-8">
                <!-- Header Section -->
                <div class="flex justify-between items-center mb-6">
                    <h1 class="text-2xl font-bold text-gray-800">Gestión de áreas</h1>
                    <Button
                        label="Agregar área"
                        icon="pi pi-plus"
                        severity="success"
                        @click="agregarNuevaArea"
                    />
                </div>

                <DataTable :value="store.areas" :paginator="false" tableStyle="min-width: 50rem">
                    <Column field="nombre" header="Área"></Column>
                    <Column field="activa" header="Activo">
                        <template #body="slotProps">
                            <span
                                @click="toggleActivo(slotProps.data)"
                                :class="slotProps.data.activa ? 'bg-green-500' : 'bg-red-500'"
                                class="px-3 py-1 rounded-full text-white text-sm font-semibold cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                {{ slotProps.data.activa ? 'Activo' : 'Inactivo' }}
                            </span>
                        </template>
                    </Column>
                    <Column header="Opciones">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button
                                    icon="pi pi-pencil"
                                    class="p-button-rounded p-button-sm"
                                    severity="info"
                                    @click="editarArea(slotProps.data)"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    class="p-button-rounded p-button-sm"
                                    severity="danger"
                                    @click="confirmDeleteArea(slotProps.data)"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </main>
    </div>

    <ModalAreas />
</template>
