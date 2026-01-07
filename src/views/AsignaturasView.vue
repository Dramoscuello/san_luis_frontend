<script setup>
import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { ref, onMounted, computed } from 'vue';
import { useAsignaturasStore } from "@/stores/asignaturas.js";
import { useAreasStore } from "@/stores/areas.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import ModalAsignaturas from "@/components/ModalAsignaturas.vue";
import { useModalAsignaturaStore } from "@/stores/modalAsignaturas.js";
import SelectAreas from "@/components/SelectAreas.vue";
import { confirmAlert } from "@/lib/confirm.js";

const currentPage = ref(0);
const rowsPerPage = ref(10);
const asignaturaStore = useAsignaturasStore();
const areasStore = useAreasStore();
const toast = useToast();
const confirm = useConfirm();
const storeModalAsignatura = useModalAsignaturaStore();

/**
 * Filtra las asignaturas según el área seleccionada
 * Si no hay área seleccionada, muestra todas las asignaturas
 */
const filteredAsignaturas = computed(() => {
    if (storeModalAsignatura.visibleModalAsignatura) {
        return asignaturaStore.asignaturas;
    } else {
        if (!areasStore.selectedArea.id) {
            return asignaturaStore.asignaturas;
        }
        return asignaturaStore.asignaturas.filter(asig => asig.area_id === areasStore.selectedArea.id);
    }
});

onMounted(async () => {
    await areasStore.getAreas();
    await asignaturaStore.getAsignaturas();
});

const toggleActivo = async (asignatura) => {
    try {
        await asignaturaStore.updateEstado({ id: asignatura.id, activa: !asignatura.activa });
    } catch (error) {
        console.log(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
};

const crearAsignatura = () => {
    // Guardar el filtro actual antes de abrir el modal
    storeModalAsignatura.saveFilter(areasStore.selectedArea.id, areasStore.selectedArea.nombre);
    areasStore.clearSelectedArea();
    asignaturaStore.resetAsignatura();
    storeModalAsignatura.toggleModalAsignatura();
};

const eliminarAsignatura = async (data) => {
    try {
        await asignaturaStore.deleteAsignatura(data.id);
    } catch (error) {
        console.log(error);
        toast.add({ severity: 'error', summary: 'Error', detail: 'Vuelva a intentarlo mas tarde', life: 3000 });
    }
}

const confirmarDeleteAsignatura = (data) => {
    confirmAlert(
        confirm,
        `¿Estás seguro que deseas eliminar la asignatura "${data.nombre}"?`,
        () => eliminarAsignatura(data),
        {
            header: 'Eliminar Asignatura',
            acceptProps: {
                label: 'Eliminar',
                severity: 'danger'
            }
        }
    );
}

const editarAsignatura = (data) => {
    // Guardar el filtro actual antes de abrir el modal
    storeModalAsignatura.saveFilter(areasStore.selectedArea.id, areasStore.selectedArea.nombre);

    asignaturaStore.asignatura.id = data.id;
    asignaturaStore.asignatura.nombre = data.nombre;
    asignaturaStore.asignatura.descripcion = data.descripcion || '';
    asignaturaStore.asignatura.area_id = data.area_id || data.area?.id;
    asignaturaStore.asignatura.grados = data.grados || '';
    asignaturaStore.asignatura.activa = data.activa;

    // Setear el área seleccionada para el select del modal
    areasStore.selectedArea.id = data.area_id || data.area?.id;
    areasStore.selectedArea.nombre = data.area?.nombre;

    storeModalAsignatura.toggleModalAsignatura();
}
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
                    <h1 class="text-2xl font-bold text-gray-800">Gestión de asignaturas</h1>
                    <Button
                        label="Crear asignatura"
                        icon="pi pi-plus"
                        severity="success"
                        @click="crearAsignatura"
                    />
                </div>

                <div class="flex items-center gap-4 mb-6">
                    <label for="filter-areas" class="text-sm font-semibold text-gray-700">
                        Filtrar por área:
                    </label>
                    <SelectAreas />
                </div>

                <!-- DataTable -->
                <DataTable
                    :value="filteredAsignaturas"
                    :paginator="true"
                    :rows="rowsPerPage"
                    :rowsPerPageOptions="[5, 10, 20, 50]"
                    v-model:first="currentPage"
                    sortMode="multiple"
                    tableStyle="min-width: 50rem"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown"
                    currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} asignaturas"
                >
                    <Column field="nombre" header="Asignatura" :sortable="true"></Column>
                    <Column field="descripcion" header="Descripción" :sortable="true">
                        <template #body="slotProps">
                            <span :class="{ 'text-gray-400 italic': !slotProps.data.descripcion }">
                                {{ slotProps.data.descripcion || 'Sin descripción...' }}
                            </span>
                        </template>
                    </Column>
                    <Column field="area.nombre" header="Área" :sortable="true"></Column>
                    <Column field="grados" header="Grados" :sortable="true">
                        <template #body="slotProps">
                            <span :class="{ 'text-gray-400 italic': !slotProps.data.grados }">
                                {{ slotProps.data.grados || 'Sin asignar' }}
                            </span>
                        </template>
                    </Column>
                    <Column field="activa" header="Estado">
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
                                    @click="editarAsignatura(slotProps.data)"
                                />
                                <Button
                                    icon="pi pi-trash"
                                    class="p-button-rounded p-button-sm"
                                    severity="danger"
                                    @click="confirmarDeleteAsignatura(slotProps.data)"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </main>
    </div>

    <ModalAsignaturas />
</template>
