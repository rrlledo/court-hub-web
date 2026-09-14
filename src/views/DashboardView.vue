<script setup lang="ts">
import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'

const dashboard = useQuery({ queryKey: ['dashboard'], queryFn: async () => (await api.get('/reports/dashboard')).data.data })
const metrics = computed(() => {
  const data = dashboard.data.value ?? {}
  return [
    ['Today’s bookings', data.bookings_today ?? '—', 'Live reservation activity'],
    ['Revenue this month', data.revenue_this_month ? `₱${Number(data.revenue_this_month).toLocaleString()}` : '—', 'Recorded payments'],
    ['Active memberships', data.active_memberships ?? '—', 'Current members'],
    ['Court utilization', data.court_utilization ? `${data.court_utilization}%` : '—', 'This reporting period'],
  ]
})
</script>

<template><header class="page-header"><div><p class="eyebrow">OVERVIEW</p><h1>Good day, {{ 'operator' }}.</h1><p class="muted">Here’s the operational pulse of your facility.</p></div><RouterLink class="primary-button compact" to="/bookings">New booking</RouterLink></header><p v-if="dashboard.isError" class="notice">The dashboard could not load. Confirm that the Laravel API is running and that your account has a manager role.</p><section class="metric-grid"><article v-for="metric in metrics" :key="metric[0]" class="metric-card"><p>{{ metric[0] }}</p><strong>{{ metric[1] }}</strong><span>{{ metric[2] }}</span></article></section><section class="dashboard-grid"><article class="panel"><div class="panel-heading"><div><h2>Today’s court schedule</h2><p class="muted">Connect booking availability next.</p></div><RouterLink to="/bookings">View bookings</RouterLink></div><div class="empty-state"><span>◷</span><h3>Schedule is ready to connect</h3><p>Booking and availability endpoints are available in the API. This view is the next operational workflow to complete.</p></div></article><article class="panel"><div class="panel-heading"><div><h2>Quick actions</h2><p class="muted">Frequently used facility tasks</p></div></div><div class="quick-links"><RouterLink to="/facilities">Manage courts <span>→</span></RouterLink><RouterLink to="/memberships">Enroll a member <span>→</span></RouterLink><RouterLink to="/reports">View reports <span>→</span></RouterLink></div></article></section></template>
