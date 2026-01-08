import { defineStore } from 'pinia'
import { ref, reactive } from 'vue'
import { loginService } from '../services/loginService.js'
import { userService } from '../services/userService.js'
import { authService } from '../services/auth.js'
import { useRouter } from 'vue-router'

export const useLoginStore = defineStore('login', () => {
    const data = reactive({
        username: '',
        password: ''
    });

    const router = useRouter();

    const showError = ref(false);
    const isLoading = ref(false);


    async function ingresar() {
        try {
            showError.value = false;
            isLoading.value = true;

            // 1. Autenticar y obtener token
            const response = await loginService.login(data);
            await authService.setToken(response.access_token);

            // 2. Obtener información completa del usuario (incluyendo rol)
            const userInfo = await userService.getInfoUserLogged(data.username);

            // 3. Guardar la información completa del usuario
            await authService.setUser({
                email: userInfo.email,
                nombre_completo: userInfo.nombre_completo,
                cedula: userInfo.cedula,
                rol: userInfo.rol,
                activo: userInfo.activo,
                telefono: userInfo.telefono,
                asignaturas: userInfo.asignaturas || []
            });

            // 4. Redireccionar al home
            await router.push('/home');

            // 5. Limpiar formulario
            Object.assign(data, {
                username: '',
                password: '',
            });

        } catch (error) {
            showError.value = true;
            console.error('Error en login:', error.response?.data || error.message);
        } finally {
            isLoading.value = false;
        }
    }

    async function test() {
        try {
            const response = await loginService.test();
            console.log(response)
        } catch (error) {
            console.error('No hay info:', error.response?.data || error.message);
        }
    }



    return {
        data,
        showError,
        isLoading,
        ingresar,
        test
    }
});