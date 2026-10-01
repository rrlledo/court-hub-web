<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { api } from '@/api/client'

type Booking = { id: number; reference: string; court_id: number; starts_at: string; status: string }
type CourtOption = { id: number; name: string; branch: string }

const qr = ref('')
const bookingId = ref<number>()
const courtId = ref<number>()
const starts = ref('')
const ends = ref('')
const msg = ref('')
const err = ref('')
const busy = ref(false)
const cameraOpen = ref(false)
const cameraVideo = ref<HTMLVideoElement>()
let stream: MediaStream | undefined
let scannerTimer: number | undefined

const bookings = useQuery({
  queryKey: ['front-desk-bookings'],
  queryFn: async () => {
    const response = await api.get('/bookings')
    return response.data.data?.data ?? response.data.data ?? []
  },
})
const facilities = useQuery({
  queryKey: ['front-desk-facilities'],
  queryFn: async () => {
    const response = await api.get('/booking-facilities')
    return response.data.data?.data ?? response.data.data ?? []
  },
})
const confirmed = computed<Booking[]>(() =>
  ((bookings.data.value ?? []) as Booking[]).filter((item) => item.status === 'confirmed'),
)
const courts = computed<CourtOption[]>(() =>
  (facilities.data.value ?? []).flatMap((facility: any) =>
    (facility.branches ?? []).flatMap((branch: any) =>
      (branch.courts ?? []).map((court: any) => ({ id: court.id, name: court.name, branch: branch.name })),
    ),
  ),
)

function reset() { msg.value = ''; err.value = '' }
function stopCamera() {
  if (scannerTimer !== undefined) window.clearInterval(scannerTimer)
  scannerTimer = undefined
  stream?.getTracks().forEach((track) => track.stop())
  stream = undefined
  cameraOpen.value = false
}
async function validateQr() {
  reset()
  if (!qr.value) { err.value = 'Enter a QR code.'; return }
  busy.value = true
  try {
    const response = await api.post('/bookings/qr/validate', { qr_code: qr.value })
    msg.value = `QR validated for booking #${(response.data.data ?? response.data).id}.`
  } catch (error: any) {
    err.value = error.response?.data?.message ?? 'QR code is not valid.'
  } finally { busy.value = false }
}
async function startCamera() {
  reset()
  const Detector = (window as any).BarcodeDetector
  if (!Detector || !navigator.mediaDevices?.getUserMedia) {
    err.value = 'Camera QR scanning is not supported by this browser. Paste the QR code instead.'
    return
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } })
    cameraOpen.value = true
    await nextTick()
    if (!cameraVideo.value) return
    cameraVideo.value.srcObject = stream
    await cameraVideo.value.play()
    const detector = new Detector({ formats: ['qr_code'] })
    scannerTimer = window.setInterval(async () => {
      if (!cameraVideo.value || busy.value) return
      const codes = await detector.detect(cameraVideo.value)
      const value = codes[0]?.rawValue
      if (value) { qr.value = value; stopCamera(); await validateQr() }
    }, 350)
  } catch {
    stopCamera()
    err.value = 'Camera access was not granted. Paste the QR code instead.'
  }
}
async function checkIn() {
  reset()
  if (!bookingId.value) { err.value = 'Select a booking.'; return }
  busy.value = true
  try {
    await api.post('/check-ins', { booking_id: bookingId.value, method: 'front-desk' })
    msg.value = 'Guest checked in.'
  } catch (error: any) {
    err.value = error.response?.data?.message ?? 'Check-in failed.'
  } finally { busy.value = false }
}
async function joinWaitlist() {
  reset()
  if (!courtId.value || !starts.value || !ends.value) { err.value = 'Select a court, start, and end.'; return }
  busy.value = true
  try {
    await api.post('/bookings/waitlist', { court_id: courtId.value, starts_at: starts.value, ends_at: ends.value })
    msg.value = 'Guest added to the waitlist.'
  } catch (error: any) {
    err.value = error.response?.data?.message ?? 'Waitlist request failed.'
  } finally { busy.value = false }
}
onUnmounted(stopCamera)
</script>

<template>
  <header class="page-header"><div><p class="eyebrow">FRONT DESK</p><h1>Check-in &amp; Waitlist</h1><p class="muted">Validate booking QR codes, check in confirmed bookings, and add a guest to a court waitlist.</p></div></header>
  <p v-if="msg" class="action-message success">{{ msg }}</p><p v-if="err" class="action-message error">{{ err }}</p>
  <section class="settings-grid">
    <article class="panel membership-form"><h2>Validate QR</h2><form @submit.prevent="validateQr"><label>QR code<input v-model="qr" placeholder="Scan or paste code" /></label><div v-if="cameraOpen"><video ref="cameraVideo" autoplay muted playsinline style="width: 100%; border-radius: 8px" /><button class="table-button" type="button" @click="stopCamera">Stop camera</button></div><button v-else class="table-button" type="button" @click="startCamera">Use camera</button><button class="secondary-button" :disabled="busy">Validate QR</button></form></article>
    <article class="panel membership-form"><h2>Manual check-in</h2><form @submit.prevent="checkIn"><label>Confirmed booking<select v-model.number="bookingId"><option :value="undefined">Select booking</option><option v-for="booking in confirmed" :key="booking.id" :value="booking.id">{{ booking.reference }} · Court #{{ booking.court_id }} · {{ booking.starts_at }}</option></select></label><button class="primary-button" :disabled="busy">Check in</button></form></article>
    <article class="panel membership-form"><h2>Add to waitlist</h2><form @submit.prevent="joinWaitlist"><label>Court<select v-model.number="courtId"><option :value="undefined">Select court</option><option v-for="court in courts" :key="court.id" :value="court.id">{{ court.branch }} · {{ court.name }}</option></select></label><label>Starts<input v-model="starts" type="datetime-local" /></label><label>Ends<input v-model="ends" type="datetime-local" /></label><button class="secondary-button" :disabled="busy">Add to waitlist</button></form></article>
  </section>
</template>
