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
const authSessionUrl = new URL("../app/api/auth/session/route.ts", import.meta.url);
const authCoreUrl = new URL("../app/api/auth/auth.ts", import.meta.url);
const authLoginUrl = new URL("../app/api/auth/login/route.ts", import.meta.url);
const authRegisterUrl = new URL("../app/api/auth/register/route.ts", import.meta.url);
const appUrl = new URL("../legacy-src/App.tsx", import.meta.url);
const loginUrl = new URL("../legacy-src/pages/delegate/LoginPage.tsx", import.meta.url);
const catalogRouteUrl = new URL("../app/api/catalog/route.ts", import.meta.url);
const courseCreateUrl = new URL("../app/api/courses/route.ts", import.meta.url);

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
  const [form, createRoute, updateRoute] = await Promise.all([
    readFile(bookingFormUrl, "utf8"),
    readFile(bookingCreateUrl, "utf8"),
    readFile(bookingUpdateUrl, "utf8"),
  ]);
  assert.match(form, /fetch\('\/api\/bookings'/);
  assert.match(createRoute, /DUPLICATE_BOOKING/);
  assert.match(createRoute, /available_seats = available_seats - 1/);
  assert.match(updateRoute, /attendee_count = MAX\(0, attendee_count - 1\)/);
  assert.match(updateRoute, /available_seats = available_seats \+ 1/);
  assert.match(updateRoute, /session is unavailable or full/);
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
