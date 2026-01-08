<script setup>
/**
 * ============================================
 * VISTA DE DETALLE DE PROYECTO
 * ============================================
 * Estilo "Hoja de Word".
 * Accesible para Docentes (editores) y Directivos (revisores).
 */
import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import { onMounted, computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProyectosStore } from "@/stores/proyectos.js";
import { useUserStore } from "@/stores/user.js";
import { useComentariosProyectosStore } from "@/stores/comentariosProyectos.js";
import { useToast } from "primevue/usetoast";
import { useConfirm } from "primevue/useconfirm";
import { confirmAlert } from "@/lib/confirm.js";

const route = useRoute();
const router = useRouter();
const proyectosStore = useProyectosStore();
const userStore = useUserStore();
const comentariosStore = useComentariosProyectosStore();
const toast = useToast();
const confirm = useConfirm();

const proyectoId = route.params.id;
const proyecto = computed(() => proyectosStore.proyecto);
const user = computed(() => userStore.userLogged);

// Verificar roles
const isDirectivo = computed(() => {
    const r = user.value?.rol?.toLowerCase();
    return r === 'coordinador' || r === 'rector';
});
const isDocente = computed(() => !isDirectivo.value);

// Comentarios State
const mostrarComentarios = ref(false); // Toggle lateral o sección abajo? El usuario dijo "esquina inferior derecha de la hoja botones"
// Pero la visualización de los comentarios en sí no está definida, haré una sección flotante o drawer. 
// Mejor un panel lateral/drawer derecho que se abre al dar click en el botón de comentarios, 
// o un modal como en planeaciones pero invocado desde el botón. 
// El usuario dijo "guiate de la implementacion de comentarios de planeaciones". Allí es un Dialog. Usaré Dialog.
const modalComentariosVisible = ref(false);
const nuevoComentario = ref('');
const comentarioEditandoId = ref(null);
const contenidoEditado = ref('');


onMounted(async () => {
    if (!userStore.userLogged.id) await userStore.getUserLogged();
    await proyectosStore.getProyecto(proyectoId);
});

const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
};

// Acciones Principales
const volver = () => {
    router.push({ name: 'proyectos' });
};

const editarProyecto = () => {
    proyectosStore.setProyectoParaEditar(proyecto.value);
    router.push({ name: 'proyectos' }); // Redirigir a vista con formulario (o hacer formulario in-place en futuro)
    // Nota: La vista ProyectosView.vue tiene el formulario. Al setear 'proyectoParaEditar' en el store, 
    // y volver a esa vista, debería cargar en el formulario.
};

const eliminarProyecto = async () => {
    try {
        await proyectosStore.eliminarProyecto(proyecto.value.id);
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Proyecto eliminado', life: 3000 });
        router.push({ name: 'proyectos' });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo eliminar', life: 3000 });
    }
};

const confirmarEliminar = () => {
    confirmAlert(confirm, '¿Eliminar este proyecto?', eliminarProyecto, {
        header: 'Confirmar Eliminación', acceptProps: { severity: 'danger' }
    });
};

/* --- COMENTARIOS --- */
const abrirComentarios = async () => {
    modalComentariosVisible.value = true;
    await comentariosStore.getComentarios(proyecto.value.id);
};

const enviarComentario = async () => {
    if (!nuevoComentario.value.trim()) return;
    try {
        await comentariosStore.crearComentario(proyecto.value.id, nuevoComentario.value.trim());
        nuevoComentario.value = '';
        toast.add({ severity: 'success', summary: 'Enviado', detail: 'Comentario agregado', life: 3000 });
    } catch (e) {
        console.error(e);
        toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo enviar', life: 3000 });
    }
};

