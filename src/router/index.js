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

        {
            path: '/home',
            name: 'home',
            component: () => import('../views/HomeView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/usuarios',
            name: 'usuarios',
            component: () => import('../views/UsersView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/directivos',
            name: 'directivos',
            component: () => import('../views/DirectivosView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/sedes',
            name: 'sedes',
            component: () => import('../views/SedesView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/publicaciones',
            name: 'publicaciones',
            component: () => import('../views/PublicacionesView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/areas',
            name: 'areas',
            component: () => import('../views/AreasView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/asignaturas',
            name: 'asignaturas',
            component: () => import('../views/AsignaturasView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/grados',
            name: 'grados',
            component: () => import('../views/HomeView.vue'), // Placeholder
            meta: { requiresAuth: true }
        },
        {
            path: '/grupos',
            name: 'grupos',
            component: () => import('../views/HomeView.vue'), // Placeholder
            meta: { requiresAuth: true }
        },
        {
            path: '/estudiantes',
            name: 'estudiantes',
            component: () => import('../views/HomeView.vue'), // Placeholder
            meta: { requiresAuth: true }
        },
        {
            path: '/periodos',
            name: 'periodos',
            component: () => import('../views/PeriodosView.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/login',
            redirect: '/'
        }

    ],
});

// Navigation Guard
router.beforeEach((to, from, next) => {
    const isAuthenticated = authService.isAuthenticated();

    // Ruta requiere autenticación
    if (to.meta.requiresAuth && !isAuthenticated) {
        next('/login');
    }
    // Usuario autenticado intenta acceder a login
    else if (to.meta.requiresGuest && isAuthenticated) {
        next('/home');
    }
    // Continuar normalmente
    else {
        next();
    }
});

export default router
