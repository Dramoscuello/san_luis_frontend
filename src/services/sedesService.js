import api from "@/lib/axios.js";

export const sedesService = {
    async getSedes() {
        try {
            const {data} = await api.get('/sedes');
            return data;
        }
        catch (error) {
            throw error;
        }
    },

    async updateSede(obj) {
        try{
            const response  = await api.patch(`sedes/${obj.id}`, obj);
            return response;
        }catch(e){
            throw e;
        }
    }
}