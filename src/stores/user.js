import {defineStore} from "pinia";
import {reactive} from "vue";
import {userService} from "@/services/userService.js";
import {authService} from "@/services/auth.js";


export const useUserStore = defineStore("user", () => {
    const user = reactive({
        email : '',
        nombre_completo: '',
        cedula : '',
        rol: '',
        activo: true,
        telefono: ''
    });

    async function getUserLogged(){
        try{
            const username = await authService.getUser()
            const response = await userService.getInfoUserLogged(username)
            user.email = response.email;
            user.nombre_completo = response.nombre_completo;
            user.cedula = response.cedula;
            user.rol = response.rol;
            user.activo = Boolean(response.activo);
            user.telefono = response.telefono;
        }catch(err){
            console.log(err);
        }
    }


    return {
        user,
        getUserLogged
    }
});