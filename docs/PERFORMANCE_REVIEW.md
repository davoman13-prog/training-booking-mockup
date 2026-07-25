# Kalu Training — Performance Review

Review date: 25 July 2026

## Outcome

The principal immediate scaling risk was the administration interface loading
and rendering every delegate and booking. Those registers now use protected
database pagination, database search/filtering/sorting, aggregate counts, and
bounded 25/50/100-row responses.

The shared catalogue endpoint also performed broad reads before applying
delegate ownership filters. It now authenticates first and constrains private
delegate bookings, waiting-list records, attendance, invoices, and certificates
in the database. Repeated per-delegate scans were replaced with a single
grouping pass.

## Changes completed

- Database-backed delegate pagination with aggregate booking/upcoming counts.
- Database-backed booking pagination with joined display information.
- A shared accessible pagination control and no-store paginated data hook.
- A 300 ms search debounce to avoid a request on every keystroke.
- Page bounds correction when filtering reduces the result count.
- Database indexes for common delegate, booking, session, waiting-list,
  attendance, invoice, and certificate access paths.
- Delegate-private catalogue queries now filter before data leaves the
  database.
- Removed repeated whole-array scans while constructing delegate summaries.

## Review findings

### Resolved high priority

1. Unbounded delegate and booking registers.
2. Private delegate data read broadly and filtered in application memory.
3. Repeated booking scans for every delegate.
4. Missing indexes on the most common relationship, status, and date columns.

### Follow-up measurement as data grows

Courses, locations, and trainers are comparatively small reference catalogues
at the current stage. Sessions, waiting lists, attendance, invoices,
certificates, reports, and audit history can grow without bound. Their current
screens must be moved onto the same database-pagination pattern before their
production datasets become large.

Email delivery and PDF creation occur after the principal database mutation and
do not roll back a successful booking, cancellation, waiting-list change, or
certificate record if the external service fails. At materially higher volume,
these operations should move to a durable background queue with retries and
delivery status.

## Production performance gate

Before general production launch, run load tests using production-like record
volumes and agree numeric targets for:

- authenticated page and API response latency;
- concurrent booking and waiting-list allocation;
- catalogue and search query plans;
- email/PDF throughput and retry behaviour;
- frontend route bundle size and Core Web Vitals;
- Sites database, storage, CPU, and request limits.

Record the dataset sizes, concurrency, percentile results, failures, and any
remediation. This repository review improves the known code paths but does not
pretend that synthetic production-load results exist before representative
data and traffic targets are available.
