# Court Hub Web User Guide

## Before you begin

The web app needs the Laravel API and its database to be running. From `../backend`:

```powershell
php artisan migrate --seed
php artisan serve
```

From this `frontend-web` directory:

```powershell
npm install
npm run dev
```

Open `http://127.0.0.1:5173`.

## Create your owner account

On the sign-in page, select **Create facility account**. Enter your facility name, your name, email, and a password of at least 12 characters. This creates a new tenant and assigns you the court-owner role.

After that, use the same email and password to sign in to Court Hub Web.

If you cannot sign in, select **Forgot password?** and submit your email address. Use the reset token from the configured email delivery channel in the Reset Password screen. During local development, Laravel’s default log mailer writes messages to `backend/storage/logs/laravel.log`.

## Set up your first court

Open **Facilities** in the left navigation. Complete the cards from left to right:

1. **Organization** — Enter the company or group that operates the courts, then select it.
2. **Facility** — Enter the venue name, optionally add its address, and select the new facility from the list.
3. **Branch** — Add the branch that will host bookable courts, then select it.
4. **Court** — Enter a court name, sport, and hourly price in Philippine pesos. Newly created courts are active by default.

Once the court appears in the list, it is ready to accept bookings.

## Create and manage a booking

Open **Bookings**:

1. Choose the booking date, facility, branch, and active court.
2. Review the court availability panel.
   - The **Daily court timeline** below it gives a visual view of the selected court's operating hours and active bookings. Change the date or court to update it.
3. Choose start and end times, optionally enter notes, and select **Reserve court**.
   - Select **Walk-in** for a front-desk reservation or **QR booking** for the equivalent QR-originated API workflow. These modes require the roles authorized by the backend.
4. A reservation is held for ten minutes. Authorized court owners, facility managers, and front-desk users can select **Confirm** before it expires.
5. Use **Cancel** when the booking will not proceed. Court Hub asks for confirmation before cancelling.
6. Use **Recurring reservation** to reserve the selected court on a weekly schedule. Use **Refund** on a confirmed booking to submit a refund request. Your prior reservations appear in **My booking history**.

Bookings are tenant-scoped: accounts in another tenant cannot see or modify them.

## Create and manage memberships

Open **Memberships** to configure recurring or session-based access.

1. In **Create plan**, enter a name, plan type, billing period, price, and duration. Session packages also require the number of included sessions.
2. Select a plan and member in **Activate membership**, choose a start date and optional auto-renewal, then activate it. Leaving the member field blank activates the plan for the signed-in user.
3. Use the membership-record actions to freeze, resume, renew, cancel, generate a card, or consume an available session.
4. Use **Session history** to select a membership and review every redeemed session, including the linked booking, user, timestamp, and notes.

Membership management actions are restricted by the backend to the roles authorized for that operation. A court owner account has access to the full web workflow.

## Manage staff and members

Open **Staff & Members** to create a tenant account. Enter the person’s name, email, password, and role.

- Use **player** for a regular member who will receive memberships and book courts.
- Use **facility manager** or **front desk** for operational staff.
- Use the role menu in the tenant-user list to change a person’s assigned role. A court owner cannot change their own role from the web interface.
- Use **Remove** to revoke a user’s access. Their access tokens are deleted by the backend.

After creating a player, return to **Memberships** and select them in the Member field while activating a plan.

## Rentals and payments

Open **Rentals** to add inventory and check out equipment. Inventory creation requires the branch ID; copy it from the branch data in Postman/API documentation until branch selection is added to this screen. Select an item, quantity, and optional due date to check it out. Use **Return** to close an active rental.

Open **Payments** to create a payment intent for an activated membership. Select the membership, amount, payment method, and supported provider (PayMongo or Xendit). The app records a pending intent; provider webhook processing updates the final payment status. Refund buttons create a refund request—they do not independently transfer funds. In **Payment operations**, enter a payment ID to view its invoice, or view the tenant reconciliation total and configured providers.

## Account settings

Open **Settings** to update your profile, resend an email-verification link, change your password, revoke a device session, or configure/disable two-factor authentication. For two-factor setup, scan or open the displayed provisioning URI with an authenticator app and submit its six-digit code. Changing your password revokes other sessions.

## Coaching, tournaments, and facility operations

- **Coaching:** Add a coach with an hourly rate, then select the coach and session times to schedule a lesson. Scheduled sessions can be completed or cancelled. In **Coach operations**, enter the coach ID to replace that coach's weekly availability with the entered time slot, or view completed-session revenue.
- **Tournaments:** Create a tournament using its branch ID, format, and start time. Players can use **Register me** while the tournament is open for registration. In **Match management**, select the tournament, schedule matches from its registrations, and record a score plus the winning player. The ordered Round and Match columns provide the operational bracket view.
- **Operations:** Select a facility, then its branch and court, before managing operating hours, closures, maintenance, or time-based pricing rules. Court types are managed as a reusable catalog with a name, sport, and description. These controls affect booking availability and pricing in the API.

Operations now uses facility, branch, and court pickers. Some specialized front-desk, rentals, and tournament forms still accept record IDs until their dedicated picker enhancement is completed.

## Reports, notifications, and booking enhancements

- **Reports:** Select a detailed report and optionally filter by start and end date. Dashboard metrics show current tenant summaries.
- **Notifications:** Read inbox messages, mark them read, and save email, SMS, or push preferences.
- **Bookings:** Use **Reschedule** to enter a new start and end time, or **QR code** to generate the code used by the check-in API. QR check-in scanning remains a planned dedicated front-desk screen.

## Front desk

Open **Front Desk** to validate a generated booking QR code, manually check in a confirmed booking by booking ID, or add a guest to a waitlist. These actions require an authorized court-owner, facility-manager, or front-desk account. Court and booking IDs are available from the booking records until picker controls are added.

## Account and access notes

- Sign in with a tenant-owner account to set up facilities and courts.
- Bearer-token sessions are stored only in the current browser profile. Select **Sign out** when you finish on a shared device.
- If the backend has two-factor authentication enabled for your account, include the current authenticator code when logging in through the API. A dedicated web 2FA prompt is a future enhancement.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| The sign-in screen cannot reach the API | Ensure `php artisan serve` is running at `http://127.0.0.1:8000`, or set `VITE_API_BASE_URL` in `.env`. |
| Facility lists are empty | Create and select an organization first. The selected account must have a manager role. |
| A reservation cannot be confirmed | Only an active `reserved` booking can be confirmed, and confirmation requires an authorized role. |
| Court is unavailable | Check the booking list, operating hours, holidays, and any maintenance windows in the backend. |

## Currently available web workflows

- Sign-in and secure session handling
- Organization, facility, branch, and court setup
- Court availability lookup
- Booking creation, confirmation, and cancellation
- Membership plan creation and membership lifecycle management
- Tenant user and role management, including assigning memberships to a selected tenant user
- Rental inventory and return processing
- Membership payment intents and refund requests
- Profile, password, two-factor, and device-session settings
- Coaching, tournaments, facility closures, maintenance, and pricing-rule creation
- Reporting, notification preferences, booking rescheduling, and QR-code generation

Coaching, tournaments, rentals, reporting detail, and settings remain planned frontend modules; their API endpoints are already available.
