<script setup>

import Header from "@/components/Header.vue";
import Sidebar from "@/components/Sidebar.vue";



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
        <h1 class="text-3xl font-bold text-gray-900 mb-6 uppercase">sedes</h1>
      </div>
    </main>
  </div>
</template>