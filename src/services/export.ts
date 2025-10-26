import { jsPDF } from 'jspdf';
import { Note, Group } from '../types';

interface ExportData {
  notes: Note[];
  groups: Group[];
  themes: string[];
  exportDate: string;
}

export class ExportService {
  /**
   * Export board data as JSON file
   */
  static exportAsJSON(notes: Note[], groups: Group[], themes: string[]) {
    const data: ExportData = {
      notes,
      groups,
      themes,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `collaborative-board-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export board data as CSV file
   */
  static exportAsCSV(notes: Note[]) {
    const headers = [
      'Theme',
      'Content',
      'Author Type',
      'Author Name',
      'Created Date',
      'Reactions',
      'Color',
    ];

    const rows = notes.map((note) => {
      const reactions = note.reactions
        ?.map((r) => `${r.emoji}(${r.count})`)
        .join(', ') || 'None';

      return [
        note.theme,
        `"${note.content.replace(/"/g, '""')}"`, // Escape quotes
        note.author,
        note.authorName || note.author,
        new Date(note.createdAt).toLocaleString(),
        reactions,
        note.color,
      ];
    });

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `collaborative-board-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Export board data as PDF file
   */
  static exportAsPDF(notes: Note[], groups: Group[], themes: string[]) {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Helper function to add a new page if needed
    const checkPageBreak = (requiredSpace: number) => {
      if (yPosition + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
        return true;
      }
      return false;
    };

    // Helper function to wrap text
    const wrapText = (text: string, maxWidth: number, fontSize: number) => {
      doc.setFontSize(fontSize);
      return doc.splitTextToSize(text, maxWidth);
    };

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Collaborative Board Export', margin, yPosition);
    yPosition += 10;

    // Export date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Exported: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 15;

    // Summary section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Summary', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Notes: ${notes.length}`, margin + 5, yPosition);
    yPosition += 6;
    doc.text(`Total Groups: ${groups.length}`, margin + 5, yPosition);
    yPosition += 6;
    doc.text(`Themes: ${themes.join(', ')}`, margin + 5, yPosition);
    yPosition += 15;

    // Sort notes by theme
    const notesByTheme = notes.reduce((acc, note) => {
      if (!acc[note.theme]) {
        acc[note.theme] = [];
      }
      acc[note.theme].push(note);
      return acc;
    }, {} as Record<string, Note[]>);

    // Export notes grouped by theme
    Object.entries(notesByTheme).forEach(([theme, themeNotes], themeIndex) => {
      checkPageBreak(20);

      // Theme header
      doc.setFillColor(66, 133, 244);
      doc.rect(margin, yPosition - 5, maxWidth, 10, 'F');
      doc.setTextColor(255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Theme: ${theme} (${themeNotes.length} notes)`, margin + 3, yPosition + 2);
      yPosition += 12;
      doc.setTextColor(0);

      // Notes in this theme
      themeNotes.forEach((note, noteIndex) => {
        const noteHeight = 50; // Estimated height per note
        checkPageBreak(noteHeight);

        // Note box background
        const boxY = yPosition;
        doc.setFillColor(240, 240, 240);
        doc.rect(margin + 5, boxY, maxWidth - 10, 8, 'F');

        // Note header (Author and Date)
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const authorIcon = note.author === 'ai' ? '🤖' : '👤';
        const authorText = `${authorIcon} ${note.authorName || note.author}`;
        doc.text(authorText, margin + 8, boxY + 5);

        const dateText = new Date(note.createdAt).toLocaleString();
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        const dateWidth = doc.getTextWidth(dateText);
        doc.text(dateText, pageWidth - margin - dateWidth - 8, boxY + 5);
        doc.setTextColor(0);

        yPosition += 10;

        // Note content
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const contentLines = wrapText(note.content, maxWidth - 20, 10);
        contentLines.forEach((line: string, lineIndex: number) => {
          if (lineIndex > 0) {
            checkPageBreak(6);
          }
          doc.text(line, margin + 8, yPosition);
          yPosition += 5;
        });

        yPosition += 3;

        // Reactions
        if (note.reactions && note.reactions.length > 0) {
          doc.setFontSize(8);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(100);
          const reactionsText = `Reactions: ${note.reactions
            .map((r) => `${r.emoji} (${r.count})`)
            .join(', ')}`;
          const reactionLines = wrapText(reactionsText, maxWidth - 20, 8);
          reactionLines.forEach((line: string) => {
            doc.text(line, margin + 8, yPosition);
            yPosition += 4;
          });
          doc.setTextColor(0);
        }

        // Color indicator
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150);
        doc.text(`Color: ${note.color}`, margin + 8, yPosition);
        yPosition += 2;
        doc.setTextColor(0);

        // Separator line
        yPosition += 5;
        doc.setDrawColor(200);
        doc.line(margin + 5, yPosition, pageWidth - margin - 5, yPosition);
        yPosition += 8;
      });

      yPosition += 5;
    });

    // Groups section
    if (groups.length > 0) {
      checkPageBreak(30);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Groups', margin, yPosition);
      yPosition += 10;

      groups.forEach((group) => {
        checkPageBreak(20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`• ${group.name}`, margin + 5, yPosition);
        yPosition += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`  Notes in group: ${group.notes.length}`, margin + 8, yPosition);
        yPosition += 5;

        doc.setTextColor(100);
        doc.text(`  Position: (${Math.round(group.position.x)}, ${Math.round(group.position.y)})`, margin + 8, yPosition);
        yPosition += 8;
        doc.setTextColor(0);
      });
    }

    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      'Generated by Collaborative Board',
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Save the PDF
    doc.save(`collaborative-board-${Date.now()}.pdf`);
  }

  /**
   * Export board data as Markdown file
   */
  static exportAsMarkdown(notes: Note[], groups: Group[], themes: string[]) {
    let markdown = '# Collaborative Board Export\n\n';
    markdown += `**Exported:** ${new Date().toLocaleString()}\n\n`;
    markdown += '---\n\n';

    // Summary
    markdown += '## Summary\n\n';
    markdown += `- **Total Notes:** ${notes.length}\n`;
    markdown += `- **Total Groups:** ${groups.length}\n`;
    markdown += `- **Themes:** ${themes.join(', ')}\n\n`;
    markdown += '---\n\n';

    // Notes by theme
    const notesByTheme = notes.reduce((acc, note) => {
      if (!acc[note.theme]) {
        acc[note.theme] = [];
      }
      acc[note.theme].push(note);
      return acc;
    }, {} as Record<string, Note[]>);

    markdown += '## Notes by Theme\n\n';

    Object.entries(notesByTheme).forEach(([theme, themeNotes]) => {
      markdown += `### ${theme} (${themeNotes.length} notes)\n\n`;

      themeNotes.forEach((note) => {
        const authorIcon = note.author === 'ai' ? '🤖' : '👤';
        markdown += `#### ${authorIcon} ${note.authorName || note.author}\n`;
        markdown += `*${new Date(note.createdAt).toLocaleString()}*\n\n`;
        markdown += `${note.content}\n\n`;

        if (note.reactions && note.reactions.length > 0) {
          markdown += `**Reactions:** ${note.reactions
            .map((r) => `${r.emoji} (${r.count})`)
            .join(', ')}\n\n`;
        }

        markdown += `*Color: ${note.color}*\n\n`;
        markdown += '---\n\n';
      });
    });

    // Groups
    if (groups.length > 0) {
      markdown += '## Groups\n\n';

      groups.forEach((group) => {
        markdown += `### ${group.name}\n\n`;
        markdown += `- **Notes in group:** ${group.notes.length}\n`;
        markdown += `- **Position:** (${Math.round(group.position.x)}, ${Math.round(group.position.y)})\n`;
        markdown += `- **Size:** ${Math.round(group.size.width)} × ${Math.round(group.size.height)}\n\n`;
      });
    }

    // Download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `collaborative-board-${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
