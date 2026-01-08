import { createRouter, createWebHistory } from 'vue-router'
import LoginView from "@/views/LoginView.vue";
import { authService } from "@/services/auth.js";

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            name: 'login',
            component: LoginView,
            meta: { requiresGuest: true }
        },

        // ============================================
        // RUTAS PARA TODOS LOS USUARIOS AUTENTICADOS
        // ============================================
        {
            path: '/home',
            name: 'home',
            component: () => import('../views/HomeView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/planeaciones',
            name: 'planeaciones',
            component: () => import('../views/PlaneacionesView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/planeaciones-destacadas',
            name: 'planeaciones_destacadas',
            component: () => import('../views/PlaneacionesDestacadasView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/all-publicaciones',
            name: 'all_publicaciones',
            component: () => import('../views/AllPublicacionesView.vue'),
            meta: { requiresAuth: true }
        },

        // ============================================
        // RUTAS SOLO PARA DOCENTES
        // ============================================
        {
            path: '/mis-planeaciones',
            name: 'mis_planeaciones',
            component: () => import('../views/MisPlaneacionesView.vue'),
            meta: { requiresAuth: true, roles: ['docente'] }
        },

        // ============================================
        // RUTAS SOLO PARA DIRECTIVOS (Coordinador/Rector)
        // ============================================
        {
            path: '/usuarios',
            name: 'usuarios',
            component: () => import('../views/UsersView.vue'),
            meta: { requiresAuth: true, roles: ['coordinador', 'rector'] }
        },
        {
            path: '/directivos',
            name: 'directivos',
            component: () => import('../views/DirectivosView.vue'),
            meta: { requiresAuth: true, roles: ['coordinador', 'rector'] }
        },
        {
            path: '/detalle-docente/:id',
            name: 'detalle_docente',
            component: () => import('../views/DetalleDocenteView.vue'),
            meta: { requiresAuth: true, roles: ['coordinador', 'rector'] }
        },
        {
            path: '/sedes',
            name: 'sedes',
            component: () => import('../views/SedesView.vue'),
            meta: { requiresAuth: true, roles: ['coordinador', 'rector'] }
        },
        {
            path: '/publicaciones',
            name: 'publicaciones',
            component: () => import('../views/PublicacionesView.vue'),
            meta: { requiresAuth: true, roles: ['coordinador', 'rector'] }
        },
        {
            path: '/areas',
            name: 'areas',
            component: () => import('../views/AreasView.vue'),
            meta: { requiresAuth: true, roles: ['coordinador', 'rector'] }
        },
        {
            path: '/asignaturas',
            name: 'asignaturas',
            component: () => import('../views/AsignaturasView.vue'),
            meta: { requiresAuth: true, roles: ['coordinador', 'rector'] }
        },
        {
            path: '/grados',
            name: 'grados',
            component: () => import('../views/HomeView.vue'), // Placeholder
            meta: { requiresAuth: true, roles: ['coordinador', 'rector'] }
        },
        {
            path: '/grupos',
            name: 'grupos',
            component: () => import('../views/HomeView.vue'), // Placeholder
            meta: { requiresAuth: true, roles: ['coordinador', 'rector'] }
        },
        {
            path: '/estudiantes',
            name: 'estudiantes',
            component: () => import('../views/HomeView.vue'), // Placeholder
            meta: { requiresAuth: true, roles: ['coordinador', 'rector'] }
        },
        {
            path: '/periodos',
            name: 'periodos',
            component: () => import('../views/PeriodosView.vue'),
            meta: { requiresAuth: true, roles: ['coordinador', 'rector'] }
        },

        // ============================================
        // RUTA DE ACCESO DENEGADO
        // ============================================
        {
            path: '/acceso-denegado',
            name: 'acceso_denegado',
            component: () => import('../views/AccesoDenegadoView.vue'),
            meta: { requiresAuth: true }
        },

        // ============================================
        // REDIRECCIONES
        // ============================================
        {
            path: '/login',
            redirect: '/'
        },
        // Ruta catch-all para rutas no encontradas
        {
            path: '/:pathMatch(.*)*',
            name: 'not_found',
            redirect: '/home'
        }

    ],
});

// Navigation Guard
router.beforeEach((to, from, next) => {
    const isAuthenticated = authService.isAuthenticated();
    const userRole = authService.getUserRole();

    // Ruta requiere autenticación y usuario no está autenticado
    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login');
        return;
    }

    // Usuario autenticado intenta acceder a login
    if (to.meta.requiresGuest && isAuthenticated) {
        next('/home');
        return;
    }

    // Verificar roles si la ruta tiene restricción de roles
    if (to.meta.roles && to.meta.roles.length > 0) {
        if (!userRole || !to.meta.roles.includes(userRole)) {
            // Usuario no tiene el rol requerido
            next({ name: 'acceso_denegado' });
            return;
        }
    }

    // Continuar normalmente
    next();
});

export default router
