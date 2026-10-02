import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import LoginView from '@/views/LoginView.vue'
import ModuleView from '@/views/ModuleView.vue'
import BookingsView from '@/views/BookingsView.vue'
import FacilitiesView from '@/views/FacilitiesView.vue'
import MembershipsView from '@/views/MembershipsView.vue'
import UsersView from '@/views/UsersView.vue'
import RentalsView from '@/views/RentalsView.vue'
import PaymentsView from '@/views/PaymentsView.vue'
import SettingsView from '@/views/SettingsView.vue'
import CoachingView from '@/views/CoachingView.vue'
import TournamentsView from '@/views/TournamentsView.vue'
import FacilityOperationsView from '@/views/FacilityOperationsView.vue'
import ReportsView from '@/views/ReportsView.vue'
import NotificationsView from '@/views/NotificationsView.vue'
import FrontDeskView from '@/views/FrontDeskView.vue'
import AdministrationView from '@/views/AdministrationView.vue'
import SuperAdminView from '@/views/SuperAdminView.vue'
import RegisterView from '@/views/RegisterView.vue'
import ForgotPasswordView from '@/views/ForgotPasswordView.vue'
import ResetPasswordView from '@/views/ResetPasswordView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { public: true } },
    { path: '/forgot-password', name: 'forgot-password', component: ForgotPasswordView, meta: { public: true } },
    { path: '/reset-password', name: 'reset-password', component: ResetPasswordView, meta: { public: true } },
    { path: '/', name: 'dashboard', component: DashboardView },
    { path: '/bookings', name: 'bookings', component: BookingsView },
    { path: '/facilities', name: 'facilities', component: FacilitiesView },
    { path: '/memberships', name: 'memberships', component: MembershipsView },
    { path: '/users', name: 'users', component: UsersView },
    { path: '/rentals', name: 'rentals', component: RentalsView },
    { path: '/payments', name: 'payments', component: PaymentsView },
    { path: '/settings', name: 'settings', component: SettingsView },
    { path: '/coaching', name: 'coaching', component: CoachingView },
    { path: '/tournaments', name: 'tournaments', component: TournamentsView },
    { path: '/operations', name: 'operations', component: FacilityOperationsView },
    { path: '/reports', name: 'reports', component: ReportsView },
    { path: '/notifications', name: 'notifications', component: NotificationsView },
    { path: '/front-desk', name: 'front-desk', component: FrontDeskView },
    { path: '/administration', name: 'administration', component: AdministrationView },
    { path: '/super-admin', name: 'super-admin', component: SuperAdminView },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (auth.isAuthenticated && !auth.user) await auth.hydrate()
  if (!to.meta.public && !auth.isAuthenticated) return { name: 'login' }
  if (to.meta.public && auth.isAuthenticated) return { name: 'dashboard' }

  const isSuperAdmin = auth.user?.roles?.includes('super-admin') ?? false
  if (isSuperAdmin && to.name !== 'super-admin') return { name: 'super-admin' }
  if (!isSuperAdmin && to.name === 'super-admin') return { name: 'dashboard' }
})

export default router
