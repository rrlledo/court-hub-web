<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery, useQueryClient } from '@tanstack/vue-query'
import { api, type ApiList } from '@/api/client'
import BookingTimelineView from '@/views/BookingTimelineView.vue'

type Facility = { id: number; name: string }
type Branch = { id: number; name: string; facility_id: number }
type Court = { id: number; name: string; sport?: string; status: string; base_price: number }
type Booking = { id: number; reference: string; court_id: number; starts_at: string; ends_at: string; status: string; amount: number; currency: string; expires_at?: string | null; notes?: string | null }

const queryClient = useQueryClient()
const today = new Date().toISOString().slice(0, 10)
const date = ref(today); const facilityId = ref<number>(); const branchId = ref<number>(); const courtId = ref<number>()
const startTime = ref('09:00'); const endTime = ref('10:00'); const notes = ref(''); const submitError = ref(''); const submitting = ref(false)
const bookingMode = ref<'standard' | 'walk-in' | 'qr'>('standard')
const actionError = ref(''); const actionSuccess = ref(''); const actionBusyId = ref<number>()
const recurringDay = ref(1); const recurringDuration = ref(60); const recurringStarts = ref(today); const recurringEnds = ref('')
const facilities = useQuery({ queryKey: ['facilities'], queryFn: async () => (await api.get<ApiList<Facility>>('/facilities')).data.data })
const branches = useQuery({ queryKey: ['branches', facilityId], enabled: computed(() => Boolean(facilityId.value)), queryFn: async () => (await api.get<ApiList<Branch>>(`/facilities/${facilityId.value}/branches`)).data.data })
const courts = useQuery({ queryKey: ['courts', branchId], enabled: computed(() => Boolean(branchId.value)), queryFn: async () => (await api.get<ApiList<Court>>(`/branches/${branchId.value}/courts`)).data.data })
const bookings = useQuery({ queryKey: ['bookings', date], queryFn: async () => (await api.get<ApiList<Booking>>('/bookings', { params: { date: date.value } })).data.data })
const availability = useQuery({ queryKey: ['availability', courtId, date], enabled: computed(() => Boolean(courtId.value)), queryFn: async () => (await api.get(`/courts/${courtId.value}/availability`, { params: { date: date.value } })).data.data.data })
const history = useQuery({ queryKey: ['booking-history'], queryFn: async () => { const { data } = await api.get('/bookings/history'); return data.data?.data ?? data.data ?? [] } })

