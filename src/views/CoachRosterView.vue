<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { api } from '@/api/client'
type Coach = { id: number; name: string }
type User = { id: number; name: string; email: string; roles?: string[] }
const client = useQueryClient(); const coachId = ref<number>(); const playerId = ref<number>(); const share = ref(0); const message = ref(''); const error = ref('')
const coaches = useQuery({ queryKey: ['coaches'], queryFn: async () => ((await api.get('/coaches')).data.data ?? []) as Coach[] })
const users = useQuery({ queryKey: ['users'], queryFn: async () => { const body = (await api.get('/users')).data.data ?? []; return (body.data ?? body) as User[] } })
const roster = useQuery({ queryKey: computed(() => ['coach-roster', coachId.value]), enabled: computed(() => !!coachId.value), queryFn: async () => (await api.get(`/coaches/${coachId.value}/students`)).data.data ?? [] })
const players = computed(() => (users.data.value ?? []).filter((user) => user.roles?.includes('player')))
async function add() { if (!coachId.value || !playerId.value) { error.value = 'Choose a coach and player.'; return }; try { await api.post(`/coaches/${coachId.value}/students`, { user_id: playerId.value, revenue_share_percent: share.value }); message.value = 'Student and revenue share saved.'; await client.invalidateQueries({ queryKey: ['coach-roster', coachId.value] }) } catch (caught: any) { error.value = caught.response?.data?.message ?? 'Unable to save student.' } }
</script>
<template><section class="panel membership-form payment-form"><h2>Coach students &amp; revenue sharing</h2><form @submit.prevent="add"><div class="form-grid"><label>Coach<select v-model.number="coachId"><option :value="undefined">Select coach</option><option v-for="coach in coaches.data.value??[]" :key="coach.id" :value="coach.id">{{coach.name}}</option></select></label><label>Player<select v-model.number="playerId"><option :value="undefined">Select player</option><option v-for="player in players" :key="player.id" :value="player.id">{{player.name}} · {{player.email}}</option></select></label><label>Coach share (%)<input v-model.number="share" type="number" min="0" max="100" step="0.01"/></label></div><button class="secondary-button">Save student</button></form><p v-if="message" class="action-message success">{{message}}</p><p v-if="error" class="action-message error">{{error}}</p><ul v-if="coachId" class="roster-list"><li v-for="student in roster.data.value??[]" :key="student.id">{{student.player?.name}} · {{student.revenue_share_percent}}% coach share</li><li v-if="!(roster.data.value??[]).length">No students assigned.</li></ul></section></template>
