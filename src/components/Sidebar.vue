<script setup>
import { computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/user.js';
import { authService } from '@/services/auth.js';

const userStore = useUserStore();

// Verifica si el usuario es coordinador o rector
// Primero intenta obtener el rol de authService (localStorage), 
// y como fallback usa el store (que requiere llamada API)
const esDirectivo = computed(() => {
  // Obtener rol de localStorage (guardado en login)
  const rolFromAuth = authService.getUserRole();
  if (rolFromAuth) {
    return rolFromAuth === 'coordinador' || rolFromAuth === 'rector';
  }
  
  // Fallback al store (si ya se cargó)
  const rol = userStore.userLogged.rol?.toLowerCase();
  return rol === 'coordinador' || rol === 'rector';
});

// Cargar información del usuario si no está disponible en el store
onMounted(async () => {
  if (!userStore.userLogged.rol) {
    await userStore.getUserLogged();
  }
});
</script>

<template>
  <aside class="w-64 bg-white border-r border-gray-200 flex flex-col">
    <!-- Header -->
    <div class="p-6 border-b border-gray-200">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900">San Luis</h1>

      </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto py-6 px-3">
      <!-- Bienvenida -->
      <div class="mb-6">
        <h2 class="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Bienvenida</h2>
        <ul class="space-y-1">
          <li>
            <RouterLink :to="{'name':'home'}" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Inicio
            </RouterLink>
          </li>
        </ul>
      </div>

      <!-- Gestión Section (Solo para coordinadores y rector) -->
      <div v-if="esDirectivo" class="mb-6">
        <h2 class="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gestión</h2>
        <ul class="space-y-1">
          <li>
            <RouterLink :to="{'name':'sedes'}" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Sedes
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{'name':'directivos'}" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Directivos
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{'name':'usuarios'}" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Docentes
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{'name':'areas'}" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Áreas académicas
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{'name':'publicaciones'}" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Publicaciones
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{'name':'periodos'}" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Periodos academicos
            </RouterLink>
          </li>
        </ul>
      </div>

      <!-- APPS Section -->
      <div class="mb-6">
        <h2 class="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Planeación</h2>
        <ul class="space-y-1">
          <li>
            <RouterLink :to="{'name':'planeaciones'}" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Planeaciones
            </RouterLink>
          </li>
          <li v-if="!esDirectivo">
            <RouterLink :to="{'name':'home'}" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Cronograma individual
            </RouterLink>
          </li>
          <li v-if="!esDirectivo">
            <RouterLink :to="{'name':'observador'}" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Observador del estudiante
            </RouterLink>
          </li>
          <li v-if="!esDirectivo">
            <RouterLink :to="{'name':'proyectos'}" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              Proyectos pedagógicos
            </RouterLink>
          </li>

        </ul>
      </div>

      <!-- Informativo Section -->
      <div class="mb-6">
        <h2 class="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Informativo</h2>
        <ul class="space-y-1">
          <li>
            <RouterLink :to="{'name':'planeaciones_destacadas'}" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              Planeaciones destacadas
            </RouterLink>
          </li>
          <li v-if="!esDirectivo">
            <RouterLink :to="{'name':'all_publicaciones'}" class="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition">
              <svg class="w-5 h-5 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Publicaciones
            </RouterLink>
          </li>
        </ul>
      </div>

    </nav>
  </aside>
</template>

<style scoped>

</style>