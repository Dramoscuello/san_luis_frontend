import { defineStore } from "pinia";
import { reactive, ref } from "vue";
import { userService } from "@/services/userService.js";
import { authService } from "@/services/auth.js";


export const useUserStore = defineStore("user", () => {
    const userLogged = reactive({
        email: '',
        nombre_completo: '',
        cedula: '',
        rol: '',
        activo: true,
        telefono: '',
        asignaturas: []
    });

    const user = reactive({
        id: null,
        email: '',
        nombre_completo: '',
        cedula: '',
        rol: '',
        activo: true,
        telefono: '',
        sede_id: null,
        sede_nombre: '',
        password: null
    });

    const users = ref([]);

    async function getUserLogged() {
        try {
            const user = authService.getUser();
            if (!user?.cedula) {
                console.error('No se encontró usuario en localStorage');
                return;
            }
            const response = await userService.getInfoUserLogged(user.cedula)
            userLogged.email = response.email;
            userLogged.nombre_completo = response.nombre_completo;
            userLogged.cedula = response.cedula;
            userLogged.rol = response.rol;
            userLogged.activo = Boolean(response.activo);
            userLogged.telefono = response.telefono;
            userLogged.asignaturas = response.asignaturas || [];
        } catch (err) {
            console.log(err);
        }
    }

    async function getUsers() {
        try {
            const { data } = await userService.getUsers();
            users.value = data;
        } catch (err) {
            throw err;
        }
    }

    async function updateUserEstado(obj) {
        try {
            await userService.updateUser(obj);
            const i = users.value.findIndex(item => item.id === obj.id);

            if (i > -1) {
                users.value[i].activo = obj.activo;
            }
        } catch (e) {
            throw e;
        }
    }

    async function updateUser() {
        try {
            // Crear una copia plana del objeto user para evitar problemas de reactividad
            const userDataToSend = { ...user };

            // Eliminar campos que no deben enviarse al backend o que son solo de vista
            delete userDataToSend.password;
            delete userDataToSend.sede_nombre;
            delete userDataToSend.asignaturas; // Nuevo campo agregado para vista

            // Asegurar que sede_id sea null si no tiene valor
            if (!userDataToSend.sede_id) {
                userDataToSend.sede_id = null;
            }

            // Llamar al servicio con el objeto limpio
            await userService.updateUser(userDataToSend);

            const i = users.value.findIndex(item => item.id === user.id);

            if (i > -1) {
                users.value[i].activo = user.activo;
                users.value[i].nombre_completo = user.nombre_completo;
                users.value[i].email = user.email;
                users.value[i].telefono = user.telefono;
                users.value[i].rol = user.rol;
                users.value[i].sede_id = user.sede_id;
                users.value[i].sede_nombre = user.sede_nombre;
                users.value[i].cedula = user.cedula;
            }

            // Actualizar también la lista de directivos si existe
            const j = directivos.value.findIndex(item => item.id === user.id);
            if (j > -1) {
                Object.assign(directivos.value[j], {
                    activo: user.activo,
                    nombre_completo: user.nombre_completo,
                    email: user.email,
                    telefono: user.telefono,
                    rol: user.rol,
                    sede_id: user.sede_id,
                    cedula: user.cedula
                });
            }

            // Actualizar lista de docentes
            const k = docentes.value.findIndex(item => item.id === user.id);
            if (k > -1) {
                Object.assign(docentes.value[k], {
                    activo: user.activo,
                    nombre_completo: user.nombre_completo,
                    email: user.email,
                    telefono: user.telefono,
                    rol: user.rol,
                    sede_id: user.sede_id,
                    sede_nombre: user.sede_nombre,
                    cedula: user.cedula,
                    // Si se actualizan asignaturas/grupos, también deberían refrescarse aquí
                    // Pero updateUser solo envía info plana. Para refrescar relaciones complejas mejor recargar.
                });
            }
        } catch (e) {
            throw e;
        }
    }


    async function deleteUser(id) {
        try {
            await userService.deleteUser(id);
            const i = users.value.findIndex(item => item.id === id);
            if (i > -1) {
                users.value.splice(i, 1);
            }
        } catch (e) {
            throw e;
        }
    }
    async function createUser() {
        try {
            const { data } = await userService.createUser(user);
            user.password = null;
            data.sede_nombre = user.sede_nombre;
            users.value.push(data);
        } catch (e) {
            throw e;
        }
    }

    function resetUser() {
        user.id = null;
        user.email = '';
        user.nombre_completo = '';
        user.cedula = '';
        user.rol = '';
        user.activo = true;
        user.telefono = '';
        user.sede_id = null;
        user.sede_nombre = '';
        user.password = null;
    }



    const directivos = ref([]);
    const docentes = ref([]); // Nuevo

    async function getDirectivos() {
        try {
            const data = await userService.getDirectivos();
            directivos.value = data;
        } catch (err) {
            throw err;
        }
    }

    async function getDocentes() {
        try {
            const data = await userService.getDocentes();
            docentes.value = data;
        } catch (err) {
            throw err;
        }
    }

    return {
        userLogged,
        getUserLogged,
        getUsers,
        users,
        directivos,
        docentes, // Nuevo
        getDirectivos,
        getDocentes, // Nuevo
        updateUserEstado,
        user,
        updateUser,
        deleteUser,
        createUser,
        resetUser
    }
});