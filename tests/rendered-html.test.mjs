import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalogHookUrl = new URL("../legacy-src/hooks/useCatalog.ts", import.meta.url);
const courseFormUrl = new URL(
  "../legacy-src/pages/admin/CourseFormPage.tsx",
  import.meta.url,
);
const sessionFormUrl = new URL(
  "../legacy-src/pages/admin/SessionFormPage.tsx",
  import.meta.url,
);
const sessionPayloadUrl = new URL(
  "../app/api/sessions/sessionPayload.ts",
  import.meta.url,
);
const sessionRouteUrl = new URL(
  "../app/api/sessions/[sessionId]/route.ts",
  import.meta.url,
);
const sessionRulesUrl = new URL(
  "../legacy-src/utils/sessionRules.ts",
  import.meta.url,
);
const locationFormUrl = new URL("../legacy-src/pages/admin/LocationFormPage.tsx", import.meta.url);
const trainerFormUrl = new URL("../legacy-src/pages/admin/TrainerFormPage.tsx", import.meta.url);
const locationRouteUrl = new URL("../app/api/locations/[locationId]/route.ts", import.meta.url);
const trainerRouteUrl = new URL("../app/api/trainers/[trainerId]/route.ts", import.meta.url);
const trainerDetailUrl = new URL("../legacy-src/pages/admin/TrainerDetailPage.tsx", import.meta.url);
const registerUrl = new URL("../legacy-src/pages/delegate/RegisterPage.tsx", import.meta.url);
const delegateDetailUrl = new URL("../legacy-src/pages/admin/DelegateDetailPage.tsx", import.meta.url);
const delegateRouteUrl = new URL("../app/api/delegates/[delegateId]/route.ts", import.meta.url);
const bookingFormUrl = new URL("../legacy-src/pages/delegate/BookingFormPage.tsx", import.meta.url);
const bookingCreateUrl = new URL("../app/api/bookings/route.ts", import.meta.url);
const bookingUpdateUrl = new URL("../app/api/bookings/[bookingId]/route.ts", import.meta.url);
const bookingCancelUrl = new URL("../app/api/bookings/[bookingId]/cancel/route.ts", import.meta.url);
const courseDetailUrl = new URL("../legacy-src/pages/delegate/CourseDetailPage.tsx", import.meta.url);
const bookingConfirmationUrl = new URL("../legacy-src/pages/delegate/BookingConfirmationPage.tsx", import.meta.url);
const trainingDetailUrl = new URL("../legacy-src/pages/delegate/TrainingDetailPage.tsx", import.meta.url);
const delegateDashboardUrl = new URL("../legacy-src/pages/delegate/DashboardPage.tsx", import.meta.url);
const myBookingsUrl = new URL("../legacy-src/pages/delegate/MyBookingsPage.tsx", import.meta.url);
const certificatesUrl = new URL("../legacy-src/pages/delegate/CertificatesPage.tsx", import.meta.url);
const invoicesUrl = new URL("../legacy-src/pages/delegate/InvoicesPage.tsx", import.meta.url);
const accountPageUrl = new URL("../legacy-src/pages/delegate/AccountPage.tsx", import.meta.url);
const accountProfileUrl = new URL("../app/api/account/profile/route.ts", import.meta.url);
const accountPasswordUrl = new URL("../app/api/account/password/route.ts", import.meta.url);
const adminDashboardUrl = new URL("../legacy-src/pages/admin/DashboardPage.tsx", import.meta.url);
const authSessionUrl = new URL("../app/api/auth/session/route.ts", import.meta.url);
const authCoreUrl = new URL("../app/api/auth/auth.ts", import.meta.url);
const authLoginUrl = new URL("../app/api/auth/login/route.ts", import.meta.url);
const authRegisterUrl = new URL("../app/api/auth/register/route.ts", import.meta.url);
const appUrl = new URL("../legacy-src/App.tsx", import.meta.url);
const loginUrl = new URL("../legacy-src/pages/delegate/LoginPage.tsx", import.meta.url);
const catalogRouteUrl = new URL("../app/api/catalog/route.ts", import.meta.url);
const courseCreateUrl = new URL("../app/api/courses/route.ts", import.meta.url);
const attendanceRouteUrl = new URL("../app/api/attendance/[bookingId]/route.ts", import.meta.url);
const invoiceRouteUrl = new URL("../app/api/invoices/[invoiceId]/route.ts", import.meta.url);
const certificateRouteUrl = new URL("../app/api/certificates/[certificateId]/route.ts", import.meta.url);
const schemaUrl = new URL("../db/schema.ts", import.meta.url);
const financeMigrationUrl = new URL("../drizzle/0005_fair_stranger.sql", import.meta.url);
const emailCodeUrl = new URL("../app/api/auth/email.ts", import.meta.url);
const verifyEmailUrl = new URL("../app/api/auth/verify-email/route.ts", import.meta.url);
const forgotPasswordUrl = new URL("../app/api/auth/forgot-password/route.ts", import.meta.url);
const resetPasswordUrl = new URL("../app/api/auth/reset-password/route.ts", import.meta.url);
const emailMigrationUrl = new URL("../drizzle/0006_flowery_iron_man.sql", import.meta.url);
const verifyEmailPageUrl = new URL("../legacy-src/pages/delegate/VerifyEmailPage.tsx", import.meta.url);
const forgotPasswordPageUrl = new URL("../legacy-src/pages/delegate/ForgotPasswordPage.tsx", import.meta.url);
const bookingEmailUrl = new URL("../app/api/bookings/bookingConfirmationEmail.ts", import.meta.url);
const joiningMigrationUrl = new URL("../drizzle/0007_good_talisman.sql", import.meta.url);

