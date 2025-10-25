<script setup>
import {onMounted} from "vue";
import {useLoginStore} from "@/stores/login.js";
import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";
const loginStore = useLoginStore();

onMounted(() => {
  loginStore.test();
});
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
        <h1 class="text-3xl font-bold text-gray-900 mb-6">Dashboard Content</h1>
        <p class="text-gray-600">Aquí va el contenido principal de tu aplicación.</p>
      </div>
    </main>
  </div>
</template>


<style scoped>
/* Estilos adicionales si los necesitas */
</style>