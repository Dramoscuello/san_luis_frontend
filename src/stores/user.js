import {defineStore} from "pinia";
import {reactive, ref} from "vue";
import {userService} from "@/services/userService.js";
import {authService} from "@/services/auth.js";
import {sedesService} from "@/services/sedesService.js";


export const useUserStore = defineStore("user", () => {
    const userLogged = reactive({
        email : '',
        nombre_completo: '',
        cedula : '',
        rol: '',
        activo: true,
        telefono: ''
    });

    const user = reactive({
        id:null,
        email: '',
        nombre_completo: '',
        cedula: '',
        rol:'',
        activo: true,
        telefono: '',
        sede_id:null,
        sede_nombre:''
    });

    const users = ref([]);

    async function getUserLogged(){
        try{
            const username = await authService.getUser()
            const response = await userService.getInfoUserLogged(username)
            userLogged.email = response.email;
            userLogged.nombre_completo = response.nombre_completo;
            userLogged.cedula = response.cedula;
            userLogged.rol = response.rol;
            userLogged.activo = Boolean(response.activo);
            userLogged.telefono = response.telefono;
        }catch(err){
            console.log(err);
        }
    }

    async function getUsers(){
        try{
            const {data} = await userService.getUsers();
            console.log(data);
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

    async function updateUser(){
        try{
            await userService.updateUser(user);
            const i =  users.value.findIndex(item=> item.id === user.id);

            if (i > -1){
                users.value[i].activo = user.activo;
                users.value[i].nombre_completo = user.nombre_completo;
                users.value[i].email = user.email;
                users.value[i].telefono = user.telefono;
                users.value[i].rol = user.rol;
                users.value[i].sede_id = user.sede_id;
                users.value[i].sede_nombre = user.sede_nombre;
                users.value[i].cedula = user.cedula;
            }
        }catch(e){
            throw e;
        }
    }


    async function deleteUser(id){
        try{
            await userService.deleteUser(id);
            const i =  users.value.findIndex(item=> item.id === id);
            if (i > -1){
                users.value.splice(i, 1);
            }
        }catch(e){
            throw e;
        }
    }


    return {
        userLogged,
        getUserLogged,
        getUsers,
        users,
        updateUserEstado,
        user,
        updateUser,
        deleteUser
    }
});