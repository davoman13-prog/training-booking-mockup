import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const catalogHookUrl = new URL("../legacy-src/hooks/useCatalog.ts", import.meta.url);
const courseFormUrl = new URL(
  "../legacy-src/pages/admin/CourseFormPage.tsx",
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
