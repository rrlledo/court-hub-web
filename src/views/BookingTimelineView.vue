<script setup lang="ts">
import { computed } from 'vue'
type Booking = { id: number; reference: string; starts_at: string; ends_at: string; status: string }
const props = defineProps<{ date: string; courtName?: string; availability?: { is_closed?: boolean; operating_hours?: { opens_at?: string; closes_at?: string } | null; bookings?: { data?: Booking[] } | Booking[] } }>()
const hours = computed(() => { const open = Number((props.availability?.operating_hours?.opens_at ?? '06:00').slice(0, 2)); const close = Number((props.availability?.operating_hours?.closes_at ?? '22:00').slice(0, 2)); return Array.from({ length: Math.max(1, close - open) + 1 }, (_, index) => open + index) })
const activeBookings = computed<Booking[]>(() => { const bookings = props.availability?.bookings; return Array.isArray(bookings) ? bookings : bookings?.data ?? [] })
function minutes(value: string) { const date = new Date(value); return date.getHours() * 60 + date.getMinutes() }
function style(booking: Booking) { const start = hours.value[0] * 60; const span = Math.max(60, (hours.value.at(-1)! - hours.value[0]) * 60); return { left: `${Math.max(0, ((minutes(booking.starts_at) - start) / span) * 100)}%`, width: `${Math.min(100, Math.max(3, ((minutes(booking.ends_at) - minutes(booking.starts_at)) / span) * 100))}%` } }
function label(hour: number) { return `${String(hour).padStart(2, '0')}:00` }
</script>

<template>
  <section class="panel booking-timeline"><div class="panel-heading"><div><h2>Daily court timeline</h2><p class="muted">{{ courtName ? `${courtName} · ${date}` : 'Select a court to show its timeline.' }}</p></div></div>
    <div v-if="!courtName" class="empty-state small">Select a court to view the visual schedule.</div>
    <div v-else-if="availability?.is_closed" class="empty-state small">This branch is closed on the selected date.</div>
    <div v-else class="timeline-scroll"><div class="timeline-hours"><span v-for="hour in hours" :key="hour">{{ label(hour) }}</span></div><div class="timeline-track"><i v-for="hour in hours" :key="hour" class="timeline-grid" :style="{ left: `${((hour - hours[0]) / (hours.at(-1)! - hours[0])) * 100}%` }"></i><div v-if="!activeBookings.length" class="timeline-empty">No active bookings in this court schedule.</div><button v-for="booking in activeBookings" :key="booking.id" class="timeline-booking" :class="booking.status" :style="style(booking)" :title="`${booking.reference}: ${booking.starts_at}–${booking.ends_at}`">{{ booking.reference }}</button></div></div>
  </section>
</template>

<style scoped>
.timeline-scroll{overflow-x:auto}.timeline-hours,.timeline-track{min-width:720px}.timeline-hours{display:flex;justify-content:space-between;color:var(--muted,#667085);font-size:.78rem;padding:0 0 .4rem}.timeline-track{height:96px;position:relative;border:1px solid #d9e1ea;border-radius:.6rem;background:#f8fafc;overflow:hidden}.timeline-grid{position:absolute;top:0;bottom:0;border-left:1px dashed #d9e1ea}.timeline-booking{position:absolute;top:30px;height:38px;border:0;border-radius:.35rem;background:#246bce;color:white;padding:0 .5rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:default}.timeline-booking.reserved{background:#c57a00}.timeline-booking.cancelled,.timeline-booking.expired{background:#7b8794}.timeline-empty{display:grid;place-items:center;height:100%;color:var(--muted,#667085);font-size:.9rem}
</style>
