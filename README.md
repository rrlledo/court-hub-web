# Court Hub Web

Vue 3 + TypeScript + Vite frontend for the Court Hub Laravel API.

## Start locally

1. Start the backend from `../backend` with `php artisan serve`.
2. Copy `.env.example` to `.env` and change `VITE_API_BASE_URL` only if the backend is not at `http://127.0.0.1:8000/api/v1`.
3. Install dependencies and start the web application:

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Use **Create facility account** to create a tenant owner, or sign in with an existing account. See [USER_GUIDE.md](USER_GUIDE.md) for first-time setup and day-to-day instructions.

## API base URLs

| Target | Base URL |
| --- | --- |
| Local browser | `http://127.0.0.1:8000/api/v1` |
| Android emulator | `http://10.0.2.2:8000/api/v1` |
| Staging | `https://api.staging.example.com/api/v1` (replace with the deployed hostname) |
| Production | `https://api.example.com/api/v1` (replace with the deployed hostname) |

## Local, staging, and production environments

Copy `.env.local.example` to `.env.local` for local development. For staging, copy `.env.staging.example` to `.env.staging` and use `npm run dev:staging` or `npm run build:staging`. For production, populate `.env.production` from its template on the CI runner and use `npm run build`. `VITE_API_BASE_URL` is public browser configuration, so it must never contain a secret; a rebuild is required after changing it. See [`../docs/ENVIRONMENTS.md`](../docs/ENVIRONMENTS.md) for the complete process.

Before a live web release, follow [`../docs/PRODUCTION_LAUNCH_REQUIREMENTS.md`](../docs/PRODUCTION_LAUNCH_REQUIREMENTS.md) for required service accounts, payment and email setup, hosting, pricing references, browser limitations, and acceptance checks.

See [FUNCTIONALITY_AUDIT.md](FUNCTIONALITY_AUDIT.md) for implemented workflows and advanced backend endpoints that still need dedicated UI screens.

## Role-based user guides

Step-by-step guides for Super Admin, Court Owner, Facility Manager, Front Desk, Coach, Event Organizer, and Player are in [`../docs/user-guides/README.md`](../docs/user-guides/README.md). The guides identify the web and mobile workspace for each role and their access boundaries.

## Current foundation

- Secure bearer-token session handling and authenticated route guard
- Facility-account registration and password recovery/reset screens
- Email-verification resend, two-factor disable, and online/walk-in/QR booking modes
- Laravel API client configured by `VITE_API_BASE_URL`
- Responsive operations dashboard wired to `/reports/dashboard`
- Guided organization, facility, branch, and active-court setup backed by the Laravel API
- Complete booking workflow: visual court timeline, availability, online/walk-in/QR reservation creation, confirmation, cancellation, rescheduling, recurring schedules, refund requests, QR codes, and personal history
- Player booking checkout through PayMongo, with server-side status refresh after returning from the hosted checkout
- Membership plan setup, signed-in-user activation, card generation, session usage/history, freeze/resume, renewal, and cancellation
- Tenant user creation, role assignment, removal, and member selection during membership activation
- Rental inventory, equipment checkout, and return processing
- Membership payment-intent creation, payment visibility, refund requests, searchable payment invoices, provider visibility, and reconciliation summaries
- Account profile, password, authenticator-app, and device-session settings
- Coach profiles, coaching-session scheduling, completion, cancellation, searchable coach availability controls, and revenue summaries
- Tournament creation, player registration, match scheduling, bracket view, and result recording
- Facility editing/deletion, picker-based operations, court-type catalog setup, closures, maintenance lifecycle management, and pricing-rule management
- Dashboard and date-filtered operational reporting
- In-app notification inbox and delivery preferences
- Booking rescheduling and QR-code generation
- Front-desk QR validation, manual check-in, and waitlisting
- Navigation shells for coaching, tournament, rental, reporting, and settings modules
- Form validation foundation with Zod and API data-query foundation with TanStack Query

## Build

```powershell
npm run build
```

## Remaining web refinements

The web app adapts its navigation, grids, forms, and touch targets for tablet and phone widths. Sign-in asks for an authenticator code when the API requires it. Front desk can scan a QR code through browsers that implement `BarcodeDetector`, with a manual-code fallback. Rentals and tournament match scheduling use player, inventory, facility, branch, and court selectors.
