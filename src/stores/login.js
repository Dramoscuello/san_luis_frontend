import {defineStore} from 'pinia'
import {ref, reactive} from 'vue'
import {loginService} from '../services/loginService.js'
import {authService} from '../services/auth.js'
import {useRouter} from 'vue-router'

export const useLoginStore = defineStore('login', ()=>{
    const data = reactive({
        username: '',
        password: ''
    });

    const router = useRouter();

    const showError = ref(false);


    async function ingresar() {
        try {
            showError.value = false;
            const response = await loginService.login(data);


            authService.setToken(response.access_token);

            //console.log('Token recibido:', response.access_token);
            //console.log('Login exitoso');
            await router.push('/home');
            Object.assign(data, {
                username: '',
                password: '',
            });

        } catch (error) {
            showError.value = true;
            console.error('Error en login:', error.response?.data || error.message);
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
        ingresar,
        test
    }
});