<script setup>
import {onMounted, ref} from 'vue';
import { useRouter } from 'vue-router';
import { authService } from '@/services/auth.js';
import {useSedesStore} from "@/stores/sedes.js";
import {useUserStore} from "@/stores/user.js";

const router = useRouter();
const isMenuOpen = ref(false);
const storeSedes = useSedesStore();
const storeUser = useUserStore();

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
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
              <span class="text-white text-sm font-medium">E</span>
            </div>
            <span class="text-sm font-medium text-gray-700">{{storeUser.userLogged.nombre_completo}}</span>
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
</template>

<style scoped>

</style>