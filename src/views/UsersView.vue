<script setup>

import Sidebar from "@/components/Sidebar.vue";
import Header from "@/components/Header.vue";
import {useSedesStore} from "@/stores/sedes.js";


const stateSedes = useSedesStore();

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
      <div class="p-8" id="panel-users">
        <!-- Fila con 3 columnas -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <!-- Columna 1: Select -->
          <div>
            <label for="filter-sedes" class="block text-sm font-medium text-black mb-2 uppercase">
              Filtrar por sedes
            </label>
            <form>
              <select id="filter-sedes" class="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition duration-200 text-gray-700 font-medium cursor-pointer hover:border-gray-400">
                <option value="">Seleccione...</option>
                <option v-for="sede in stateSedes.sedes"
                        :value="sede.id"
                >
                  {{sede.nombre}}
                </option>
              </select>
            </form>
          </div>

          <!-- Columna 2: Botón Crear Usuario -->
          <div>
            <button class="w-full bg-gradient-to-r from-blue-400 to-green-400 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-500 hover:to-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition duration-200 shadow-md">
              Crear usuario
            </button>
          </div>

          <!-- Columna 3: Botón Creación Masiva -->
          <div>
            <button class="w-full bg-gradient-to-r from-blue-400 to-green-400 text-white font-semibold py-2 px-4 rounded-lg hover:from-blue-500 hover:to-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition duration-200 shadow-md">
              Creación masiva
            </button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>

</style>