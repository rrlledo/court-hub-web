import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/api/client'

export type CurrentUser = { id: number; name: string; email: string; roles?: string[] }

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('court-hub.token'))
  const user = ref<CurrentUser | null>(JSON.parse(localStorage.getItem('court-hub.user') ?? 'null'))
  const isAuthenticated = computed(() => Boolean(token.value))

  function setSession(nextToken: string, nextUser: CurrentUser) {
    token.value = nextToken
    user.value = nextUser
    localStorage.setItem('court-hub.token', nextToken)
    localStorage.setItem('court-hub.user', JSON.stringify(nextUser))
  }

  function clearSession() {
    token.value = null
    user.value = null
    localStorage.removeItem('court-hub.token')
    localStorage.removeItem('court-hub.user')
  }

  async function login(email: string, password: string, twoFactorCode = '') {
    const { data } = await api.post('/auth/login', { email, password, device_name: 'Court Hub Web', ...(twoFactorCode.trim() ? { two_factor_code: twoFactorCode.trim() } : {}) })
    const payload = data.data ?? data
    setSession(payload.token, payload.user)
    await hydrate()
  }

  async function loginWithMockSocial(provider: 'google' | 'apple' | 'facebook', twoFactorCode = '') {
    const { data } = await api.post(`/auth/social/${provider}`, {
      mock_subject: 'demo-google-player-one', email: 'demo.player1@court-hub.test', name: 'Demo Player One',
      device_name: 'Court Hub Web (mock social)', ...(twoFactorCode.trim() ? { two_factor_code: twoFactorCode.trim() } : {}),
    })
    const payload = data.data ?? data
    setSession(payload.token, payload.user)
    await hydrate()
  }

  async function hydrate() {
    if (!token.value) return
    try {
      const { data } = await api.get('/auth/me')
      const payload = data.data ?? data
      user.value = { ...(payload.user ?? payload), roles: payload.roles ?? payload.user?.roles ?? [] }
      localStorage.setItem('court-hub.user', JSON.stringify(user.value))
    } catch { clearSession() }
  }

  return { token, user, isAuthenticated, login, loginWithMockSocial, hydrate, clearSession, setSession }
})
