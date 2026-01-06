# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start development server with hot-reload
npm run build    # Build for production
npm run preview  # Preview production build
```

## Tech Stack

- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **Build Tool**: Vite 7
- **State Management**: Pinia
- **Routing**: Vue Router 4
- **UI Components**: PrimeVue with Aura theme
- **HTTP Client**: Axios
- **Styling**: TailwindCSS + PostCSS
- **Icons**: PrimeIcons

## Architecture

### API Layer (`src/lib/axios.js`)
Centralized Axios instance configured with:
- Base URL: `http://localhost:8000`
- Request interceptor: Automatically attaches JWT token from `authService`
- Response interceptor: Handles 401 errors by clearing auth and redirecting to login

### Authentication (`src/services/auth.js`)
`authService` manages JWT tokens and user data in localStorage:
- Token stored as `jwt_token`
- User stored as `user`
- Includes token expiration validation

### State Management Pattern
Pinia stores use the Composition API setup syntax. Each domain has:
- A **store** (`src/stores/`) for state and actions
- A **service** (`src/services/`) for API calls
- A **modal store** for managing modal dialog state (e.g., `modalSedes.js`, `modalUsers.js`)

### Routing (`src/router/index.js`)
Routes use meta fields for access control:
- `requiresAuth: true` - Protected routes (redirects to `/login` if not authenticated)
- `requiresGuest: true` - Login page (redirects to `/home` if authenticated)

### Path Alias
`@` is aliased to `src/` directory (configured in `vite.config.js`)

## Backend API

The frontend expects a backend running at `http://localhost:8000` with these endpoints:
- `POST /login` - Authentication
- `/sedes` - CRUD for locations (sedes)
- `/user` - CRUD for users
