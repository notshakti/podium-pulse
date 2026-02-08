import { jsPDF } from 'jspdf';
import type { Team, Slot } from '../types';

export function generateLeaderboardPdf(teams: Team[], slots: Slot[]): void {
  const sorted = [...teams].sort((a, b) => b.points - a.points);
  const slotMap = new Map(slots.map((s) => [s.id, s.name]));

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const margin = 20;
  const headerTop = 42;
  const headerHeight = 10;
  const dataStartY = headerTop + headerHeight + 4; // First row clearly below header
  const colWidths = [18, 70, 35, 35];
  const rowHeight = 10;

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Build a Bot — Hackathon Leaderboard', margin, 25);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 35);

  // Header row: draw background then column titles
  doc.setFillColor(41, 26, 62);
  doc.rect(margin, headerTop, pageWidth - 2 * margin, headerHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const headerTextY = headerTop + headerHeight / 2 + 1.5;
  let x = margin;
  doc.text('Rank', x + 4, headerTextY);
  x += colWidths[0];
  doc.text('Team Name', x + 4, headerTextY);
  x += colWidths[1];
  doc.text('Slot', x + 4, headerTextY);
  x += colWidths[2];
  doc.text('Points', x + 4, headerTextY);

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  let currentY = dataStartY;
  sorted.forEach((team, index) => {
    if (currentY > 270) {
      doc.addPage();
      currentY = 20;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
    }
    x = margin;
    doc.text(String(index + 1), x + 4, currentY);
    x += colWidths[0];
    doc.text(team.name.slice(0, 28), x + 4, currentY);
    x += colWidths[1];
    doc.text(slotMap.get(team.slotId) ?? '—', x + 4, currentY);
    x += colWidths[2];
    doc.text(String(team.points), x + 4, currentY);
    currentY += rowHeight;
  });

  doc.save('build-a-bot-leaderboard.pdf');
}
