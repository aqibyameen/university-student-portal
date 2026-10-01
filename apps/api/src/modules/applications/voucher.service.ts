import PDFDocument from 'pdfkit';
import type { Application, Student } from '@prisma/client';

interface VoucherData {
  application: Application & { student: Student };
}

export function generateVoucherPDF(data: VoucherData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { application } = data;
    const student = application.student;

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    const primaryColor = '#1e3a8a';
    const borderColor = '#cbd5e1';
    const labelColor = '#64748b';

    // Header
    doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);
    doc.fillColor('white').fontSize(18).font('Helvetica-Bold')
      .text('University of Karachi', 50, 25, { align: 'center' });
    doc.fontSize(11).font('Helvetica')
      .text('Student Issue Management & Document Application System', 50, 50, { align: 'center' });
    doc.fontSize(13).font('Helvetica-Bold')
      .text('FEE PAYMENT VOUCHER', 50, 72, { align: 'center' });

    doc.moveDown(0.5);

    // Disclaimer
    doc.rect(50, 110, doc.page.width - 100, 30).fill('#fef3c7');
    doc.fillColor('#92400e').fontSize(9).font('Helvetica')
      .text(
        '⚠  This is a system-generated demo voucher. Fees shown are not official University of Karachi rates.',
        60, 118, { width: doc.page.width - 120 },
      );

    doc.fillColor('#0f172a');

    // Voucher info box
    const boxTop = 155;
    doc.rect(50, boxTop, doc.page.width - 100, 80).stroke(borderColor);

    const voucherNumber = `VCH-${application.applicationNumber}`;
    const issueDate = new Date().toLocaleDateString('en-PK');
    const dueDate = new Date(Date.now() + 7 * 86400_000).toLocaleDateString('en-PK');

    const drawInfoRow = (label: string, value: string, x: number, y: number) => {
      doc.fillColor(labelColor).fontSize(9).font('Helvetica').text(label, x, y);
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(value, x, y + 14);
    };

    drawInfoRow('Voucher Number', voucherNumber, 60, boxTop + 10);
    drawInfoRow('Application Number', application.applicationNumber, 220, boxTop + 10);
    drawInfoRow('Issue Date', issueDate, 400, boxTop + 10);
    drawInfoRow('Due Date', dueDate, 480, boxTop + 10);

    // Student details
    const sectionTop = 250;
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
      .text('Student Information', 50, sectionTop);
    doc.moveTo(50, sectionTop + 16).lineTo(doc.page.width - 50, sectionTop + 16).stroke(borderColor);

    const drawRow = (label: string, value: string, y: number, col = 0) => {
      const x = col === 0 ? 50 : 310;
      doc.fillColor(labelColor).fontSize(9).font('Helvetica').text(label + ':', x, y);
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica').text(value, x, y + 13);
    };

    drawRow('Full Name', student.fullName, sectionTop + 25, 0);
    drawRow('Seat Number', student.seatNumber, sectionTop + 25, 1);
    drawRow('Program', student.program, sectionTop + 55, 0);
    drawRow('Department', student.department, sectionTop + 55, 1);
    drawRow('Semester', `Semester ${student.semester}`, sectionTop + 85, 0);
    if (student.email) drawRow('Email', student.email, sectionTop + 85, 1);

    // Application details
    const appSection = sectionTop + 125;
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
      .text('Application Details', 50, appSection);
    doc.moveTo(50, appSection + 16).lineTo(doc.page.width - 50, appSection + 16).stroke(borderColor);

    const appTypeLabel = application.applicationType === 'PROFORMA' ? 'Proforma' : 'Transcript';
    const officeLabel = application.office === 'REGISTRAR_OFFICE' ? "Registrar's Office" : 'Semester Cell';

    drawRow('Application Type', appTypeLabel, appSection + 25, 0);
    drawRow('Office', officeLabel, appSection + 25, 1);
    drawRow('Number of Semesters', String(application.numberOfSemesters), appSection + 55, 0);
    drawRow('Purpose', application.purpose.slice(0, 60), appSection + 55, 1);

    // Fee breakdown
    const feeSection = appSection + 105;
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
      .text('Fee Breakdown', 50, feeSection);
    doc.moveTo(50, feeSection + 16).lineTo(doc.page.width - 50, feeSection + 16).stroke(borderColor);

    const baseFee = Number(application.baseFee);
    const perSemFee = Number(application.perSemesterFee);
    const totalFee = Number(application.totalFee);

    const feeRows = [
      { label: 'Base Fee', amount: baseFee },
      { label: `Per-Semester Fee (${application.numberOfSemesters} × Rs. ${perSemFee.toFixed(2)})`, amount: perSemFee * application.numberOfSemesters },
    ];

    let feeY = feeSection + 30;
    for (const row of feeRows) {
      doc.fillColor('#0f172a').fontSize(10).font('Helvetica')
        .text(row.label, 60, feeY)
        .text(`Rs. ${row.amount.toFixed(2)}`, 0, feeY, { align: 'right', width: doc.page.width - 100 });
      feeY += 20;
    }

    doc.moveTo(50, feeY).lineTo(doc.page.width - 50, feeY).stroke(borderColor);
    feeY += 8;
    doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold')
      .text('TOTAL PAYABLE', 60, feeY)
      .text(`Rs. ${totalFee.toFixed(2)}`, 0, feeY, { align: 'right', width: doc.page.width - 100 });

    // Payment instructions
    const instrSection = feeY + 45;
    doc.rect(50, instrSection, doc.page.width - 100, 90).fill('#f1f5f9');
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
      .text('Payment Instructions', 65, instrSection + 12);
    doc.fillColor('#334155').fontSize(9).font('Helvetica')
      .text(
        '1. Pay the total amount at any authorized bank branch.\n' +
        '2. Quote the Voucher Number when making payment.\n' +
        '3. Keep the original paid challan for your records.\n' +
        '4. Upload a clear photo/scan of the paid receipt in the portal.\n' +
        '5. This voucher is valid for 7 days from the issue date.',
        65, instrSection + 30, { width: doc.page.width - 130, lineGap: 3 },
      );

    // Footer
    doc.rect(0, doc.page.height - 50, doc.page.width, 50).fill(primaryColor);
    doc.fillColor('white').fontSize(8).font('Helvetica')
      .text(
        'University of Karachi — Student Portal (Demo System) | Generated: ' + new Date().toLocaleString('en-PK'),
        50, doc.page.height - 32, { align: 'center' },
      );

    doc.end();
  });
}
