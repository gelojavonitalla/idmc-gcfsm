/**
 * PDF Export Utility
 * Provides functions for exporting schedule data to PDF format
 *
 * @module utils/exportPdf
 */

import { jsPDF } from 'jspdf';
import { SESSION_TYPE_LABELS } from '../constants';

/**
 * Color mapping for session types in PDF
 */
const SESSION_TYPE_PDF_COLORS = {
  plenary: { r: 30, g: 64, b: 175 },
  workshop: { r: 22, g: 101, b: 52 },
  break: { r: 75, g: 85, b: 99 },
  registration: { r: 3, g: 105, b: 161 },
  worship: { r: 124, g: 58, b: 237 },
  lunch: { r: 194, g: 65, b: 12 },
  other: { r: 55, g: 65, b: 81 },
};

/**
 * Formats time from 24-hour format to 12-hour format
 *
 * @param {string} time - Time in HH:MM format
 * @returns {string} Formatted time (e.g., "1:15 PM")
 */
function formatTime(time) {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}

/**
 * Groups sessions by time slot
 *
 * @param {Array} sessions - Array of session objects
 * @returns {Array} Array of [time, sessions[]] tuples sorted by time
 */
function groupSessionsByTime(sessions) {
  const groups = {};

  sessions.forEach((session) => {
    const timeKey = session.startTime;
    if (!groups[timeKey]) {
      groups[timeKey] = [];
    }
    groups[timeKey].push(session);
  });

  // Sort by startTime (already in 24-hour format)
  return Object.entries(groups).sort((a, b) => {
    return a[0].localeCompare(b[0]);
  });
}

/**
 * Generates a PDF document containing the conference schedule
 *
 * @param {Array} sessions - Array of session objects
 * @param {Object} options - PDF generation options
 * @param {string} options.title - Conference title
 * @param {string} options.date - Conference date
 * @param {string} options.venue - Conference venue
 * @returns {jsPDF} The generated PDF document
 */
export function generateSchedulePdf(sessions, options = {}) {
  const {
    title = 'IDMC 2026',
    date = 'March 28, 2026',
    venue = 'GCF South Metro',
  } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let yPosition = margin;

  /**
   * Adds a new page if needed
   *
   * @param {number} requiredHeight - Height required for next content
   */
  function checkPageBreak(requiredHeight) {
    if (yPosition + requiredHeight > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  }

  /**
   * Draws the header section
   */
  function drawHeader() {
    // Title
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 64, 175);
    pdf.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Subtitle
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(75, 85, 99);
    pdf.text('Conference Schedule', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Date and venue
    pdf.setFontSize(11);
    pdf.text(`${date} | ${venue}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 12;

    // Divider line
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  }

  /**
   * Draws a session entry
   *
   * @param {Object} session - Session object
   * @param {boolean} isMultiple - Whether multiple sessions share this time slot
   */
  function drawSession(session, isMultiple = false) {
    const sessionHeight = isMultiple ? 25 : 30;
    checkPageBreak(sessionHeight);

    const typeColor = SESSION_TYPE_PDF_COLORS[session.sessionType] || SESSION_TYPE_PDF_COLORS.other;
    const typeLabel = SESSION_TYPE_LABELS[session.sessionType] || session.sessionType;

    // Session type badge background
    const badgeWidth = 22;
    pdf.setFillColor(typeColor.r, typeColor.g, typeColor.b);
    pdf.roundedRect(margin, yPosition, badgeWidth, 6, 1, 1, 'F');

    // Session type label
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text(typeLabel.toUpperCase(), margin + badgeWidth / 2, yPosition + 4.2, { align: 'center' });

    // Session title
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(31, 41, 55);
    const titleX = margin + badgeWidth + 4;
    const titleMaxWidth = contentWidth - badgeWidth - 4;
    const titleLines = pdf.splitTextToSize(session.title, titleMaxWidth);
    pdf.text(titleLines[0], titleX, yPosition + 4.5);

    yPosition += 9;

    // Time and venue
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(107, 114, 128);
    const startFormatted = formatTime(session.startTime);
    const endFormatted = formatTime(session.endTime);
    const timeText = endFormatted ? `${startFormatted} - ${endFormatted}` : startFormatted;
    pdf.text(`${timeText} | ${session.venue || 'TBA'}`, margin, yPosition);

    // Speaker names (if any)
    if (session.speakerNames && session.speakerNames.length > 0) {
      const speakerText = session.speakerNames.join(', ');
      pdf.text(` | ${speakerText}`, margin + pdf.getTextWidth(`${timeText} | ${session.venue || 'TBA'}`), yPosition);
    }

    yPosition += 7;

    // Description (truncated if too long)
    if (session.description && !isMultiple) {
      pdf.setFontSize(8);
      pdf.setTextColor(107, 114, 128);
      const descLines = pdf.splitTextToSize(session.description, contentWidth);
      const maxDescLines = 2;
      const displayLines = descLines.slice(0, maxDescLines);
      if (descLines.length > maxDescLines) {
        displayLines[maxDescLines - 1] += '...';
      }
      pdf.text(displayLines, margin, yPosition);
      yPosition += displayLines.length * 4;
    }

    yPosition += 4;
  }

  /**
   * Draws a time slot with potentially multiple sessions
   *
   * @param {string} time - Time string
   * @param {Array} timeSessions - Array of sessions at this time
   */
  function drawTimeSlot(time, timeSessions) {
    const isMultiple = timeSessions.length > 1;

    // Time header for multiple sessions
    if (isMultiple) {
      checkPageBreak(40);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(30, 64, 175);
      pdf.text(time, margin, yPosition);
      yPosition += 6;

      // Draw each session with indent
      timeSessions.forEach((session) => {
        drawSession(session, true);
      });
    } else {
      drawSession(timeSessions[0], false);
    }
  }

  // Generate PDF content
  drawHeader();

  const groupedSessions = groupSessionsByTime(sessions);

  groupedSessions.forEach(([time, timeSessions]) => {
    drawTimeSlot(time, timeSessions);
  });

  // Footer with generation date
  const footerY = pageHeight - 10;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(156, 163, 175);
  pdf.text(
    `Generated on ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );

  return pdf;
}

/**
 * Generates and downloads a PDF of the conference schedule
 *
 * @param {Array} sessions - Array of session objects
 * @param {Object} options - PDF generation options
 * @param {string} options.title - Conference title
 * @param {string} options.date - Conference date
 * @param {string} options.venue - Conference venue
 * @param {string} options.filename - Downloaded filename (without extension)
 */
export function downloadSchedulePdf(sessions, options = {}) {
  const { filename = 'idmc-2026-schedule', ...pdfOptions } = options;
  const pdf = generateSchedulePdf(sessions, pdfOptions);
  pdf.save(`${filename}.pdf`);
}
