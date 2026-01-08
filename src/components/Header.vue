<script setup>
import {onMounted, ref, computed} from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/services/auth.js';
import {useSedesStore} from "@/stores/sedes.js";
import {useUserStore} from "@/stores/user.js";
import { userService } from '@/services/userService.js';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const router = useRouter();
const isMenuOpen = ref(false);
const storeSedes = useSedesStore();
const storeUser = useUserStore();

// Obtener el nombre del usuario desde localStorage (inmediato) o del store (después de API)
const nombreUsuario = computed(() => {
  // Primero intentar obtener de localStorage (guardado en login)
  const userFromAuth = authService.getUser();
  if (userFromAuth && userFromAuth.nombre_completo) {
    return userFromAuth.nombre_completo;
  }
  // Fallback al store
  return storeUser.userLogged.nombre_completo || 'Usuario';
});

// Obtener las iniciales del nombre
const inicialesUsuario = computed(() => {
  const nombre = nombreUsuario.value;
  if (!nombre || nombre === 'Usuario') return 'U';
  return nombre
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
});

// Estado del modal de cambio de contraseña
const showPasswordModal = ref(false);
const passwordActual = ref('');
const passwordNuevo = ref('');
const passwordConfirmar = ref('');
const loading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const openPasswordModal = () => {
  isMenuOpen.value = false;
  showPasswordModal.value = true;
  // Limpiar campos
  passwordActual.value = '';
  passwordNuevo.value = '';
  passwordConfirmar.value = '';
  errorMessage.value = '';
  successMessage.value = '';
};

const closePasswordModal = () => {
  showPasswordModal.value = false;
};

const changePassword = async () => {
  errorMessage.value = '';
  successMessage.value = '';

  // Validaciones
  if (!passwordActual.value || !passwordNuevo.value || !passwordConfirmar.value) {
    errorMessage.value = 'Todos los campos son obligatorios';
    return;
  }

  if (passwordNuevo.value !== passwordConfirmar.value) {
    errorMessage.value = 'Las contraseñas nuevas no coinciden';
    return;
  }

  if (passwordNuevo.value.length < 4) {
    errorMessage.value = 'La nueva contraseña debe tener al menos 4 caracteres';
    return;
  }

  try {
    loading.value = true;
    await userService.changePassword(passwordActual.value, passwordNuevo.value);
    successMessage.value = 'Contraseña actualizada correctamente';
    // Limpiar campos después de éxito
    passwordActual.value = '';
    passwordNuevo.value = '';
    passwordConfirmar.value = '';
    // Cerrar modal después de 2 segundos
    setTimeout(() => {
      closePasswordModal();
    }, 2000);
  } catch (error) {
    errorMessage.value = error.response?.data?.detail || 'Error al cambiar la contraseña';
  } finally {
    loading.value = false;
  }
};

const logout = () => {
  authService.clearAuth();
  router.push('/login');
};

onMounted(async () => {
  await storeUser.getUserLogged();
  await storeSedes.getSedes();
});
</script>

<template>
  <header class="bg-white border-b border-gray-200 px-8 py-4">
    <div class="flex items-center justify-end">
      <div class="flex items-center space-x-3">
        <div class="relative">
          <button
            @click="toggleMenu"
            class="flex items-center space-x-2 hover:bg-gray-50 rounded-lg px-3 py-2 transition"
          >
            <div class="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              <span class="text-white text-sm font-medium">{{ inicialesUsuario }}</span>
            </div>
            <span class="text-sm font-medium text-gray-700">{{ nombreUsuario }}</span>
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Menú desplegable -->
          <div
            v-if="isMenuOpen"
            class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
          >
            <button
              @click="openPasswordModal"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <span>Cambiar contraseña</span>
            </button>
            <button
              @click="logout"
              class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Modal de Cambio de Contraseña -->
  <Dialog
    v-model:visible="showPasswordModal"
    header="Cambiar contraseña"
    :modal="true"
    :closable="true"
    :style="{ width: '400px' }"
  >
    <div class="space-y-4">
      <!-- Mensaje de error -->
      <div v-if="errorMessage" class="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
        {{ errorMessage }}
      </div>

      <!-- Mensaje de éxito -->
      <div v-if="successMessage" class="p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm">
        {{ successMessage }}
      </div>

      <!-- Contraseña actual -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Contraseña actual</label>
        <InputText
          v-model="passwordActual"
          type="password"
          placeholder="Ingresa tu contraseña actual"
          class="w-full"
        />
      </div>

      <!-- Nueva contraseña -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Nueva contraseña</label>
        <InputText
          v-model="passwordNuevo"
          type="password"
          placeholder="Ingresa tu nueva contraseña"
          class="w-full"
        />
      </div>

      <!-- Confirmar nueva contraseña -->
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-gray-700">Confirmar nueva contraseña</label>
        <InputText
          v-model="passwordConfirmar"
          type="password"
          placeholder="Confirma tu nueva contraseña"
          class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button
          label="Cancelar"
          severity="secondary"
          @click="closePasswordModal"
          :disabled="loading"
        />
        <Button
          label="Guardar"
          @click="changePassword"
          :loading="loading"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>

</style>