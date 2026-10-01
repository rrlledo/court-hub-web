<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { api } from '@/api/client'

type Tenant = {
  id: number; name: string; slug: string; timezone: string; country_code: string; is_active: boolean
  users_count?: number; facilities_count?: number; subscription_plan: string; subscription_status: string
  subscription_amount: string | number; subscription_renews_at?: string | null
}
type Draft = { subscription_plan: string; subscription_status: string; subscription_amount: string; subscription_renews_at: string }

const overview = ref<Record<string, string | number>>({})
const tenants = ref<Tenant[]>([])
const drafts = ref<Record<number, Draft>>({})
const loading = ref(true)
const saving = ref<number | null>(null)
const error = ref('')
const notice = ref('')

function dateValue(value?: string | null) { return value ? value.slice(0, 10) : '' }
function money(value: unknown) { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value ?? 0)) }
function prepareDraft(tenant: Tenant): Draft {
  return { subscription_plan: tenant.subscription_plan ?? 'starter', subscription_status: tenant.subscription_status ?? 'trial', subscription_amount: String(tenant.subscription_amount ?? 0), subscription_renews_at: dateValue(tenant.subscription_renews_at) }
}

async function load() {
  loading.value = true; error.value = ''
  try {
    const [overviewResponse, tenantResponse] = await Promise.all([api.get('/super-admin/overview'), api.get('/super-admin/tenants')])
    overview.value = (overviewResponse.data.data ?? overviewResponse.data) as Record<string, string | number>
    const body = tenantResponse.data.data ?? tenantResponse.data
    tenants.value = (Array.isArray(body) ? body : body.data ?? []) as Tenant[]
    drafts.value = Object.fromEntries(tenants.value.map((tenant) => [tenant.id, prepareDraft(tenant)]))
  } catch { error.value = 'Unable to load platform administration data.' } finally { loading.value = false }
}

async function saveSubscription(tenant: Tenant) {
  saving.value = tenant.id; error.value = ''; notice.value = ''
  try {
    const draft = drafts.value[tenant.id]
    await api.patch(`/super-admin/tenants/${tenant.id}`, {
      ...draft,
      subscription_amount: Number(draft.subscription_amount),
      subscription_renews_at: draft.subscription_renews_at || null,
    })
    notice.value = `Saved the simulated subscription for ${tenant.name}.`
    await load()
  } catch { error.value = `Unable to save the subscription for ${tenant.name}.` } finally { saving.value = null }
}

async function toggleTenant(tenant: Tenant) {
  saving.value = tenant.id; error.value = ''; notice.value = ''
  try {
    await api.patch(`/super-admin/tenants/${tenant.id}`, { is_active: !tenant.is_active })
    notice.value = `${tenant.name} is now ${tenant.is_active ? 'suspended' : 'active'}.`
    await load()
  } catch { error.value = `Unable to update ${tenant.name}.` } finally { saving.value = null }
}
async function createMockInvoice(tenant: Tenant) {
  saving.value = tenant.id; error.value = ''; notice.value = ''
  try {
    await api.post(`/super-admin/tenants/${tenant.id}/subscription-invoices`, { amount: Number(drafts.value[tenant.id].subscription_amount), status: 'open', notes: 'Created from the local platform administration screen.' })
    notice.value = `Created a simulated invoice for ${tenant.name}.`
    await load()
  } catch { error.value = `Unable to create an invoice for ${tenant.name}.` } finally { saving.value = null }
}

onMounted(load)
</script>

<template>
  <header class="page-header"><div><p class="eyebrow">PLATFORM ADMINISTRATION</p><h1>Tenants &amp; subscriptions</h1><p class="muted">Manage the simulated Court Hub subscription ledger and tenant access.</p></div><button class="secondary-button" :disabled="loading" @click="load">Refresh</button></header>
  <p v-if="notice" class="action-message success">{{ notice }}</p><p v-if="error" class="action-message error">{{ error }}</p>
  <section class="metric-grid"><article class="metric-card"><p>Tenants</p><strong>{{ overview.tenants ?? 0 }}</strong><span>{{ overview.active_tenants ?? 0 }} active</span></article><article class="metric-card"><p>Simulated platform MRR</p><strong>{{ money(overview.simulated_platform_mrr) }}</strong><span>Trial and active subscriptions</span></article><article class="metric-card"><p>Platform users</p><strong>{{ overview.users ?? 0 }}</strong><span>{{ overview.facilities ?? 0 }} facilities</span></article><article class="metric-card"><p>Paid facility revenue</p><strong>{{ money(overview.paid_revenue) }}</strong><span>Recorded tenant payments</span></article></section>
  <section class="panel super-admin-panel"><div class="panel-heading"><div><h2>Tenant subscription ledger</h2><p class="muted">These amounts are simulated. Saving a change never charges a provider.</p></div></div><div v-if="loading" class="empty-state small">Loading tenants…</div><div v-else-if="!tenants.length" class="empty-state small">No tenants have been created yet.</div><div v-else class="tenant-subscription-list"><article v-for="tenant in tenants" :key="tenant.id" class="tenant-subscription-card"><div class="tenant-subscription-heading"><div><h3>{{ tenant.name }}</h3><p>{{ tenant.slug }} · {{ tenant.users_count ?? 0 }} users · {{ tenant.facilities_count ?? 0 }} facilities</p></div><button class="table-button" :class="tenant.is_active ? 'cancel' : 'confirm'" :disabled="saving === tenant.id" @click="toggleTenant(tenant)">{{ tenant.is_active ? 'Suspend tenant' : 'Activate tenant' }}</button></div><div class="subscription-form"><label>Plan<select v-model="drafts[tenant.id].subscription_plan"><option value="starter">Starter</option><option value="growth">Growth</option><option value="enterprise">Enterprise</option></select></label><label>Status<select v-model="drafts[tenant.id].subscription_status"><option value="trial">Trial</option><option value="active">Active</option><option value="past_due">Past due</option><option value="cancelled">Cancelled</option></select></label><label>Monthly amount (PHP)<input v-model="drafts[tenant.id].subscription_amount" type="number" min="0" step="0.01"></label><label>Renews on<input v-model="drafts[tenant.id].subscription_renews_at" type="date"></label></div><div class="subscription-actions"><span class="status-pill" :class="tenant.is_active ? 'confirmed' : 'cancelled'">{{ tenant.is_active ? 'active access' : 'suspended' }}</span><div class="row-actions"><button class="secondary-button" :disabled="saving === tenant.id" @click="createMockInvoice(tenant)">Create mock invoice</button><button class="primary-button compact" :disabled="saving === tenant.id" @click="saveSubscription(tenant)">{{ saving === tenant.id ? 'Saving…' : 'Save simulated subscription' }}</button></div></div></article></div></section>
</template>
