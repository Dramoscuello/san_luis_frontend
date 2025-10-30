import {defineStore} from "pinia";
import {reactive, ref} from "vue";
import {userService} from "@/services/userService.js";
import {authService} from "@/services/auth.js";
import {sedesService} from "@/services/sedesService.js";


export const useUserStore = defineStore("user", () => {
    const user = reactive({
        email : '',
        nombre_completo: '',
        cedula : '',
        rol: '',
        activo: true,
        telefono: ''
    });

    const users = ref([]);

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

    async function getUsers(){
        try{
            const {data} = await userService.getUsers();
            users.value = data;
        }catch(err){
            throw err;
        }
    }

    async function updateUserEstado(obj){
        try{
            await userService.updateUser(obj);
            const i =  users.value.findIndex(item=> item.id === obj.id);

            if (i > -1){
                users.value[i].activo = obj.activo;
            }
        }catch(e){
            throw e;
        }
    }


    return {
        user,
        getUserLogged,
        getUsers,
        users,
        updateUserEstado,
    }
});