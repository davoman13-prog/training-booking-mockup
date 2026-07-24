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
  assert.match(rules, /session\.attendeeCount < minimum/);
  assert.match(route, /SESSION_HAS_BOOKINGS/);
  assert.match(route, /existing\.attendeeCount > 0/);
});
