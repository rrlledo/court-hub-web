<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { api, type ApiList } from '@/api/client'
import MembershipSessionHistoryView from '@/views/MembershipSessionHistoryView.vue'

type MembershipPlan = { id: number; name: string; plan_type: string; billing_period: string; price: number; duration_days: number; session_count?: number | null; priority_booking?: boolean; is_active?: boolean }
type Membership = { id: number; membership_plan_id: number; user_id: number; starts_on: string; ends_on: string; status: string; auto_renew: boolean; remaining_sessions?: number | null }
type Member = { id: number; name: string; email: string }

const client = useQueryClient()
const planName = ref(''); const planType = ref('standard'); const billingPeriod = ref('monthly'); const planPrice = ref<number | undefined>(); const durationDays = ref<number | undefined>(30); const sessionCount = ref<number | undefined>(); const priorityBooking = ref(false)
const enrollmentPlanId = ref<number>(); const enrollmentUserId = ref<number>(); const enrollmentDate = ref(new Date().toISOString().slice(0, 10)); const enrollmentAutoRenew = ref(false)
const message = ref(''); const error = ref(''); const saving = ref(''); const actionBusyId = ref<number>()
const plans = useQuery({ queryKey: ['membership-plans'], queryFn: async () => (await api.get<ApiList<MembershipPlan>>('/membership-plans')).data.data })
const memberships = useQuery({ queryKey: ['memberships'], queryFn: async () => (await api.get<ApiList<Membership>>('/memberships')).data.data })
const users = useQuery({ queryKey: ['users'], queryFn: async () => { const { data } = await api.get('/users'); const payload = data.data ?? data; return payload.data ?? payload } })
const planList = computed<MembershipPlan[]>(() => plans.data.value ?? [])
const membershipList = computed<Membership[]>(() => memberships.data.value ?? [])
const memberList = computed<Member[]>(() => users.data.value ?? [])
function resetFeedback() { message.value = ''; error.value = '' }
function planFor(id: number) { return planList.value.find((plan) => plan.id === id) }
function money(value: number) { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(Number(value ?? 0)) }
function label(value: string) { return value.replaceAll('_', ' ') }
async function refreshMemberships() { await Promise.all([client.invalidateQueries({ queryKey: ['membership-plans'] }), client.invalidateQueries({ queryKey: ['memberships'] })]) }
async function createPlan() {
  resetFeedback()
  if (!planName.value.trim() || planPrice.value === undefined || planPrice.value < 0 || !durationDays.value || durationDays.value < 1) { error.value = 'Enter a plan name, price, and duration of at least one day.'; return }
  if (planType.value === 'session_package' && (!sessionCount.value || sessionCount.value < 1)) { error.value = 'A session package needs at least one session.'; return }
  saving.value = 'plan'
  try { const { data } = await api.post('/membership-plans', { name: planName.value.trim(), plan_type: planType.value, billing_period: billingPeriod.value, price: planPrice.value, duration_days: durationDays.value, priority_booking: priorityBooking.value, session_count: planType.value === 'session_package' ? sessionCount.value : undefined }); enrollmentPlanId.value = (data.data ?? data).id; planName.value = ''; planPrice.value = undefined; sessionCount.value = undefined; priorityBooking.value = false; message.value = 'Membership plan created. Enroll a member when ready.'; await refreshMemberships() }
  catch (caught: any) { error.value = caught.response?.data?.message ?? 'Membership plan could not be created.' } finally { saving.value = '' }
}
async function enroll() {
  resetFeedback()
  if (!enrollmentPlanId.value) { error.value = 'Select a membership plan.'; return }
  saving.value = 'enrollment'
  try { await api.post('/memberships', { membership_plan_id: enrollmentPlanId.value, user_id: enrollmentUserId.value, starts_on: enrollmentDate.value, auto_renew: enrollmentAutoRenew.value }); message.value = 'Membership activated.'; await refreshMemberships() }
  catch (caught: any) { error.value = caught.response?.data?.message ?? 'Membership could not be activated.' } finally { saving.value = '' }
}
async function lifecycle(membership: Membership, action: 'freeze' | 'unfreeze' | 'renew' | 'cancel' | 'card' | 'use-session') {
  resetFeedback()
  if (action === 'cancel' && !window.confirm('Cancel this membership? Auto-renew will be disabled.')) return
  actionBusyId.value = membership.id
  const endpoint = action === 'card' ? 'cards' : action === 'use-session' ? 'sessions/use' : action
  try { await api.post(`/memberships/${membership.id}/${endpoint}`); const result = action === 'freeze' ? 'frozen' : action === 'unfreeze' ? 'resumed' : action === 'renew' ? 'renewed' : 'cancelled'; message.value = action === 'card' ? 'Membership card generated.' : action === 'use-session' ? 'One membership session was used.' : `Membership ${result}.`; await refreshMemberships() }
  catch (caught: any) { error.value = caught.response?.data?.message ?? 'Membership action could not be completed.' } finally { actionBusyId.value = undefined }
}
async function managePlan(plan: MembershipPlan, action: 'toggle' | 'edit' | 'delete') {
  resetFeedback(); if (action === 'delete' && !window.confirm(`Delete ${plan.name}?`)) return
  try {
    if (action === 'delete') await api.delete(`/membership-plans/${plan.id}`)
    else if (action === 'toggle') await api.patch(`/membership-plans/${plan.id}`, { is_active: !plan.is_active })
    else { const name = window.prompt('Plan name', plan.name); const price = window.prompt('Price', String(plan.price)); if (!name || !price) return; await api.patch(`/membership-plans/${plan.id}`, { name, price: Number(price) }) }
    message.value = `Plan ${action === 'delete' ? 'deleted' : 'updated'}.`; await refreshMemberships()
  } catch (caught: any) { error.value = caught.response?.data?.message ?? 'Plan could not be updated.' }
}
async function viewUsage(membership: Membership) {
  resetFeedback()
  try { const { data } = await api.get(`/memberships/${membership.id}/session-usage`); const usage = data.data?.data ?? data.data ?? []; message.value = usage.length ? `${usage.length} session-use record(s) found.` : 'No session-use records found.' }
  catch (caught: any) { error.value = caught.response?.data?.message ?? 'Session usage could not be loaded.' }
}
</script>

