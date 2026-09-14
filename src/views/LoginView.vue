<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'

const router = useRouter(); const auth = useAuthStore()
const email = ref(''); const password = ref(''); const error = ref(''); const loading = ref(false)
const schema = z.object({ email: z.string().email('Enter a valid email address.'), password: z.string().min(1, 'Password is required.') })
async function submit() {
  error.value = ''; const result = schema.safeParse({ email: email.value, password: password.value })
  if (!result.success) { error.value = result.error.issues[0].message; return }
  loading.value = true
  try { await auth.login(email.value, password.value); router.push('/') }
  catch (caught: any) { error.value = caught.response?.data?.message ?? 'Unable to sign in. Check your API and credentials.' }
  finally { loading.value = false }
}
</script>

<template><main class="login-page"><section class="login-panel"><div class="brand"><span class="brand-mark">C</span> Court Hub</div><p class="eyebrow">FACILITY OPERATIONS</p><h1>Welcome back.</h1><p class="muted">Sign in to manage your courts, bookings, and members.</p><form @submit.prevent="submit"><label>Email<input v-model="email" type="email" autocomplete="email" /></label><label>Password<input v-model="password" type="password" autocomplete="current-password" /></label><p v-if="error" class="form-error">{{ error }}</p><button class="primary-button" :disabled="loading">{{ loading ? 'Signing in…' : 'Sign in' }}</button></form><p class="login-note"><RouterLink to="/forgot-password">Forgot password?</RouterLink> · <RouterLink to="/register">Create facility account</RouterLink></p></section><section class="login-art"><div><p class="eyebrow">COURT HUB</p><h2>Everything your facility needs to keep play moving.</h2><p>Reservations, memberships, coaching, tournaments, rentals, payments, and reporting—all in one place.</p></div></section></main></template>