const eliminarComentario = async (id) => {
    try {
        await comentariosStore.eliminarComentario(id);
        toast.add({ severity: 'success', summary: 'Eliminado', detail: 'Comentario eliminado', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al eliminar', life: 3000 });
    }
};

const iniciarEdicionComentario = (c) => {
    comentarioEditandoId.value = c.id;
    contenidoEditado.value = c.contenido;
};

const guardarEdicionComentario = async (id) => {
    try {
        await comentariosStore.actualizarComentario(id, contenidoEditado.value);
        comentarioEditandoId.value = null;
        contenidoEditado.value = '';
        toast.add({ severity: 'success', summary: 'Actualizado', detail: 'Comentario actualizado', life: 3000 });
    } catch (e) {
        toast.add({ severity: 'error', summary: 'Error', detail: 'Error al actualizar', life: 3000 });
    }
};

const getInitials = (nombre) => {
    if (!nombre) return '??';
    return nombre.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
};

const formatComentarioDate = (d) => {
    if(!d) return '';
    return new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour:'2-digit', minute:'2-digit'});
};
</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <Sidebar />

    <main class="flex-1 overflow-y-auto">
      <Header />

      <div class="p-8 flex justify-center">
        <!-- Contenedor Hoja -->
        <div class="w-full max-w-4xl bg-white shadow-xl rounded-xl border border-gray-200 relative min-h-[800px] flex flex-col">
            
            <!-- Botón volver flotante fuera de la hoja a la izq -->
            <div class="absolute -left-16 top-0">
                <Button icon="pi pi-arrow-left" text rounded severity="secondary" @click="volver" v-tooltip="'Volver'" />
            </div>

            <!-- Cabecera de la Hoja -->
            <div class="p-10 border-b border-gray-100">
                <div class="flex justify-between items-start mb-6">
                    <h1 class="text-3xl font-bold text-gray-800 font-serif">{{ proyecto?.titulo }}</h1>
                    <span v-if="proyecto?.estado" class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs uppercase tracking-wide font-semibold">
                        {{ proyecto.estado }}
                    </span>
                </div>

                <div class="grid grid-cols-2 gap-8 mb-6 text-sm text-gray-600">
                    <div>
                        <p class="uppercase text-xs font-bold text-gray-400 mb-1">Docente Propietario</p>
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                {{ getInitials(proyecto?.docente?.nombre_completo || 'Docente') }}
                            </div>
                            <span class="font-medium">{{ proyecto?.docente?.nombre_completo || 'Docente' }}</span>
                        </div>
                    </div>
                    <div>
                        <p class="uppercase text-xs font-bold text-gray-400 mb-1">Periodo de Ejecución</p>
                        <div class="flex items-center gap-2 font-medium">
                            <span>{{ formatDate(proyecto?.fecha_inicio) }}</span>
                            <i class="pi pi-arrow-right text-xs text-gray-400"></i>
                            <span>{{ proyecto?.fecha_fin_estimada ? formatDate(proyecto?.fecha_fin_estimada) : 'En curso' }}</span>
                        </div>
                    </div>
                </div>

                <div class="prose max-w-none text-gray-700 space-y-4">
                    <div>
                        <h3 class="text-xs uppercase font-bold text-gray-400 mb-2">Descripción</h3>
                        <p class="leading-relaxed">{{ proyecto?.descripcion }}</p>
                    </div>
                    
                    <div v-if="proyecto?.objetivos">
                        <h3 class="text-xs uppercase font-bold text-gray-400 mt-6 mb-2">Objetivos</h3>
                        <p class="leading-relaxed whitespace-pre-line">{{ proyecto?.objetivos }}</p>
                    </div>
                </div>
            </div>

            <!-- Cuerpo: Evidencias -->
            <div class="flex-1 p-10 bg-gray-50/30">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <i class="pi pi-folder-open text-yellow-500"></i>
                        Evidencias del Proyecto
                    </h2>
                    
                    <!-- Boton añadir evidencias (Placeholder funcional) -->
                    <Button 
                        v-if="isDocente"
                        label="Añadir Evidencia" 
                        icon="pi pi-plus" 
                        size="small" 
                        severity="primary" 
                        outlined
                        v-tooltip="'Próximamente'"
                    />
                </div>

                <!-- Empty State Evidencias -->
                <div class="border-2 border-dashed border-gray-200 rounded-lg p-12 flex flex-col items-center justify-center text-gray-400 bg-white">
                    <i class="pi pi-images text-4xl mb-3 opacity-50"></i>
                    <p class="font-medium">Sin evidencias registradas</p>
                    <p class="text-xs mt-1">Las evidencias del progreso aparecerán aquí</p>
                </div>
            </div>

            <!-- Botones de Acción (Esquina Inferior Derecha) -->
            <div class="absolute bottom-8 right-8 flex flex-col gap-2">
                <!-- Comentarios (Para todos) -->
                 <Button 
                    icon="pi pi-comments" 
                    class="p-button-rounded p-button-secondary shadow-lg relative" 
                    size="large"
                    v-tooltip.left="'Comentarios'"
                    @click="abrirComentarios"
                 >
                    <span v-if="comentariosStore.comentarios.length > 0" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                        {{ comentariosStore.comentarios.length }}
                    </span>
                 </Button>

                <!-- Editar (Solo Docente) -->
                <Button 
                    v-if="isDocente"
                    icon="pi pi-pencil" 
                    class="p-button-rounded p-button-warning shadow-lg" 
                    size="large"
                    v-tooltip.left="'Editar Proyecto'"
                    @click="editarProyecto"
                />

                <!-- Eliminar (Solo Docente) -->
                <Button 
                    v-if="isDocente"
                    icon="pi pi-trash" 
                    class="p-button-rounded p-button-danger shadow-lg" 
                    size="large"
                    v-tooltip.left="'Eliminar Proyecto'"
                    @click="confirmarEliminar"
                />
            </div>
        </div>
      </div>
    </main>

    <!-- Dialogo Comentarios -->
    <Dialog 
        v-model:visible="modalComentariosVisible" 
        modal 
        header="Comentarios del Proyecto" 
        :style="{ width: '40vw' }"
        :breakpoints="{ '960px': '75vw', '641px': '90vw' }"
    >
        <div class="flex flex-col h-[500px]">
            <!-- Lista -->
            <div class="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 p-1">
                <div v-if="comentariosStore.loading" class="flex justify-center p-4">
                    <i class="pi pi-spin pi-spinner text-blue-500 text-xl"></i>
                </div>
                <div v-else-if="comentariosStore.comentarios.length === 0" class="text-center text-gray-400 py-10">
                    <i class="pi pi-comment text-3xl mb-2"></i>
                    <p>No hay comentarios aún</p>
                </div>
                <div 
                    v-for="c in comentariosStore.comentarios" 
                    :key="c.id" 
                    class="bg-gray-50 p-3 rounded-lg border border-gray-100 relative group"
                >   
                    <!-- Header comentario -->
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex items-center gap-2">
                             <div class="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center">
                                {{ getInitials(c.usuario_nombre || 'Usuario') }}
                             </div>
                             <div>
                                <span class="text-sm font-semibold text-gray-700 block">{{ c.usuario_nombre || 'Usuario' }}</span>
                                <span class="text-xs text-gray-400">{{ formatComentarioDate(c.created_at) }}</span>
                             </div>
                        </div>
                        
                        <!-- Acciones comentario (Solo directivos) -->
                        <div v-if="isDirectivo" class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button icon="pi pi-pencil text-xs" text rounded severity="warning" size="small" @click="iniciarEdicionComentario(c)" />
                            <Button icon="pi pi-trash text-xs" text rounded severity="danger" size="small" @click="eliminarComentario(c.id)" />
                        </div>
                    </div>

                    <!-- Contenido -->
                    <div v-if="comentarioEditandoId === c.id">
                        <InputText v-model="contenidoEditado" class="w-full text-sm mb-2" autoFocus />
                        <div class="flex gap-2 justify-end">
                            <Button label="Cancelar" size="small" text severity="secondary" @click="comentarioEditandoId = null" />
                            <Button label="Guardar" size="small" severity="primary" @click="guardarEdicionComentario(c.id)" />
                        </div>
                    </div>
                    <p v-else class="text-sm text-gray-600 whitespace-pre-wrap pl-8">{{ c.contenido }}</p>
                </div>
            </div>

            <!-- Input Nuevo Comentario (Solo Directivos) -->
            <div v-if="isDirectivo" class="mt-4 pt-4 border-t border-gray-100">
                <div class="flex gap-2">
                    <InputText 
                        v-model="nuevoComentario" 
                        placeholder="Escribe una observación..." 
                        class="flex-1"
                        @keydown.enter="enviarComentario"
                    />
                    <Button 
                        icon="pi pi-send" 
                        severity="primary" 
                        @click="enviarComentario"
                        :loading="comentariosStore.enviando"
                    />
                </div>
            </div>
            <div v-else class="mt-4 pt-4 border-t border-gray-100 text-center">
                <p class="text-xs text-gray-400 italic">Solo directivos pueden agregar comentarios.</p>
            </div>
        </div>
    </Dialog>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>