const facilityOptions = computed<Facility[]>(() => facilities.data.value ?? [])
const branchOptions = computed<Branch[]>(() => branches.data.value ?? [])
const courtOptions = computed<Court[]>(() => courts.data.value ?? [])
const bookingList = computed<Booking[]>(() => bookings.data.value ?? [])
const selectedCourt = computed(() => courtOptions.value.find((court) => court.id === courtId.value))
const selectedBookings = computed<Booking[]>(() => availability.data.value?.bookings?.data ?? availability.data.value?.bookings ?? [])
const historyList = computed<Booking[]>(() => history.data.value ?? [])
function resetBranch() { branchId.value = undefined; courtId.value = undefined }
function resetCourt() { courtId.value = undefined }
function money(value: number) { return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value ?? 0)) }
function formatTime(iso: string) { return new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(new Date(iso)) }
function statusLabel(value: string) { return value.replace('_', ' ') }
function canConfirm(booking: Booking) { return booking.status === 'reserved' && (!booking.expires_at || new Date(booking.expires_at) > new Date()) }
function canCancel(booking: Booking) { return !['cancelled', 'expired'].includes(booking.status) }
async function refreshBookingData() {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['bookings'] }),
    queryClient.invalidateQueries({ queryKey: ['availability'] }),
  ])
}
async function createBooking() {
  submitError.value = ''
  if (!courtId.value) { submitError.value = 'Select a facility, branch, and court.'; return }
  if (endTime.value <= startTime.value) { submitError.value = 'End time must be after start time.'; return }
  submitting.value = true
  try {
    const endpoint = bookingMode.value === 'walk-in' ? '/bookings/walk-in' : bookingMode.value === 'qr' ? '/bookings/qr' : '/bookings'
    await api.post(endpoint, { court_id: courtId.value, starts_at: `${date.value}T${startTime.value}:00`, ends_at: `${date.value}T${endTime.value}:00`, notes: notes.value || undefined })
    notes.value = ''
    await refreshBookingData()
  } catch (caught: any) { submitError.value = caught.response?.data?.message ?? 'The reservation could not be created.' }
  finally { submitting.value = false }
}
async function updateBooking(booking: Booking, action: 'confirm' | 'cancel') {
  actionError.value = ''; actionSuccess.value = ''
  if (action === 'cancel' && !window.confirm(`Cancel booking ${booking.reference}? This cannot be undone.`)) return
  actionBusyId.value = booking.id
  try {
    await api.post(`/bookings/${booking.id}/${action}`)
    actionSuccess.value = `Booking ${booking.reference} was ${action === 'confirm' ? 'confirmed' : 'cancelled'}.`
    await refreshBookingData()
  } catch (caught: any) { actionError.value = caught.response?.data?.message ?? `The booking could not be ${action}ed.` }
  finally { actionBusyId.value = undefined }
}
async function bookingTool(booking: Booking, tool: 'qr' | 'reschedule') {
  actionError.value = ''; actionSuccess.value = ''; actionBusyId.value = booking.id
  try {
    if (tool === 'qr') { const { data } = await api.post(`/bookings/${booking.id}/qr-code`); actionSuccess.value = `QR code: ${(data.data ?? data).qr_code}` }
    else { const startsAt = window.prompt('New start (YYYY-MM-DDTHH:mm)', booking.starts_at.slice(0, 16)); const endsAt = window.prompt('New end (YYYY-MM-DDTHH:mm)', booking.ends_at.slice(0, 16)); if (!startsAt || !endsAt) return; await api.patch(`/bookings/${booking.id}/reschedule`, { starts_at: startsAt, ends_at: endsAt }); actionSuccess.value = `Booking ${booking.reference} was rescheduled.`; await refreshBookingData() }
  } catch (caught: any) { actionError.value = caught.response?.data?.message ?? 'Booking action could not be completed.' }
  finally { actionBusyId.value = undefined }
}
async function createRecurring() {
  actionError.value = ''; actionSuccess.value = ''
  if (!courtId.value || !recurringEnds.value) { actionError.value = 'Select a court and recurring end date.'; return }
  try { await api.post('/bookings/recurring', { court_id: courtId.value, day_of_week: recurringDay.value, starts_at: startTime.value, duration_minutes: recurringDuration.value, starts_on: recurringStarts.value, ends_on: recurringEnds.value }); actionSuccess.value = 'Recurring reservation schedule created.' }
  catch (caught: any) { actionError.value = caught.response?.data?.message ?? 'Recurring reservation could not be created.' }
}
async function requestRefund(booking: Booking) {
  const amount = window.prompt(`Refund amount (maximum ${booking.amount})`, String(booking.amount)); if (!amount) return
  const reason = window.prompt('Reason (optional)') ?? ''
  actionBusyId.value = booking.id
  try { await api.post(`/bookings/${booking.id}/refunds`, { amount: Number(amount), reason: reason || undefined }); actionSuccess.value = `Refund request created for ${booking.reference}.` }
  catch (caught: any) { actionError.value = caught.response?.data?.message ?? 'Refund request could not be created.' }
  finally { actionBusyId.value = undefined }
}
</script>

