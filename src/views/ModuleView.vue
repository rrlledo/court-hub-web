<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const copy: Record<string, [string, string, string]> = {
  bookings: ['Bookings', 'View availability, create reservations, and manage check-ins.', 'GET /bookings · GET /courts/{court}/availability'],
  facilities: ['Facilities', 'Configure organizations, branches, courts, operating hours, and pricing.', 'GET /facilities · GET /court-types'],
  memberships: ['Memberships', 'Manage plans, members, cards, packages, sessions, and payments.', 'GET /memberships · GET /membership-plans'],
  coaching: ['Coaching', 'Schedule sessions and manage coach availability and revenue.', 'GET /coaches · GET /coaching-sessions'],
  tournaments: ['Tournaments', 'Create events, registrations, and match schedules.', 'GET /tournaments'],
  rentals: ['Rentals', 'Track inventory, active rentals, returns, and overdue equipment.', 'GET /inventory-items · GET /rentals'],
  reports: ['Reports', 'Review revenue, occupancy, utilization, and activity reporting.', 'GET /reports/dashboard'],
  settings: ['Settings', 'Manage your profile, team members, roles, and notifications.', 'GET /auth/me · GET /users'],
}
const detail = computed(() => copy[String(route.params.module)] ?? copy.bookings)
</script>

<template><header class="page-header"><div><p class="eyebrow">WORKSPACE</p><h1>{{ detail[0] }}</h1><p class="muted">{{ detail[1] }}</p></div></header><section class="panel module-panel"><div class="module-icon">⌘</div><h2>{{ detail[0] }} workflow</h2><p>This section has been scaffolded and is ready for the first interactive API-backed screen.</p><code>{{ detail[2] }}</code><div class="module-checklist"><span>✓ Vue route and navigation</span><span>✓ Authenticated API client</span><span>○ Data table and create/edit forms</span><span>○ Role-aware actions and empty/error states</span></div></section></template>
