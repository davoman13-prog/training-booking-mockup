import { env } from "cloudflare:workers";
import { sendTransactionalEmail } from "../auth/email";
import { CertificateDetails, certificateFilename, createCertificatePdf } from "./certificatePdf";

function base64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

export async function issueCertificate(certificateId: string) {
  const details = await env.DB.prepare(
    `SELECT cert.id AS certificateId, trim(d.first_name || ' ' || d.last_name) AS delegateName,
            d.email AS delegateEmail, c.title AS courseTitle, s.start_date AS startDate, s.end_date AS endDate,
            s.status AS sessionStatus, l.name AS locationName,
            trim(coalesce(t.first_name, '') || ' ' || coalesce(t.last_name, '')) AS trainerName,
            a.outcome AS attendanceOutcome
     FROM certificates cert
     JOIN bookings b ON b.id = cert.booking_id
     JOIN delegates d ON d.id = cert.delegate_id
     JOIN courses c ON c.id = cert.course_id
     JOIN sessions s ON s.id = b.session_id
     JOIN locations l ON l.id = b.location_id
     LEFT JOIN trainers t ON t.id = s.trainer_id
     JOIN attendance_records a ON a.booking_id = b.id
     WHERE cert.id = ?`,
  ).bind(certificateId).first<CertificateDetails & { sessionStatus: string; attendanceOutcome: string }>();
  if (!details) throw new Error("The certificate record was not found.");
  if (details.sessionStatus !== "completed") throw new Error("The session must be marked completed before certificates can be issued.");
  if (details.attendanceOutcome !== "attended") throw new Error("Certificates can only be issued to delegates marked attended.");

  const pdf = await createCertificatePdf(details);
  const filename = certificateFilename(details);
  const fileKey = `certificates/${certificateId}.pdf`;
  const files = (env as unknown as { FILES: R2Bucket }).FILES;
  await files.put(fileKey, pdf, { httpMetadata: { contentType: "application/pdf", contentDisposition: `attachment; filename="${filename}"` } });
  const now = new Date().toISOString();
  await env.DB.prepare(
    "UPDATE certificates SET status = 'issued', issued_date = ?, file_key = ?, updated_at = ? WHERE id = ?",
  ).bind(now.slice(0, 10), fileKey, now, certificateId).run();

  let emailSent = false;
  try {
    const subject = `Your Kalu Training certificate: ${details.courseTitle}`;
    await sendTransactionalEmail(
      details.delegateEmail,
      subject,
      `Hello ${details.delegateName},\n\nThank you for attending ${details.courseTitle}. Your certificate of attendance is attached.\n\nYou can also download it from My Certificates whenever you sign in to Kalu Training.`,
      `<p>Hello ${details.delegateName},</p><p>Thank you for attending <strong>${details.courseTitle}</strong>.</p><p>Your certificate of attendance is attached. You can also download it from <strong>My Certificates</strong> whenever you sign in to Kalu Training.</p><p>Kind regards,<br>Kalu Training</p>`,
      [{ name: filename, content: base64(pdf) }],
    );
    emailSent = true;
    await env.DB.prepare("UPDATE certificates SET emailed_at = ?, updated_at = ? WHERE id = ?").bind(now, now, certificateId).run();
  } catch (error) {
    console.error("Certificate was generated but email delivery failed.", { certificateId, error });
  }
  return { certificateId, emailSent, filename };
}
