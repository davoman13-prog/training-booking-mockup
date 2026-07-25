import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface CertificateDetails {
  certificateId: string;
  delegateName: string;
  delegateEmail: string;
  courseTitle: string;
  startDate: string;
  endDate: string;
  locationName: string;
  trainerName: string;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`));
}

function centre(pageWidth: number, font: { widthOfTextAtSize(text: string, size: number): number }, text: string, size: number) {
  return (pageWidth - font.widthOfTextAtSize(text, size)) / 2;
}

export async function createCertificatePdf(details: CertificateDetails) {
  const document = await PDFDocument.create();
  document.setTitle(`Certificate of Attendance - ${details.delegateName}`);
  document.setAuthor("Kalu Training");
  document.setSubject(details.courseTitle);
  const page = document.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  const italic = await document.embedFont(StandardFonts.HelveticaOblique);
  const navy = rgb(0.035, 0.12, 0.22);
  const teal = rgb(0.02, 0.53, 0.64);
  const pale = rgb(0.91, 0.98, 0.98);
  const gold = rgb(0.83, 0.63, 0.19);

  page.drawRectangle({ x: 24, y: 24, width: width - 48, height: height - 48, borderColor: navy, borderWidth: 3 });
  page.drawRectangle({ x: 33, y: 33, width: width - 66, height: height - 66, borderColor: teal, borderWidth: 1 });
  page.drawRectangle({ x: 48, y: height - 176, width: width - 96, height: 104, color: pale });
  page.drawCircle({ x: width / 2, y: height - 101, size: 31, color: teal });
  page.drawText("KT", { x: centre(width, bold, "KT", 22), y: height - 109, size: 22, font: bold, color: rgb(1, 1, 1) });
  page.drawText("KALU TRAINING", { x: centre(width, bold, "KALU TRAINING", 13), y: height - 145, size: 13, font: bold, color: navy, characterSpacing: 2 });

  page.drawText("CERTIFICATE", { x: centre(width, bold, "CERTIFICATE", 34), y: height - 245, size: 34, font: bold, color: navy });
  page.drawText("OF ATTENDANCE", { x: centre(width, regular, "OF ATTENDANCE", 16), y: height - 274, size: 16, font: regular, color: teal, characterSpacing: 3 });
  page.drawLine({ start: { x: 175, y: height - 295 }, end: { x: width - 175, y: height - 295 }, thickness: 2, color: gold });

  page.drawText("This is to confirm that", { x: centre(width, italic, "This is to confirm that", 15), y: height - 345, size: 15, font: italic, color: navy });
  const nameSize = details.delegateName.length > 34 ? 25 : 30;
  page.drawText(details.delegateName, { x: centre(width, bold, details.delegateName, nameSize), y: height - 397, size: nameSize, font: bold, color: teal });
  page.drawLine({ start: { x: 95, y: height - 410 }, end: { x: width - 95, y: height - 410 }, thickness: 0.8, color: rgb(0.7, 0.76, 0.8) });
  page.drawText("attended and completed", { x: centre(width, regular, "attended and completed", 15), y: height - 451, size: 15, font: regular, color: navy });

  const courseSize = details.courseTitle.length > 48 ? 19 : 23;
  page.drawText(details.courseTitle, { x: centre(width, bold, details.courseTitle, courseSize), y: height - 498, size: courseSize, font: bold, color: navy });
  const dates = details.startDate === details.endDate ? displayDate(details.startDate) : `${displayDate(details.startDate)} to ${displayDate(details.endDate)}`;
  page.drawText(`Delivered on ${dates}`, { x: centre(width, regular, `Delivered on ${dates}`, 13), y: height - 540, size: 13, font: regular, color: navy });
  page.drawText(`at ${details.locationName}`, { x: centre(width, regular, `at ${details.locationName}`, 13), y: height - 565, size: 13, font: regular, color: navy });

  page.drawRectangle({ x: 78, y: 145, width: width - 156, height: 94, color: pale, borderColor: rgb(0.78, 0.9, 0.91), borderWidth: 1 });
  page.drawText("Training delivered by", { x: 104, y: 204, size: 10, font: regular, color: rgb(0.35, 0.42, 0.48) });
  page.drawText(details.trainerName || "Kalu Training", { x: 104, y: 182, size: 13, font: bold, color: navy });
  page.drawText("Certificate reference", { x: 344, y: 204, size: 10, font: regular, color: rgb(0.35, 0.42, 0.48) });
  page.drawText(details.certificateId, { x: 344, y: 182, size: 8, font: regular, color: navy });
  page.drawText("Kalu Training | Certificate of Attendance", { x: centre(width, regular, "Kalu Training | Certificate of Attendance", 9), y: 72, size: 9, font: regular, color: rgb(0.35, 0.42, 0.48) });

  return document.save();
}

export function certificateFilename(details: CertificateDetails) {
  const safeName = details.delegateName.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  return `kalu-certificate-${safeName}-${details.certificateId}.pdf`;
}