<template>
  <header class="page-header"><div><p class="eyebrow">RESERVATIONS</p><h1>Bookings</h1><p class="muted">Create a court reservation and keep an eye on the day’s play.</p></div></header>
  <section class="booking-layout">
    <article class="panel booking-form"><div class="panel-heading"><div><h2>New reservation</h2><p class="muted">Reserved bookings are held for 10 minutes until confirmed.</p></div></div>
      <form @submit.prevent="createBooking"><div class="form-grid"><label>Booking type<select v-model="bookingMode"><option value="standard">Online reservation</option><option value="walk-in">Walk-in (staff)</option><option value="qr">QR booking</option></select></label><label>Date<input v-model="date" type="date" :min="today" /></label><label>Facility<select v-model.number="facilityId" @change="resetBranch"><option :value="undefined">Select facility</option><option v-for="facility in facilityOptions" :key="facility.id" :value="facility.id">{{ facility.name }}</option></select></label><label>Branch<select v-model.number="branchId" :disabled="!facilityId" @change="resetCourt"><option :value="undefined">Select branch</option><option v-for="branch in branchOptions" :key="branch.id" :value="branch.id">{{ branch.name }}</option></select></label><label>Court<select v-model.number="courtId" :disabled="!branchId"><option :value="undefined">Select court</option><option v-for="court in courtOptions" :key="court.id" :value="court.id" :disabled="court.status !== 'active'">{{ court.name }}{{ court.sport ? ` · ${court.sport}` : '' }}</option></select></label><label>Starts at<input v-model="startTime" type="time" /></label><label>Ends at<input v-model="endTime" type="time" /></label></div><label class="full-label">Notes <textarea v-model="notes" rows="3" placeholder="Optional player or booking notes"></textarea></label><div v-if="selectedCourt" class="price-hint">Base price: <strong>{{ money(selectedCourt.base_price) }}</strong> per hour</div><p v-if="submitError" class="form-error">{{ submitError }}</p><button class="primary-button" :disabled="submitting">{{ submitting ? 'Creating reservation…' : 'Reserve court' }}</button></form>
    </article>
    <article class="panel"><div class="panel-heading"><div><h2>Court availability</h2><p class="muted">{{ courtId ? `Schedule for ${date}` : 'Choose a court to view its schedule.' }}</p></div></div><div v-if="availability.isLoading.value" class="empty-state small">Loading court schedule…</div><div v-else-if="availability.data.value?.is_closed" class="empty-state small"><h3>Branch closed</h3><p>This branch is not accepting bookings on the selected date.</p></div><div v-else-if="courtId" class="schedule-list"><div v-if="!selectedBookings.length" class="schedule-empty">No active bookings for this court.</div><article v-for="booking in selectedBookings" :key="booking.id" class="schedule-item"><div><strong>{{ formatTime(booking.starts_at) }} – {{ formatTime(booking.ends_at) }}</strong><span>{{ booking.reference }}</span></div><span :class="['status-pill', booking.status]">{{ statusLabel(booking.status) }}</span></article></div><div v-else class="empty-state small"><span>◷</span><h3>Select a court</h3><p>Its current bookings and availability will appear here.</p></div></article>
  </section>
  <BookingTimelineView :date="date" :court-name="selectedCourt?.name" :availability="availability.data.value" />
  <section class="panel booking-form recurring-form"><h2>Recurring reservation</h2><form @submit.prevent="createRecurring"><div class="form-grid"><label>Day of week<select v-model.number="recurringDay"><option v-for="(day, index) in ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']" :key="day" :value="index">{{ day }}</option></select></label><label>Duration (minutes)<input v-model.number="recurringDuration" type="number" min="30" /></label><label>Starts on<input v-model="recurringStarts" type="date" /></label><label>Ends on<input v-model="recurringEnds" type="date" /></label></div><button class="secondary-button">Create recurring schedule</button></form></section>
  <section class="panel bookings-table"><div class="panel-heading"><div><h2>Bookings for {{ date }}</h2><p class="muted">All reservation activity for your tenant.</p></div><span v-if="bookings.isFetching" class="table-status">Refreshing…</span></div><p v-if="actionSuccess" class="action-message success">{{ actionSuccess }}</p><p v-if="actionError" class="action-message error">{{ actionError }}</p><div class="table-wrap"><table><thead><tr><th>Reference</th><th>Court</th><th>Time</th><th>Amount</th><th>Status</th><th class="actions-column">Actions</th></tr></thead><tbody><tr v-if="!bookingList.length"><td colspan="6" class="table-empty">No bookings found for this date.</td></tr><tr v-for="booking in bookingList" :key="booking.id"><td><strong>{{ booking.reference }}</strong></td><td>#{{ booking.court_id }}</td><td>{{ formatTime(booking.starts_at) }} – {{ formatTime(booking.ends_at) }}</td><td>{{ money(booking.amount) }}</td><td><span :class="['status-pill', booking.status]">{{ statusLabel(booking.status) }}</span></td><td><div class="row-actions"><button v-if="canConfirm(booking)" class="table-button confirm" :disabled="actionBusyId === booking.id" @click="updateBooking(booking, 'confirm')">Confirm</button><button v-if="canCancel(booking)" class="table-button cancel" :disabled="actionBusyId === booking.id" @click="updateBooking(booking, 'cancel')">Cancel</button><button v-if="canCancel(booking)" class="table-button" :disabled="actionBusyId === booking.id" @click="bookingTool(booking, 'reschedule')">Reschedule</button><button v-if="booking.status === 'confirmed'" class="table-button" :disabled="actionBusyId === booking.id" @click="requestRefund(booking)">Refund</button><button class="table-button" :disabled="actionBusyId === booking.id" @click="bookingTool(booking, 'qr')">QR code</button></div></td></tr></tbody></table></div></section><section class="panel bookings-table"><h2>My booking history</h2><div class="table-wrap"><table><thead><tr><th>Reference</th><th>Date</th><th>Status</th></tr></thead><tbody><tr v-if="!historyList.length"><td colspan="3" class="table-empty">No previous bookings.</td></tr><tr v-for="booking in historyList" :key="booking.id"><td>{{ booking.reference }}</td><td>{{ booking.starts_at }}</td><td><span :class="['status-pill', booking.status]">{{ statusLabel(booking.status) }}</span></td></tr></tbody></table></div></section>
</template>
