import api from "@/lib/axios.js";

export const userService = {
    async getInfoUserLogged(username) {
        try {
            const {data} = await api.get(`/user/whoami/${username}`);
            return data;
        } catch (error) {
            throw error;
        }
    },

    async getUsers(){
        try {
            const response = await api.get('/user/all');
            return response;
        }catch(error){
            throw error;
        }
    },

    async updateUser(obj){
        //delete obj.sede_nombre;
        try{
            const response  = await api.patch(`/user/${obj.id}`, obj);
            return response;
        }catch(e){
            throw e;
        }
    },

    async deleteUser(id){
        try {
            const response = await api.delete(`/user/${id}`);
            return response;
        }catch (e) {
            throw e;
        }
    }
}