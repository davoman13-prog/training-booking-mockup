# Training Course Booking System — Clickable Mockup Requirements

Create a clickable front-end mockup for a training course booking and administration system.

This is only a prototype.

Do not create:
- A real database
- A backend API
- Real authentication
- Payment processing
- Email sending
- Real PDF generation

Use static dummy data only.

## Technology

Use:
- React
- TypeScript
- Vite
- React Router
- Tailwind CSS

## Required Areas

Create two main areas:

1. Delegate area
2. Admin area

Use a simple role switcher in the header:
- Delegate view
- Admin view

## Delegate Pages

Create:

- Delegate dashboard
- Register page
- Login page
- Browse courses page
- Course detail page
- Booking form page
- Booking confirmation page
- My bookings page
- Certificate download mockup
- Invoice download mockup

## Admin Pages

Create:

- Admin dashboard
- Manage courses page
- Add/edit course form
- Manage course sessions page
- Add/edit session form
- Manage locations page
- Add/edit location form
- View bookings page
- Booking detail page
- Attendance marking page
- Certificate management page
- Invoice management page
- Reports page

## Course Rules

Courses can be:

- Funded
- Unfunded

Funded courses:
- Show “No payment required”
- Do not generate invoices

Unfunded courses:
- Show price
- Show minimum attendee requirement
- Show invoice trigger date
- Show cancellation cutoff date
- Invoices are only issued when minimum numbers are met
- If minimum numbers are not met by the cutoff date, show the course as at risk or cancelled

## Booking Form Fields

The booking form should include:

- Delegate name
- Delegate email
- Practice / organisation
- Practice manager name
- Practice manager email
- Special requirements
- Terms and conditions acceptance checkbox

## Admin Functions To Mock

The admin area should visually allow:

- Add/edit courses
- Add/edit sessions
- Add/edit locations
- View bookings
- Mark attendance
- Generate invoice mock
- Mark invoice paid
- Generate certificate mock
- View reports

These actions should only update local/mock UI state.

## Dummy Data Required

Create dummy data for:

- 6 courses
- 4 locations
- 10 course sessions
- 12 delegates
- 20 bookings
- 8 invoices
- 8 certificates

Include:

- Funded course
- Unfunded course
- Course awaiting minimum numbers
- Course at risk of cancellation
- Cancelled course
- Completed course
- Paid invoice
- Overdue invoice
- Certificate available
- Certificate pending

## Example Courses

Use course examples such as:

- Infection Control Refresher
- Safeguarding Level 2
- Emergency First Aid at Work
- Mental Health Awareness
- Data Protection and GDPR
- Leadership for Practice Managers

## Example Locations

Use UK-style examples:

- Leicester Training Centre
- Birmingham Clinical Skills Hub
- Nottingham Conference Suite
- Coventry Practice Training Room

## Navigation

Delegate navigation:

- Dashboard
- Browse Courses
- My Bookings
- Certificates
- Invoices

Admin navigation:

- Dashboard
- Courses
- Sessions
- Locations
- Bookings
- Attendance
- Certificates
- Invoices
- Reports

## Design Style

Use a clean professional business/admin style.

Use:
- Cards
- Tables
- Forms
- Status badges
- Dashboard summary cards
- Warning panels
- Responsive layout

## Final Requirement

The app must run with:

npm install
npm run dev

It must not depend on a database or backend.
