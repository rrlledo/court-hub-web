<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const publicRoute = computed(() => route.meta.public)
const menuOpen = ref(false)
const isSuperAdmin = computed(() => auth.user?.roles?.includes('super-admin') ?? false)

const navigation = [
  ['dashboard', 'Overview', '/'], ['bookings', 'Bookings', '/bookings'], ['facilities', 'Facilities', '/facilities'],
  ['memberships', 'Memberships', '/memberships'], ['users', 'Staff & Members', '/users'], ['payments', 'Payments', '/payments'], ['operations', 'Operations', '/operations'], ['coaching', 'Coaching', '/coaching'], ['tournaments', 'Tournaments', '/tournaments'],
  ['rentals', 'Rentals', '/rentals'], ['front-desk', 'Front Desk', '/front-desk'], ['reports', 'Reports', '/reports'], ['notifications', 'Notifications', '/notifications'], ['settings', 'Settings', '/settings'], ['administration', 'Administration', '/administration'], ['super-admin', 'Platform Admin', '/super-admin'],
]
const visibleNavigation = computed(() => isSuperAdmin.value
  ? navigation.filter(([key]) => key === 'super-admin')
  : navigation.filter(([key]) => key !== 'super-admin'))

onMounted(() => auth.hydrate())
function logout() { auth.clearSession(); router.push('/login') }
function closeMenu() { menuOpen.value = false }
</script>

<template>
  <RouterView v-if="publicRoute" />
  <main v-else class="app-shell">
    <aside class="sidebar">
      <div class="sidebar-top"><RouterLink class="brand" to="/" @click="closeMenu"><span class="brand-mark">C</span><span>Court Hub</span></RouterLink><button class="menu-toggle" type="button" :aria-expanded="menuOpen" aria-controls="primary-navigation" @click="menuOpen = !menuOpen">{{ menuOpen ? 'Close' : 'Menu' }}</button></div>
      <p class="workspace-label">OPERATIONS</p>
      <nav id="primary-navigation" :class="{ 'menu-open': menuOpen }"><RouterLink v-for="([key, label, path]) in visibleNavigation" :key="key" :to="path" @click="closeMenu">{{ label }}</RouterLink></nav>
      <div class="sidebar-footer"><span>{{ auth.user?.name ?? 'Loading profile…' }}</span><button class="link-button" @click="logout">Sign out</button></div>
    </aside>
    <section class="content"><RouterView /></section>
  </main>
</template>
