import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../auth/auth";

const PAGE_SIZES = new Set([25, 50, 100]);

function queryValue(url: URL, name: string) {
  return (url.searchParams.get(name) ?? "").trim();
}

function pagination(url: URL) {
  const requestedPage = Number.parseInt(queryValue(url, "page"), 10);
  const requestedSize = Number.parseInt(queryValue(url, "pageSize"), 10);
  return {
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1,
    pageSize: PAGE_SIZES.has(requestedSize) ? requestedSize : 50,
  };
}

function whereClause(parts: string[]) {
  return parts.length ? ` WHERE ${parts.join(" AND ")}` : "";
}

async function pagedQuery(
  countSql: string,
  dataSql: string,
  bindings: unknown[],
  page: number,
  pageSize: number,
) {
  const count = await env.DB.prepare(countSql).bind(...bindings).first<{ total: number }>();
  const total = Number(count?.total ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const validPage = Math.min(page, pageCount);
  const result = await env.DB.prepare(`${dataSql} LIMIT ? OFFSET ?`)
    .bind(...bindings, pageSize, (validPage - 1) * pageSize)
    .all();
  return {
    items: result.results,
    pagination: { page: validPage, pageSize, total, pageCount },
  };
}

async function delegatesList(url: URL, page: number, pageSize: number) {
  const search = queryValue(url, "search").toLowerCase();
  const status = queryValue(url, "status");
  const parts: string[] = [];
  const bindings: unknown[] = [];
  if (search) {
    parts.push(`(
      lower(d.first_name || ' ' || d.last_name) LIKE ? OR lower(d.email) LIKE ? OR
      lower(coalesce(d.phone, '')) LIKE ? OR lower(d.organisation) LIKE ? OR
      lower(d.manager_name) LIKE ?
    )`);
    const term = `%${search}%`;
    bindings.push(term, term, term, term, term);
  }
  if (["active", "inactive", "anonymised"].includes(status)) {
    parts.push("d.account_status = ?");
    bindings.push(status);
  }
  const where = whereClause(parts);
  return pagedQuery(
    `SELECT count(*) AS total FROM delegates d${where}`,
    `SELECT d.id, trim(d.first_name || ' ' || d.last_name) AS name, d.email, d.phone,
       d.organisation, d.manager_name AS managerName, d.manager_email AS managerEmail,
       d.account_status AS accountStatus, d.can_login AS canLogin, d.can_book AS canBook,
       count(b.id) AS bookingCount,
       sum(CASE WHEN b.status <> 'cancelled' AND s.status = 'scheduled' THEN 1 ELSE 0 END) AS upcomingCount
     FROM delegates d
     LEFT JOIN bookings b ON b.delegate_id = d.id
     LEFT JOIN sessions s ON s.id = b.session_id
     ${where}
     GROUP BY d.id
     ORDER BY lower(d.last_name), lower(d.first_name), d.id`,
    bindings,
    page,
    pageSize,
  );
}

async function bookingsList(url: URL, page: number, pageSize: number) {
  const search = queryValue(url, "search").toLowerCase();
  const status = queryValue(url, "status");
  const parts: string[] = [];
  const bindings: unknown[] = [];
  if (search) {
    parts.push(`(
      lower(b.id) LIKE ? OR lower(d.first_name || ' ' || d.last_name) LIKE ? OR
      lower(d.email) LIKE ? OR lower(c.title) LIKE ?
    )`);
    const term = `%${search}%`;
    bindings.push(term, term, term, term);
  }
  if (["confirmed", "pending", "completed", "cancelled"].includes(status)) {
    parts.push("b.status = ?");
    bindings.push(status);
  }
  const joins = ` FROM bookings b
    JOIN delegates d ON d.id = b.delegate_id
    JOIN courses c ON c.id = b.course_id
    JOIN sessions s ON s.id = b.session_id
    JOIN locations l ON l.id = b.location_id`;
  const where = whereClause(parts);
  return pagedQuery(
    `SELECT count(*) AS total${joins}${where}`,
    `SELECT b.id, b.booking_date AS bookingDate, b.status,
       b.payment_required AS paymentRequired,
       trim(d.first_name || ' ' || d.last_name) AS delegateName,
       d.email AS delegateEmail, d.organisation,
       c.title AS courseTitle, s.start_date AS sessionDate, l.name AS locationName
     ${joins}${where}
     ORDER BY b.booking_date DESC, b.created_at DESC, b.id`,
    bindings,
    page,
    pageSize,
  );
}

export async function GET(request: Request, context: { params: Promise<{ resource: string }> }) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const { resource } = await context.params;
  const url = new URL(request.url);
  const { page, pageSize } = pagination(url);
  try {
    if (resource === "delegates") return Response.json(await delegatesList(url, page, pageSize));
    if (resource === "bookings") return Response.json(await bookingsList(url, page, pageSize));
    return Response.json({ code: "UNKNOWN_LIST", message: "That administrative list is not available." }, { status: 404 });
  } catch (error) {
    console.error("Paginated administrative list failed.", { resource, error });
    return Response.json(
      { code: "LIST_UNAVAILABLE", message: error instanceof Error ? error.message : "The list could not be loaded." },
      { status: 500 },
    );
  }
}
