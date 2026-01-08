import { defineStore } from "pinia";
import proyectosService from "@/services/proyectosService.js";

export const useProyectosStore = defineStore("proyectos", {
    state: () => ({
        proyectos: [],
        proyecto: {
            id: null,
            titulo: "",
            descripcion: "",
            objetivos: "",
            fecha_inicio: null,
            fecha_fin_estimada: null,
            archivo: null, // Para subidas
            nombre_archivo_original: "", // Para mostrar
            drive_view_link: "",
        },
        modoEdicion: false,
        loading: false,
        error: null,
    }),

    actions: {
        async getProyectos() {
            this.loading = true;
            try {
                const response = await proyectosService.getProyectos();
                this.proyectos = response.data;
            } catch (error) {
                this.error = error;
                console.error("Error cargando proyectos:", error);
            } finally {
                this.loading = false;
            }
        },

        async getProyecto(id) {
            this.loading = true;
            try {
                const response = await proyectosService.getProyecto(id);
                this.proyecto = response.data;
            } catch (error) {
                this.error = error;
                console.error("Error cargando proyecto:", error);
            } finally {
                this.loading = false;
            }
        },

        async crearProyecto() {
            this.loading = true;
            try {
                const formData = new FormData();
                formData.append("titulo", this.proyecto.titulo);
                formData.append("descripcion", this.proyecto.descripcion);
                if (this.proyecto.objetivos) {
                    formData.append("objetivos", this.proyecto.objetivos);
                }

                // Formatear fechas a YYYY-MM-DD si son objetos Date
                if (this.proyecto.fecha_inicio) {
                    const fi = new Date(this.proyecto.fecha_inicio);
                    formData.append("fecha_inicio", fi.toISOString().split('T')[0]);
                }
                if (this.proyecto.fecha_fin_estimada) {
                    const ff = new Date(this.proyecto.fecha_fin_estimada);
                    formData.append("fecha_fin_estimada", ff.toISOString().split('T')[0]);
                }

                if (this.proyecto.archivo) {
                    formData.append("archivo", this.proyecto.archivo);
                }

                const response = await proyectosService.crearProyecto(formData);
                this.proyectos.unshift(response.data); // Agregar al inicio
                this.resetProyecto();
                return response.data;
            } catch (error) {
                this.error = error;
                console.error("Error creando proyecto:", error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async actualizarProyecto() {
            this.loading = true;
            try {
                const formData = new FormData();
                formData.append("titulo", this.proyecto.titulo);
                formData.append("descripcion", this.proyecto.descripcion);
                if (this.proyecto.objetivos) {
                    formData.append("objetivos", this.proyecto.objetivos);
                }

                // Formatear fechas
                if (this.proyecto.fecha_inicio) {
                    // Si viene del backend es string, si lo editó el datepicker es Date
                    const fi = new Date(this.proyecto.fecha_inicio);
                    formData.append("fecha_inicio", fi.toISOString().split('T')[0]);
                }
                if (this.proyecto.fecha_fin_estimada) {
                    const ff = new Date(this.proyecto.fecha_fin_estimada);
                    formData.append("fecha_fin_estimada", ff.toISOString().split('T')[0]);
                }

                if (this.proyecto.archivo) {
                    formData.append("archivo", this.proyecto.archivo);
                }

                const response = await proyectosService.actualizarProyecto(this.proyecto.id, formData);

                // Actualizar en la lista local
                const index = this.proyectos.findIndex((p) => p.id === this.proyecto.id);
                if (index !== -1) {
                    this.proyectos[index] = response.data;
                }
                this.resetProyecto();
                return response.data;
            } catch (error) {
                this.error = error;
                console.error("Error actualizando proyecto:", error);
                throw error;
            } finally {
                this.loading = false;
            }
        },

        async eliminarProyecto(id) {
            // this.loading = true; // No bloquear toda la UI, manejar localmente si se prefiere
            try {
                await proyectosService.eliminarProyecto(id);
                this.proyectos = this.proyectos.filter((p) => p.id !== id);
            } catch (error) {
                this.error = error;
                console.error("Error eliminando proyecto:", error);
                throw error;
            } finally {
                // this.loading = false;
            }
        },

        setProyectoParaEditar(proyecto) {
            // Clonar para no mutar directamente el de la lista hasta guardar
            // Asegurarse de parsear las fechas para que el Calendar las lea bien
            this.proyecto = {
                ...proyecto,
                fecha_inicio: proyecto.fecha_inicio ? new Date(proyecto.fecha_inicio) : null,
                fecha_fin_estimada: proyecto.fecha_fin_estimada ? new Date(proyecto.fecha_fin_estimada) : null,
                archivo: null
            };
            this.modoEdicion = true;
        },

        resetProyecto() {
            this.proyecto = {
                id: null,
                titulo: "",
                descripcion: "",
                objetivos: "",
                fecha_inicio: null,
                fecha_fin_estimada: null,
                archivo: null,
                nombre_archivo_original: "",
                drive_view_link: "",
            };
            this.modoEdicion = false;
            this.error = null;
        },
    },
});
