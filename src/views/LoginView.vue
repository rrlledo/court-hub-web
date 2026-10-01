<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { useAuthStore } from '@/stores/auth'

const router = useRouter(); const auth = useAuthStore()
const email = ref(''); const password = ref(''); const twoFactorCode = ref(''); const needsTwoFactor = ref(false); const error = ref(''); const loading = ref(false)
const schema = z.object({ email: z.string().email('Enter a valid email address.'), password: z.string().min(1, 'Password is required.') })
async function submit() {
  error.value = ''; const result = schema.safeParse({ email: email.value, password: password.value })
  if (!result.success) { error.value = result.error.issues[0].message; return }
  loading.value = true
  try { await auth.login(email.value, password.value, twoFactorCode.value); router.push('/') }
  catch (caught: any) { const message = caught.response?.data?.message ?? 'Unable to sign in. Check your API and credentials.'; needsTwoFactor.value = /two-factor authentication code/i.test(message); error.value = message }
  finally { loading.value = false }
}
async function socialLogin() {
  loading.value = true; error.value = ''
  try { await auth.loginWithMockSocial('google', twoFactorCode.value); router.push('/') }
  catch (caught: any) { error.value = caught.response?.data?.message ?? 'Mock social sign-in is unavailable. Seed demo data first.' }
  finally { loading.value = false }
}
</script>

<template><main class="login-page"><section class="login-panel"><div class="brand"><span class="brand-mark">C</span> Court Hub</div><p class="eyebrow">FACILITY OPERATIONS</p><h1>Welcome back.</h1><p class="muted">Sign in to manage your courts, bookings, and members.</p><form @submit.prevent="submit"><label>Email<input v-model="email" type="email" autocomplete="email" /></label><label>Password<input v-model="password" type="password" autocomplete="current-password" /></label><label v-if="needsTwoFactor">Authenticator code<input v-model="twoFactorCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="6-digit code" /></label><p v-if="needsTwoFactor" class="muted">Enter the current code from your authenticator app.</p><p v-if="error" class="form-error">{{ error }}</p><button class="primary-button" :disabled="loading">{{ loading ? 'Signing in…' : needsTwoFactor ? 'Verify and sign in' : 'Sign in' }}</button></form><button class="secondary-button social-signin" :disabled="loading" @click="socialLogin">Sign in with Google (local mock)</button><p class="login-note">Uses the seeded demo player and never contacts Google. · <RouterLink to="/forgot-password">Forgot password?</RouterLink> · <RouterLink to="/register">Create facility account</RouterLink></p></section><section class="login-art"><div><p class="eyebrow">COURT HUB</p><h2>Everything your facility needs to keep play moving.</h2><p>Reservations, memberships, coaching, tournaments, rentals, payments, and reporting—all in one place.</p></div></section></main></template>
