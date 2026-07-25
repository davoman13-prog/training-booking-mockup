# Kalu Training — Engineering Roadmap

This file records agreed cross-cutting work that should be completed before the
system is considered production-ready. It is deliberately separate from
individual feature work so that these requirements are not lost.

## Near-term: scalable list management

Replace whole-table loading and client-only filtering on every potentially
large administrative list with database-backed pagination.

Initial scope:

- Delegates
- Bookings
- Sessions and attendance
- Course waiting lists
- Invoices
- Certificates
- Audit and reporting lists where result sets can grow without a fixed bound

Expected behaviour:

- Fetch only the current page from the database.
- Default to 50 rows per page, with 25, 50, and 100 row options where useful.
- Apply search, filters, and sorting in the database before pagination.
- Show the result total and current range, for example
  `Showing 51–100 of 1,248`.
- Provide accessible previous/next and page navigation.
- Preserve search, filters, sort order, and page size while navigating.
- Return to a valid page when filtering or deletion reduces the result count.
- Add appropriate database indexes for the supported searches and sort orders.
- Test empty, single-page, multi-page, filtered, and boundary-page cases.

Pagination must be implemented as a coordinated pattern shared by lists rather
than as unrelated page-by-page fixes.

## Before production readiness: complete performance review

Perform an end-to-end performance review after the principal workflows and data
model are stable, and resolve material findings before production sign-off.

The review must include:

- Database query plans, indexes, query counts, and avoidance of N+1 queries.
- Realistic-volume testing for delegates, bookings, sessions, waiting lists,
  emails, invoices, certificates, and audit history.
- API response times, response sizes, validation cost, and error behaviour.
- Frontend bundle size, route loading, unnecessary rerenders, large table
  rendering, and network request duplication.
- PDF generation, file storage/download performance, and email dispatch so
  slow external work does not hold up interactive requests unnecessarily.
- Authentication/session checks and rate limiting under expected concurrency.
- Caching opportunities without risking stale or cross-user data.
- Sites runtime limits, database/storage limits, and operational monitoring.
- Core Web Vitals and representative desktop/mobile browser performance.
- Load, stress, and soak tests against production-like data, including agreed
  performance targets and recorded results.

Performance should be checked continuously during feature work. This final
review is the formal production-readiness gate, not the first time performance
is considered.