test("catalogue refresh always reads current server data", async () => {
  const hook = await readFile(catalogHookUrl, "utf8");

  assert.match(hook, /const refresh = useCallback\(async/);
  assert.match(hook, /cache:\s*"no-store"/);
  assert.match(hook, /setCatalog\(data\)/);
  assert.match(hook, /setIsLive\(true\)/);
  assert.match(hook, /setIsLoading\(false\)/);
  assert.match(hook, /return \{ \.\.\.catalog, isLive, isLoading, loadError, refresh \}/);
});

test("course form waits for live data and refreshes after saving", async () => {
  const form = await readFile(courseFormUrl, "utf8");

  const refreshIndex = form.indexOf("await refresh()");
  const savedIndex = form.indexOf("setSaved(true)");

  assert.ok(refreshIndex >= 0, "the form must reload the catalogue after saving");
  assert.ok(
    savedIndex > refreshIndex,
    "success must only be reported after the saved record has been read back",
  );
  assert.match(form, /isLoading && !isLive/);
  assert.match(form, /Loading the latest course details/);
  assert.match(form, /key=\{course \? \[/);
  assert.match(form, /course\.price \?\? ''/);
  assert.match(form, /course\.minimumAttendees \?\? ''/);
  assert.match(form, /course\.tags\.join\('\|'\)/);
});

test("derived active state cannot conflict with course status", async () => {
  const form = await readFile(courseFormUrl, "utf8");

  assert.match(
    form,
    /value=\{course && course\.status !== 'cancelled' && course\.status !== 'completed' \? 'active' : 'inactive'\} disabled/,
  );
  assert.match(form, /aria-label="Active state is derived from status"/);
});

test("session form saves to the live API and reads the record back", async () => {
  const form = await readFile(sessionFormUrl, "utf8");

  assert.match(form, /fetch\(editing \? `\/api\/sessions\/\$\{session!\.id\}` : '\/api\/sessions'/);
  assert.match(form, /await refresh\(\)/);
  assert.match(form, /Session saved to the live catalogue\./);
  assert.match(form, /name="availableSeats"[\s\S]*disabled/);
  assert.match(form, /Math\.max\(Number\(formState\.capacity/);
  assert.match(form, /status: 'scheduled'/);
  assert.match(form, /attendeeCount: '0'/);
  assert.match(form, /startDate: ''/);
});

test("session API rejects inconsistent dates and capacity", async () => {
  const payload = await readFile(sessionPayloadUrl, "utf8");

  assert.match(payload, /End date cannot be before the start date/);
  assert.match(payload, /End time must be after the start time/);
  assert.match(payload, /Capacity must be at least 1/);
  assert.match(payload, /Booked count cannot be greater than capacity/);
  assert.match(payload, /availableSeats: payload\.capacity! - attendeeCount/);
});

test("session summaries and removal rules use live attendee counts", async () => {
  const [form, rules, route] = await Promise.all([
    readFile(sessionFormUrl, "utf8"),
    readFile(sessionRulesUrl, "utf8"),
    readFile(sessionRouteUrl, "utf8"),
  ]);

  assert.match(form, /\{session\.attendeeCount\}/);
  assert.match(form, /const spacesRemaining = session\?\.availableSeats \?\? 0/);
  assert.match(form, /Confirm removal/);
  assert.doesNotMatch(form, /window\.confirm/);
  assert.match(rules, /session\.attendeeCount < minimum/);
  assert.match(route, /SESSION_HAS_BOOKINGS/);
  assert.match(route, /existing\.attendeeCount > 0/);
});

test("location and trainer forms save and refresh live records", async () => {
  const [locationForm, trainerForm] = await Promise.all([
    readFile(locationFormUrl, "utf8"),
    readFile(trainerFormUrl, "utf8"),
  ]);
  assert.match(locationForm, /fetch\(editing \? `\/api\/locations/);
  assert.match(locationForm, /Location saved to the live catalogue/);
  assert.match(locationForm, /await refresh\(\)/);
  assert.match(trainerForm, /fetch\(editing \? `\/api\/trainers/);
  assert.match(trainerForm, /Trainer saved to the live catalogue/);
  assert.match(trainerForm, /approvedCourseIds/);
});

test("linked locations and trainers are protected from deletion", async () => {
  const [locationRoute, trainerRoute, trainerDetail] = await Promise.all([
    readFile(locationRouteUrl, "utf8"),
    readFile(trainerRouteUrl, "utf8"),
    readFile(trainerDetailUrl, "utf8"),
  ]);
  assert.match(locationRoute, /courses or sessions are linked/);
  assert.match(locationRoute, /sessions\.locationId/);
  assert.match(trainerRoute, /sessions\.trainerId/);
  assert.match(trainerRoute, /Mark the trainer inactive instead/);
  assert.match(trainerDetail, /Confirm removal/);
  assert.match(trainerDetail, /linked to session history and cannot be removed/);
});

test("delegate registration and admin edits use live APIs", async () => {
  const [registration, detail, route] = await Promise.all([
    readFile(registerUrl, "utf8"),
    readFile(delegateDetailUrl, "utf8"),
    readFile(delegateRouteUrl, "utf8"),
  ]);
  assert.match(registration, /fetch\('\/api\/auth\/register'/);
  assert.match(detail, /fetch\(`\/api\/delegates\/\$\{delegate\.id\}`/);
  assert.match(detail, /await refresh\(\)/);
  assert.match(route, /DELEGATE_HAS_BOOKINGS/);
});

test("booking creation and cancellation keep session capacity in sync", async () => {
  const [form, createRoute, updateRoute, cancelRoute, courseDetail, confirmation, trainingDetail] = await Promise.all([
    readFile(bookingFormUrl, "utf8"),
    readFile(bookingCreateUrl, "utf8"),
    readFile(bookingUpdateUrl, "utf8"),
    readFile(bookingCancelUrl, "utf8"),
    readFile(courseDetailUrl, "utf8"),
    readFile(bookingConfirmationUrl, "utf8"),
    readFile(trainingDetailUrl, "utf8"),
  ]);
  assert.match(form, /fetch\('\/api\/bookings'/);
  assert.match(createRoute, /DUPLICATE_BOOKING/);
  assert.match(createRoute, /available_seats = available_seats - 1/);
  assert.match(updateRoute, /attendee_count = MAX\(0, attendee_count - 1\)/);
  assert.match(updateRoute, /available_seats = available_seats \+ 1/);
  assert.match(updateRoute, /session is unavailable or full/);
  assert.match(cancelRoute, /currentDelegate\(request\)/);
  assert.match(cancelRoute, /booking\.delegate_id !== delegate\.id/);
  assert.match(cancelRoute, /available_seats = available_seats \+ 1/);
  assert.doesNotMatch(courseDetail, /data\/mockData/);
  assert.doesNotMatch(confirmation, /data\/mockData/);
  assert.match(confirmation, /bookingId/);
  assert.match(trainingDetail, /\/cancel/);
});

test("delegate accounts use hashed passwords and secure server sessions", async () => {
  const [sessionRoute, authCore, loginRoute, registerRoute, app, login, registration, bookingRoute] = await Promise.all([
    readFile(authSessionUrl, "utf8"),
    readFile(authCoreUrl, "utf8"),
    readFile(authLoginUrl, "utf8"),
    readFile(authRegisterUrl, "utf8"),
    readFile(appUrl, "utf8"),
    readFile(loginUrl, "utf8"),
    readFile(registerUrl, "utf8"),
    readFile(bookingCreateUrl, "utf8"),
  ]);
  assert.match(sessionRoute, /currentDelegate\(request\)/);
  assert.match(authCore, /PBKDF2/);
  assert.match(authCore, /iterations: 100_000/);
  assert.match(authCore, /HttpOnly; Secure; SameSite=Lax/);
  assert.match(authCore, /token_hash/);
  assert.match(loginRoute, /MAX_ATTEMPTS = 5/);
  assert.match(loginRoute, /ACCOUNT_LOCKED/);
  assert.match(registerRoute, /hashPassword/);
  assert.match(registerRoute, /delegate_auth_accounts/);
  assert.match(app, /fetch\('\/api\/auth\/session'/);
  assert.match(app, /result\.authenticated && result\.user/);
  assert.doesNotMatch(app, /kalu-training-mock-user/);
  assert.match(login, /A ChatGPT account is not required/);
  assert.match(login, /fetch\('\/api\/auth\/login'/);
  assert.match(registration, /fetch\('\/api\/auth\/register'/);
  assert.match(registration, /minLength=\{12\}/);
  assert.match(bookingRoute, /currentDelegate\(request\)/);
  assert.doesNotMatch(bookingRoute, /payload\.delegateId/);
});

test("administrator access uses unified login and protected server sessions", async () => {
  const [authLogin, authCore, session, app, login, courseCreate, bookingUpdate, catalog] = await Promise.all([
    readFile(authLoginUrl, "utf8"),
    readFile(authCoreUrl, "utf8"),
    readFile(authSessionUrl, "utf8"),
    readFile(appUrl, "utf8"),
    readFile(loginUrl, "utf8"),
    readFile(courseCreateUrl, "utf8"),
    readFile(bookingUpdateUrl, "utf8"),
    readFile(catalogRouteUrl, "utf8"),
  ]);
  assert.match(authLogin, /MAX_ATTEMPTS = 5/);
  assert.match(authLogin, /ACCOUNT_LOCKED/);
  assert.match(authCore, /kalu_admin_session/);
  assert.match(authCore, /HttpOnly; Secure; SameSite=Strict/);
  assert.match(session, /currentAdmin\(request\).*currentDelegate\(request\)/s);
  assert.doesNotMatch(app, /localStorage/);
  assert.doesNotMatch(login, /mockUsers|Password123|admin@kalu\.test/);
  assert.match(login, /result\.user\.role === 'admin'/);
  assert.doesNotMatch(login, /Administration|Admin login|Create first administrator|\/api\/auth\/admin/);
  assert.match(authLogin, /createAdminSession/);
  assert.match(authLogin, /admin_auth_accounts/);
  assert.match(courseCreate, /requireAdmin\(request\)/);
  assert.match(bookingUpdate, /requireAdmin\(request\)/);
  assert.match(catalog, /visibleBookings/);
  assert.match(catalog, /visibleDelegates/);
});

test("delegate account pages never mix live records with prototype finance data", async () => {
  const pages = await Promise.all([
    readFile(delegateDashboardUrl, "utf8"),
    readFile(myBookingsUrl, "utf8"),
    readFile(trainingDetailUrl, "utf8"),
    readFile(certificatesUrl, "utf8"),
    readFile(invoicesUrl, "utf8"),
  ]);
  for (const page of pages) assert.doesNotMatch(page, /data\/mockData/);
  assert.match(pages[0], /Invoices recorded/);
  assert.match(pages[1], /invoices\.find\(\(item\) => item\.bookingId === booking\.id\)/);
  assert.match(pages[1], /attendanceRecords\.find/);
  assert.match(pages[1], /certificates\.find/);
  assert.match(pages[3], /Only certificates genuinely linked/);
  assert.match(pages[4], /Only invoices genuinely linked/);
});

test("attendance, invoices and certificates are persistent and protected", async () => {
  const [schema, migration, booking, attendance, invoice, certificate, catalog] = await Promise.all([
    readFile(schemaUrl, "utf8"),
    readFile(financeMigrationUrl, "utf8"),
    readFile(bookingCreateUrl, "utf8"),
    readFile(attendanceRouteUrl, "utf8"),
    readFile(invoiceRouteUrl, "utf8"),
    readFile(certificateRouteUrl, "utf8"),
    readFile(catalogRouteUrl, "utf8"),
  ]);
  assert.match(schema, /attendance_records/);
  assert.match(schema, /invoices/);
  assert.match(schema, /certificates/);
  assert.match(migration, /INSERT INTO `attendance_records`/);
  assert.match(migration, /INSERT INTO `invoices`/);
  assert.match(migration, /INSERT INTO `certificates`/);
  assert.match(booking, /INSERT INTO attendance_records/);
  assert.match(booking, /INSERT INTO invoices/);
  for (const route of [attendance, invoice, certificate]) {
    assert.match(route, /currentAdmin|requireAdmin/);
  }
  assert.match(attendance, /INSERT INTO certificates/);
  assert.match(attendance, /status = \?, updated_at/);
  assert.match(catalog, /attendanceRecords:/);
  assert.match(catalog, /invoices:/);
  assert.match(catalog, /certificates:/);
  assert.doesNotMatch(catalog, /data\/mockData|seedCatalogIfEmpty/);
});

test("delegates can securely maintain their own profile and password", async () => {
  const [page, profile, password] = await Promise.all([
    readFile(accountPageUrl, "utf8"),
    readFile(accountProfileUrl, "utf8"),
    readFile(accountPasswordUrl, "utf8"),
  ]);
  assert.match(profile, /currentDelegate\(request\)/);
  assert.match(profile, /WHERE id = \?/);
  assert.doesNotMatch(profile, /SET email =/);
  assert.match(password, /verifyPassword\(payload\.currentPassword/);
  assert.match(password, /hashPassword\(payload\.newPassword/);
  assert.match(password, /DELETE FROM delegate_auth_sessions.*id != \?/s);
  assert.match(page, /fetch\('\/api\/account\/profile'/);
  assert.match(page, /fetch\('\/api\/account\/password'/);
  assert.match(page, /Email changes will be enabled with email verification/);
});

test("administration dashboard waits for live data and uses the real current date", async () => {
  const [dashboard, hook, rules] = await Promise.all([
    readFile(adminDashboardUrl, "utf8"),
    readFile(catalogHookUrl, "utf8"),
    readFile(sessionRulesUrl, "utf8"),
  ]);
  assert.doesNotMatch(dashboard, /data\/mockData|mock interface/);
  assert.match(dashboard, /if \(isLoading\)/);
  assert.match(dashboard, /if \(!isLive\)/);
  assert.match(dashboard, /new Date\(\)\.toISOString\(\)\.slice\(0, 7\)/);
  assert.doesNotMatch(hook, /fallbackCourses|fallbackCatalog|data\/mockData/);
  assert.match(hook, /courses: \[\], locations: \[\]/);
  assert.doesNotMatch(rules, /mockCurrentDate|data\/mockData/);
  assert.match(rules, /const now = new Date\(\)/);
});

test("email verification and password recovery use expiring protected codes", async () => {
  const [codes, verification, forgot, reset, migration, verifyPage, forgotPage, register, login] = await Promise.all([
    readFile(emailCodeUrl, "utf8"),
    readFile(verifyEmailUrl, "utf8"),
    readFile(forgotPasswordUrl, "utf8"),
    readFile(resetPasswordUrl, "utf8"),
    readFile(emailMigrationUrl, "utf8"),
    readFile(verifyEmailPageUrl, "utf8"),
    readFile(forgotPasswordPageUrl, "utf8"),
    readFile(authRegisterUrl, "utf8"),
    readFile(authLoginUrl, "utf8"),
  ]);
  assert.match(codes, /CODE_LIFETIME_MINUTES = 15/);
  assert.match(codes, /MAX_CODE_ATTEMPTS = 5/);
  assert.match(codes, /MIN_RESEND_SECONDS = 60/);
  assert.match(codes, /hashSecurityCode\(code\)/);
  assert.doesNotMatch(codes, /INSERT INTO auth_email_codes[\s\S]*\bcode\b,/);
  assert.match(codes, /https:\/\/api\.brevo\.com\/v3\/smtp\/email/);
  assert.match(verification, /consumeCode/);
  assert.match(verification, /email_verified_at/);
  assert.match(forgot, /admin \? "admin" : "delegate"/);
  assert.match(forgot, /If an active account uses that email address/);
  assert.match(reset, /DELETE FROM admin_auth_sessions/);
  assert.match(reset, /DELETE FROM delegate_auth_sessions/);
  assert.match(migration, /auth_email_codes/);
  assert.match(migration, /UPDATE `delegate_auth_accounts` SET `email_verified_at`/);
  assert.match(register, /requiresVerification/);
  assert.match(login, /EMAIL_NOT_VERIFIED/);
  assert.match(verifyPage, /autoComplete="one-time-code"/);
  assert.match(forgotPage, /This works for delegate and administrator accounts/);
});

test("successful bookings send complete joining instructions without risking the booking", async () => {
  const [booking, email, courseForm, confirmation, migration] = await Promise.all([
    readFile(bookingCreateUrl, "utf8"),
    readFile(bookingEmailUrl, "utf8"),
    readFile(courseFormUrl, "utf8"),
    readFile(bookingConfirmationUrl, "utf8"),
    readFile(joiningMigrationUrl, "utf8"),
  ]);
  assert.match(migration, /joining_instructions/);
  assert.match(courseForm, /Joining instructions \/ special information/);
  assert.match(courseForm, /name="joiningInstructions"/);
  assert.match(email, /Booking reference/);
  assert.match(email, /Funding \/ price/);
  assert.match(email, /Joining instructions/);
  assert.match(email, /Venue information/);
  assert.match(email, /Your recorded requirements/);
  assert.match(email, /roomName, details\.locationName, details\.address, details\.city, details\.postcode/);
  assert.match(email, /escapeHtml/);
  assert.match(booking, /Booking succeeded but confirmation email failed/);
  assert.match(booking, /confirmationEmailSent/);
  assert.match(confirmation, /joining instructions have been emailed to you/);
});

test("delegates cannot book expired or cancelled training and receive cancellation emails", async () => {
  const [bookingCreate, bookingCancel, email, rules, bookingForm, courseDetail] = await Promise.all([
    readFile(bookingCreateUrl, "utf8"),
    readFile(bookingCancelUrl, "utf8"),
    readFile(bookingEmailUrl, "utf8"),
    readFile(sessionRulesUrl, "utf8"),
    readFile(bookingFormUrl, "utf8"),
    readFile(courseDetailUrl, "utf8"),
  ]);
  assert.match(bookingCreate, /course_status === "cancelled".*course_status === "completed"/s);
  assert.match(bookingCreate, /SESSION_PASSED/);
  assert.match(bookingCreate, /start_date >= date\('now'\)/);
  assert.match(bookingCreate, /courses\.status NOT IN \('cancelled', 'completed'\)/);
  assert.match(rules, /isPastSession/);
  assert.match(rules, /course\?\.status !== 'cancelled'/);
  assert.match(bookingForm, /canBookSession\(selectedSession, course\)/);
  assert.match(courseDetail, /canBookSession\(session, course\)/);
  assert.match(email, /Booking cancelled:/);
  assert.match(email, /Your place has been released/);
  assert.match(bookingCancel, /sendBookingCancellation/);
  assert.match(bookingCancel, /Booking cancellation succeeded but confirmation email failed/);
  assert.match(bookingCancel, /cancellationEmailSent/);
});
