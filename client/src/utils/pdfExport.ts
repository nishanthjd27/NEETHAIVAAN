// path: client/src/utils/pdfExport.ts
// Uses jsPDF to convert the complaint draft text into a downloadable PDF.

import { jsPDF } from 'jspdf';

export function exportDraftAsPdf(draft: string, complaintId: string): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);

  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('NEETHIVAAN – Legal Grievance Portal', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Reference: ${complaintId}`, 105, 28, { align: 'center' });

  // Draw line separator
  doc.setDrawColor(200);
  doc.line(20, 32, 190, 32);

  // Body
  doc.setTextColor(0);
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(draft, 170);
  doc.text(lines, 20, 42);

  // Footer
  const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`NEETHIVAAN Portal – Complaint ${complaintId} – Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
  }

  doc.save(`Complaint_${complaintId}.pdf`);
}
