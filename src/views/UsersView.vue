<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

type Role = 'facility-manager' | 'front-desk' | 'coach' | 'event-organizer' | 'player'
type User = { id: number; name: string; email: string; roles?: { id: number; name: string }[] }
const roles: Role[] = ['facility-manager', 'front-desk', 'coach', 'event-organizer', 'player']
const auth = useAuthStore(); const client = useQueryClient()
const name = ref(''); const email = ref(''); const password = ref(''); const passwordConfirmation = ref(''); const selectedRole = ref<Role>('player')
const message = ref(''); const error = ref(''); const saving = ref(false); const busyUserId = ref<number>()
const users = useQuery({ queryKey: ['users'], queryFn: async () => { const { data } = await api.get('/users'); const payload = data.data ?? data; return payload.data ?? payload } })
const userList = computed<User[]>(() => users.data.value ?? [])
function resetFeedback() { message.value = ''; error.value = '' }
function formatRole(role: string) { return role.replace('-', ' ') }
function currentRole(user: User): Role { return (user.roles?.[0]?.name as Role) || 'player' }
async function refreshUsers() { await client.invalidateQueries({ queryKey: ['users'] }) }
async function createUser() {
  resetFeedback()
  if (!name.value.trim() || !email.value.trim() || password.value.length < 12) { error.value = 'Enter a name, valid email, and a password of at least 12 characters.'; return }
  if (password.value !== passwordConfirmation.value) { error.value = 'Password confirmation does not match.'; return }
  saving.value = true
  try { await api.post('/users', { name: name.value.trim(), email: email.value.trim(), password: password.value, password_confirmation: passwordConfirmation.value, roles: [selectedRole.value] }); name.value = ''; email.value = ''; password.value = ''; passwordConfirmation.value = ''; selectedRole.value = 'player'; message.value = 'Tenant user created.'; await refreshUsers() }
  catch (caught: any) { error.value = caught.response?.data?.message ?? 'User could not be created.' } finally { saving.value = false }
}
async function updateRole(user: User, role: Role) {
  resetFeedback(); busyUserId.value = user.id
  try { await api.put(`/users/${user.id}/roles`, { roles: [role] }); message.value = `${user.name}'s role was updated.`; await refreshUsers() }
  catch (caught: any) { error.value = caught.response?.data?.message ?? 'Role could not be updated.' } finally { busyUserId.value = undefined }
}
async function removeUser(user: User) {
  resetFeedback(); if (!window.confirm(`Remove ${user.name} from this tenant? Their active browser sessions will be revoked.`)) return
  busyUserId.value = user.id
  try { await api.delete(`/users/${user.id}`); message.value = `${user.name} was removed.`; await refreshUsers() }
  catch (caught: any) { error.value = caught.response?.data?.message ?? 'User could not be removed.' } finally { busyUserId.value = undefined }
}
</script>

<template>
  <header class="page-header"><div><p class="eyebrow">TENANT ACCESS</p><h1>Staff &amp; Members</h1><p class="muted">Create tenant accounts and assign the roles that control Court Hub access.</p></div></header>
  <p v-if="message" class="action-message success">{{ message }}</p><p v-if="error" class="action-message error">{{ error }}</p>
  <section class="user-layout"><article class="panel user-form"><h2>Add a user</h2><p class="muted">Members use the <em>player</em> role. Choose an operational role for staff.</p><form @submit.prevent="createUser"><label>Full name<input v-model="name" autocomplete="name" placeholder="e.g., Jamie Santos" /></label><label>Email<input v-model="email" autocomplete="email" type="email" placeholder="jamie@example.com" /></label><label>Password<input v-model="password" autocomplete="new-password" type="password" /></label><label>Confirm password<input v-model="passwordConfirmation" autocomplete="new-password" type="password" /></label><label>Role<select v-model="selectedRole"><option v-for="role in roles" :key="role" :value="role">{{ formatRole(role) }}</option></select></label><button class="primary-button" :disabled="saving">{{ saving ? 'Creating…' : 'Create user' }}</button></form></article>
  <article class="panel role-guide"><h2>Role guide</h2><dl><div><dt>Facility manager</dt><dd>Manages facilities, staff, bookings, and reporting.</dd></div><div><dt>Front desk</dt><dd>Handles booking confirmation, walk-ins, check-ins, and memberships.</dd></div><div><dt>Coach / event organizer</dt><dd>Works with coaching sessions or tournaments.</dd></div><div><dt>Player</dt><dd>Member-facing access with no administrative controls.</dd></div></dl></article></section>
  <section class="panel users-table"><div class="panel-heading"><div><h2>Tenant users</h2><p class="muted">Role changes immediately affect API authorization.</p></div></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Role</th><th class="actions-column">Actions</th></tr></thead><tbody><tr v-if="!userList.length"><td colspan="4" class="table-empty">No users found.</td></tr><tr v-for="user in userList" :key="user.id"><td><strong>{{ user.name }}</strong><small v-if="user.id === auth.user?.id" class="current-user">You</small></td><td>{{ user.email }}</td><td><select class="role-select" :value="currentRole(user)" :disabled="user.id === auth.user?.id || busyUserId === user.id" @change="updateRole(user, ($event.target as HTMLSelectElement).value as Role)"><option v-for="role in roles" :key="role" :value="role">{{ formatRole(role) }}</option></select></td><td><button v-if="user.id !== auth.user?.id" class="table-button cancel" :disabled="busyUserId === user.id" @click="removeUser(user)">Remove</button><span v-else class="action-muted">Owner account</span></td></tr></tbody></table></div></section>
</template>
