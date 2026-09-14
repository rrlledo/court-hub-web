<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'
type Membership = { id: number; membership_plan_id: number; remaining_sessions?: number | null }
type Plan = { id: number; name: string }
type Usage = { id: number; booking_id?: number | null; used_by?: number | null; used_at: string; notes?: string | null }
const props = defineProps<{ memberships: Membership[]; plans: Plan[] }>()
const membershipId = ref<number>()
const query = useQuery({ queryKey: computed(() => ['membership-session-usage', membershipId.value]), enabled: computed(() => Boolean(membershipId.value)), queryFn: async () => { const { data } = await api.get(`/memberships/${membershipId.value}/session-usage`); const payload = data.data ?? data; return payload.data ?? payload ?? [] } })
const usage = computed<Usage[]>(() => query.data.value ?? [])
function planName(membership: Membership) { return props.plans.find((plan) => plan.id === membership.membership_plan_id)?.name ?? `Plan #${membership.membership_plan_id}` }
</script>

<template>
  <section class="panel memberships-table"><div class="panel-heading"><div><h2>Session history</h2><p class="muted">Review each session redeemed from a session-package membership.</p></div><label>Membership<select v-model.number="membershipId"><option :value="undefined">Select membership</option><option v-for="membership in props.memberships" :key="membership.id" :value="membership.id">#{{ membership.id }} · {{ planName(membership) }} · {{ membership.remaining_sessions ?? '—' }} remaining</option></select></label></div><div v-if="!membershipId" class="empty-state small">Select a membership to see its session-use history.</div><div v-else-if="query.isLoading.value" class="empty-state small">Loading session history…</div><div v-else class="table-wrap"><table><thead><tr><th>Used at</th><th>Booking</th><th>Used by</th><th>Notes</th></tr></thead><tbody><tr v-if="!usage.length"><td colspan="4" class="table-empty">No sessions have been redeemed.</td></tr><tr v-for="item in usage" :key="item.id"><td>{{ item.used_at }}</td><td>{{ item.booking_id ? `Booking #${item.booking_id}` : '—' }}</td><td>{{ item.used_by ? `User #${item.used_by}` : '—' }}</td><td>{{ item.notes || '—' }}</td></tr></tbody></table></div></section>
</template>
