<script setup>
import {useLoginStore} from "@/stores/login.js";

const loginStore = useLoginStore();


const handleSubmit = ()=>{
  //TODO
  loginStore.ingresar();
}

</script>

<template>
  <div class="bg-gray-100 min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Mensaje de error -->
      <div
          v-if="loginStore.showError"
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 shadow-sm"
      >
        <p class="font-medium">❌ Contraseña incorrecta</p>
        <p class="text-sm">Por favor, verifica tus credenciales e intenta nuevamente.</p>
      </div>

      <!-- Formulario de Login -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Escudo de la institución -->
        <div class="flex justify-center mb-6">
          <img src="@/assets/img.png" alt="Escudo de la institución" class="w-[40%] h-auto">
        </div>

        <!-- Título -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-700 mb-2">Iniciar Sesión</h1>
        </div>

        <!-- Formulario -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Campo Usuario -->
          <div>
            <label for="username" class="block text-sm font-medium text-gray-600 mb-2">
              Usuario
            </label>
            <input
                type="text"
                id="username"
                name="username"
                v-model="loginStore.data.username"
                required
                class="w-full px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent transition duration-200"
                placeholder="Ingresa tu usuario"
            >
          </div>

          <!-- Campo Contraseña -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-600 mb-2">
              Contraseña
            </label>
            <input
                type="password"
                id="password"
                name="password"
                v-model="loginStore.data.password"
                required
                class="w-full px-4 py-3 bg-green-50 border border-green-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-transparent transition duration-200"
                placeholder="Ingresa tu contraseña"
            >
          </div>

          <!-- Botón de Submit -->
          <button
              type="submit"
              class="w-full bg-gradient-to-r from-blue-400 to-green-400 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-500 hover:to-green-500 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 transition duration-200 shadow-md"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>