<template>
  <header class="page-header"><div><p class="eyebrow">MEMBERSHIP MANAGEMENT</p><h1>Memberships</h1><p class="muted">Create plans, activate membership access, and manage membership lifecycle actions.</p></div></header>
  <p v-if="message" class="action-message success">{{ message }}</p><p v-if="error" class="action-message error">{{ error }}</p>
  <section class="membership-top-grid">
    <article class="panel membership-form"><h2>Create plan</h2><p class="muted">Configure a plan that members can join.</p><form @submit.prevent="createPlan"><div class="form-grid"><label>Plan name<input v-model="planName" placeholder="e.g., Monthly Play" /></label><label>Plan type<select v-model="planType"><option value="standard">Standard</option><option value="family">Family</option><option value="corporate">Corporate</option><option value="session_package">Session package</option></select></label><label>Billing period<select v-model="billingPeriod"><option value="monthly">Monthly</option><option value="annual">Annual</option><option value="custom">Custom</option></select></label><label>Price (PHP)<input v-model.number="planPrice" min="0" step="0.01" type="number" placeholder="1500" /></label><label>Duration (days)<input v-model.number="durationDays" min="1" type="number" /></label><label v-if="planType === 'session_package'">Included sessions<input v-model.number="sessionCount" min="1" type="number" placeholder="10" /></label></div><label class="checkbox-label"><input v-model="priorityBooking" type="checkbox" /> Priority booking access</label><button class="secondary-button" :disabled="saving === 'plan'">{{ saving === 'plan' ? 'Saving…' : 'Create plan' }}</button></form></article>
    <article class="panel membership-form"><h2>Activate membership</h2><p class="muted">Activate the selected plan for a tenant user.</p><form @submit.prevent="enroll"><label>Membership plan<select v-model.number="enrollmentPlanId"><option :value="undefined">Select plan</option><option v-for="plan in planList" :key="plan.id" :value="plan.id">{{ plan.name }} · {{ money(plan.price) }}</option></select></label><label>Member<select v-model.number="enrollmentUserId"><option :value="undefined">Signed-in user</option><option v-for="member in memberList" :key="member.id" :value="member.id">{{ member.name }} · {{ member.email }}</option></select></label><label>Starts on<input v-model="enrollmentDate" type="date" /></label><label class="checkbox-label"><input v-model="enrollmentAutoRenew" type="checkbox" /> Renew automatically when eligible</label><button class="primary-button" :disabled="saving === 'enrollment'">{{ saving === 'enrollment' ? 'Activating…' : 'Activate membership' }}</button></form><p class="member-note">The selected tenant user receives the membership. Leaving Member blank activates the plan for the signed-in user.</p></article>
  </section>
  <section class="plan-grid"><article v-for="plan in planList" :key="plan.id" class="panel plan-card"><div><span class="status-pill confirmed">{{ label(plan.plan_type) }}</span><h2>{{ plan.name }}</h2><strong class="plan-price">{{ money(plan.price) }}</strong><span class="muted">/{{ plan.billing_period }}</span></div><p>{{ plan.duration_days }} days<span v-if="plan.session_count"> · {{ plan.session_count }} sessions</span></p><p v-if="plan.priority_booking" class="plan-feature">Priority booking included</p><button class="secondary-button" @click="enrollmentPlanId = plan.id">Select plan</button></article><article v-if="!planList.length" class="panel empty-plans"><h2>No plans yet</h2><p>Create your first plan above to start enrolling members.</p></article></section>
  <section class="panel memberships-table"><div class="panel-heading"><div><h2>Membership records</h2><p class="muted">Memberships for your tenant.</p></div></div><div class="table-wrap"><table><thead><tr><th>Plan</th><th>Dates</th><th>Sessions</th><th>Auto-renew</th><th>Status</th><th class="actions-column">Actions</th></tr></thead><tbody><tr v-if="!membershipList.length"><td colspan="6" class="table-empty">No memberships have been activated.</td></tr><tr v-for="membership in membershipList" :key="membership.id"><td><strong>{{ planFor(membership.membership_plan_id)?.name ?? `Plan #${membership.membership_plan_id}` }}</strong></td><td>{{ membership.starts_on }} – {{ membership.ends_on }}</td><td>{{ membership.remaining_sessions ?? '—' }}</td><td>{{ membership.auto_renew ? 'Enabled' : 'Off' }}</td><td><span :class="['status-pill', membership.status]">{{ label(membership.status) }}</span></td><td><div class="row-actions"><button v-if="membership.status === 'active'" class="table-button" :disabled="actionBusyId === membership.id" @click="lifecycle(membership, 'freeze')">Freeze</button><button v-if="membership.status === 'frozen'" class="table-button confirm" :disabled="actionBusyId === membership.id" @click="lifecycle(membership, 'unfreeze')">Resume</button><button v-if="membership.status !== 'cancelled'" class="table-button" :disabled="actionBusyId === membership.id" @click="lifecycle(membership, 'renew')">Renew</button><button v-if="membership.status === 'active' && membership.remaining_sessions !== null && membership.remaining_sessions !== undefined" class="table-button" :disabled="actionBusyId === membership.id" @click="lifecycle(membership, 'use-session')">Use session</button><button class="table-button" :disabled="actionBusyId === membership.id" @click="lifecycle(membership, 'card')">Card</button><button v-if="membership.status !== 'cancelled'" class="table-button cancel" :disabled="actionBusyId === membership.id" @click="lifecycle(membership, 'cancel')">Cancel</button></div></td></tr></tbody></table></div></section>
  <MembershipSessionHistoryView :memberships="membershipList" :plans="planList" />
  <section class="panel memberships-table"><h2>Plan management</h2><div class="table-wrap"><table><thead><tr><th>Plan</th><th>Price</th><th>Active</th><th>Actions</th></tr></thead><tbody><tr v-for="plan in planList" :key="plan.id"><td>{{ plan.name }}</td><td>{{ money(plan.price) }}</td><td>{{ plan.is_active === false ? 'No' : 'Yes' }}</td><td><div class="row-actions"><button class="table-button" @click="managePlan(plan, 'edit')">Edit</button><button class="table-button" @click="managePlan(plan, 'toggle')">{{ plan.is_active === false ? 'Activate' : 'Deactivate' }}</button><button class="table-button cancel" @click="managePlan(plan, 'delete')">Delete</button></div></td></tr></tbody></table></div></section>
</template>
