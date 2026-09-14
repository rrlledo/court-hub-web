<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const publicRoute = computed(() => route.meta.public)

const navigation = [
  ['dashboard', 'Overview', '/'], ['bookings', 'Bookings', '/bookings'], ['facilities', 'Facilities', '/facilities'],
  ['memberships', 'Memberships', '/memberships'], ['users', 'Staff & Members', '/users'], ['payments', 'Payments', '/payments'], ['operations', 'Operations', '/operations'], ['coaching', 'Coaching', '/coaching'], ['tournaments', 'Tournaments', '/tournaments'],
  ['rentals', 'Rentals', '/rentals'], ['front-desk', 'Front Desk', '/front-desk'], ['reports', 'Reports', '/reports'], ['notifications', 'Notifications', '/notifications'], ['settings', 'Settings', '/settings'], ['administration', 'Administration', '/administration'],
]

onMounted(() => auth.hydrate())
function logout() { auth.clearSession(); router.push('/login') }
</script>

<template>
  <RouterView v-if="publicRoute" />
  <main v-else class="app-shell">
    <aside class="sidebar">
      <RouterLink class="brand" to="/"><span class="brand-mark">C</span><span>Court Hub</span></RouterLink>
      <p class="workspace-label">OPERATIONS</p>
      <nav><RouterLink v-for="([key, label, path]) in navigation" :key="key" :to="path">{{ label }}</RouterLink></nav>
      <div class="sidebar-footer"><span>{{ auth.user?.name ?? 'Loading profile…' }}</span><button class="link-button" @click="logout">Sign out</button></div>
    </aside>
    <section class="content"><RouterView /></section>
  </main>
</template>
