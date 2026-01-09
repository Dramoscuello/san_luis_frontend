<script setup>
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';

const props = defineProps({
  visible: {
    type: Boolean,
    required: true
  },
  header: {
    type: String,
    default: 'Crear Cronograma'
  },
  initialData: {
    type: Object,
    default: () => ({ titulo: '', descripcion: '' })
  }
});

const emit = defineEmits(['update:visible', 'save']);

const form = ref({
  titulo: '',
  descripcion: ''
});

// Watch for changes in visibility or initialData to reset/populate form
watch(() => props.visible, (newVal) => {
  if (newVal) {
    form.value = { ...props.initialData };
  }
});

watch(() => props.initialData, (newVal) => {
    if (props.visible) {
        form.value = { ...newVal };
    }
}, { deep: true });

const isValid = computed(() => {
  const hasMinLen = form.value.titulo && form.value.titulo.length >= 5;
  const hasChanged = JSON.stringify(form.value) !== JSON.stringify(props.initialData);
  
  // If creating (initialData is empty/default), just check valid.
  // If editing (initialData has content), check valid AND changed.
  if (!props.initialData.titulo) {
      return hasMinLen;
  }
  return hasMinLen && hasChanged;
});

const close = () => {
  emit('update:visible', false);
};

const handleSave = () => {
  if (isValid.value) {
    emit('save', { ...form.value });
  }
};
</script>

<template>
  <Dialog 
    :visible="visible" 
    @update:visible="emit('update:visible', $event)" 
    modal 
    :header="header" 
    :style="{ width: '30rem' }"
    :closable="true"
  >
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label for="titulo" class="font-semibold">Título del Cronograma</label>
        <InputText 
          id="titulo" 
          v-model="form.titulo" 
          placeholder="Ej: Cronograma de Actividades 2025" 
          autocomplete="off" 
          class="w-full"
          :class="{ 'p-invalid': form.titulo.length > 0 && form.titulo.length < 5 }"
        />
        <small class="text-gray-500" v-if="form.titulo.length < 5">Mínimo 5 caracteres.</small>
      </div>
      
      <div class="flex flex-col gap-2">
        <label for="descripcion" class="font-semibold">Descripción (Opcional)</label>
        <Textarea 
          id="descripcion" 
          v-model="form.descripcion" 
          rows="3" 
          placeholder="Descripción general de la planeación anual..." 
          class="w-full" 
        />
      </div>
    </div>

    <template #footer>
      <Button label="Cancelar" icon="pi pi-times" text @click="close" severity="secondary" />
      <Button 
        label="Guardar" 
        icon="pi pi-check" 
        @click="handleSave" 
        :disabled="!isValid" 
        severity="primary" 
      />
    </template>
  </Dialog>
</template>
