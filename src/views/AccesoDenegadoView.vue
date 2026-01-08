<script setup>
/**
 * ============================================
 * VISTA DE ACCESO DENEGADO
 * ============================================
 * Se muestra cuando un usuario intenta acceder
 * a una ruta para la cual no tiene permisos
 */

import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import Button from 'primevue/button';
import { useRouter } from 'vue-router';

const router = useRouter();

const volverAlInicio = () => {
  router.push({ name: 'home' });
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
      <div class="p-8 flex items-center justify-center h-[calc(100vh-80px)]">
        <div class="text-center max-w-md">
          <!-- Icono de bloqueo -->
          <div class="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i class="pi pi-lock text-5xl text-red-500"></i>
          </div>

          <!-- Título -->
          <h1 class="text-3xl font-bold text-gray-800 mb-3">
            Acceso Denegado
          </h1>

          <!-- Descripción -->
          <p class="text-gray-500 mb-6">
            No tienes permisos para acceder a esta sección. 
            Si crees que esto es un error, contacta al administrador del sistema.
          </p>

          <!-- Código de error -->
          <div class="bg-gray-100 rounded-lg px-4 py-2 inline-block mb-6">
            <span class="text-gray-500 text-sm font-mono">Error 403 - Forbidden</span>
          </div>

          <!-- Botón para volver -->
          <div>
            <Button
              label="Volver al inicio"
              icon="pi pi-home"
              severity="primary"
              @click="volverAlInicio"
              class="px-6"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
</style>
