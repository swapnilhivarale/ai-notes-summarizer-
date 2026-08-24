import { jsPDF } from 'jspdf';
import { NoteAnalysis } from '../types';

export function exportStudyNotesToPdf(analysis: NoteAnalysis): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let cursorY = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
      drawHeader();
    }
  };

  const drawHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130, 140, 155);
    doc.text('AI Notes Summarizer - Student Study Sheet', margin, margin - 6);
    doc.text(
      `Generated on ${new Date().toLocaleDateString()}`,
      pageWidth - margin,
      margin - 6,
      { align: 'right' }
    );
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, margin - 3, pageWidth - margin, margin - 3);
  };

  drawHeader();

  // Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  const titleText = analysis.overviewStats?.topicSubject || analysis.fileName;
  const splitTitle = doc.splitTextToSize(titleText, contentWidth);
  doc.text(splitTitle, margin, cursorY + 4);
  cursorY += splitTitle.length * 8 + 4;

  // Metadata badge bar
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // slate-600
  const metaLine = `Source: ${analysis.fileName}  |  Read Time: ~${analysis.overviewStats?.estimatedReadTimeMinutes || 3} min  |  Difficulty: ${analysis.overviewStats?.difficultyLevel || 'Intermediate'}  |  Key Concepts: ${analysis.keyPoints.length}`;
  doc.text(metaLine, margin, cursorY);
  cursorY += 8;

  // Horizontal divider
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 8;

  // Section 1: Executive Summary
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(30, 58, 138); // blue-900
  doc.text('1. Concise Summary', margin, cursorY);
  cursorY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59); // slate-800

  // Clean Markdown formatting for PDF
  const cleanSummary = analysis.summary
    .replace(/#{1,6}\s+/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1');

  const summaryParagraphs = cleanSummary.split('\n\n').filter((p) => p.trim());
  for (const para of summaryParagraphs) {
    const splitPara = doc.splitTextToSize(para.trim(), contentWidth);
    checkPageBreak(splitPara.length * 5 + 4);
    doc.text(splitPara, margin, cursorY);
    cursorY += splitPara.length * 5 + 4;
  }

  cursorY += 4;

  // Section 2: Important Points & Core Concepts
  if (analysis.keyPoints && analysis.keyPoints.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 58, 138);
    doc.text('2. Key Points & Concepts', margin, cursorY);
    cursorY += 7;

    analysis.keyPoints.forEach((kp, idx) => {
      checkPageBreak(25);

      // Bullet dot
      doc.setFillColor(37, 99, 235); // blue-600
      doc.circle(margin + 2, cursorY - 1, 1.2, 'F');

      // Title & Category
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(15, 23, 42);
      const categoryBadge = kp.category ? ` [${kp.category.toUpperCase().replace('_', ' ')}]` : '';
      const pointHeader = `${idx + 1}. ${kp.title}${categoryBadge}`;
      doc.text(pointHeader, margin + 6, cursorY);
      cursorY += 5;

      // Explanation
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      const splitExp = doc.splitTextToSize(kp.explanation, contentWidth - 8);
      checkPageBreak(splitExp.length * 4.5 + 4);
      doc.text(splitExp, margin + 6, cursorY);
      cursorY += splitExp.length * 4.5 + 2;

      // Highlight Fact if present
      if (kp.highlightFact) {
        checkPageBreak(12);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.5);
        doc.setTextColor(100, 116, 139);
        const factText = `Key Fact: "${kp.highlightFact}"`;
        const splitFact = doc.splitTextToSize(factText, contentWidth - 8);
        doc.text(splitFact, margin + 6, cursorY);
        cursorY += splitFact.length * 4 + 3;
      } else {
        cursorY += 2;
      }
    });
  }

  // Section 3: Self-Check Practice Quiz
  if (analysis.quiz && analysis.quiz.length > 0) {
    cursorY += 4;
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 58, 138);
    doc.text('3. Practice Quiz & Knowledge Check', margin, cursorY);
    cursorY += 7;

    analysis.quiz.forEach((q, idx) => {
      checkPageBreak(30);

      // Question
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const qText = `Q${idx + 1}: ${q.question}`;
      const splitQ = doc.splitTextToSize(qText, contentWidth);
      doc.text(splitQ, margin, cursorY);
      cursorY += splitQ.length * 4.5 + 3;

      // Options
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85);
      const optionLetters = ['A', 'B', 'C', 'D'];
      q.options.forEach((opt, oIdx) => {
        checkPageBreak(8);
        const isCorrect = oIdx === q.correctOptionIndex;
        const optLine = `   (${optionLetters[oIdx]}) ${opt}`;
        const splitOpt = doc.splitTextToSize(optLine, contentWidth - 4);
        doc.text(splitOpt, margin + 2, cursorY);
        cursorY += splitOpt.length * 4 + 1.5;
      });

      // Answer & Explanation
      checkPageBreak(12);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(37, 99, 235); // blue-600
      const answerExplanation = `Correct: (${optionLetters[q.correctOptionIndex]}) - ${q.explanation}`;
      const splitAns = doc.splitTextToSize(answerExplanation, contentWidth - 4);
      doc.text(splitAns, margin + 4, cursorY);
      cursorY += splitAns.length * 4 + 5;
    });
  }

  // Save the PDF file
  const safeFileName = (analysis.fileName || 'Study_Notes')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/\.[^/.]+$/, '');
  doc.save(`${safeFileName}_Summary_Quiz.pdf`);
}
