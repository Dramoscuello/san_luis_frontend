import Axios from "axios";
import {authService} from "@/services/auth.js";
import {useRouter} from "vue-router";

const router = useRouter();



const api = Axios.create({
    baseURL : 'http://localhost:8000',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});


// Interceptor para agregar el token a cada petición
api.interceptors.request.use(
    (config) => {
        const token = authService.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token inválido o expirado
            authService.removeToken();
            router.push('/login');
        }
        return Promise.reject(error);
    }
);


export default api;