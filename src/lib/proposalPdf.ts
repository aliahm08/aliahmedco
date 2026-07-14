import {jsPDF} from 'jspdf';

export type ProposalPdfService = {
  name: string;
  duration: string;
  fee: string;
  summary: string;
};

export type ProposalPdfInput = {
  approach: string;
  approachDescription: string;
  services: ProposalPdfService[];
  additionalServices: Array<{name: string; fee: string}>;
  timeline: Array<{period: string; name: string; output: string}>;
  aliServicesTotal: string;
  developmentTooling: string;
  initialInventory: string;
  estimatedTotal: string;
};

const red: [number, number, number] = [191, 76, 59];
const ink: [number, number, number] = [38, 35, 31];
const muted: [number, number, number] = [102, 96, 87];
const cream: [number, number, number] = [246, 240, 230];

function ascii(value: string) {
  return value.replace(/[–—]/g, '-').replace(/’/g, "'");
}

function drawHeader(doc: jsPDF, section: string) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text('ALI AHMED CO.', 18, 15);
  doc.text(ascii(section).toUpperCase(), 192, 15, {align: 'right'});
  doc.setDrawColor(220, 215, 207);
  doc.line(18, 20, 192, 20);
}

function drawFooter(doc: jsPDF, page: number) {
  doc.setDrawColor(220, 215, 207);
  doc.line(18, 279, 192, 279);
  doc.setFontSize(7);
  doc.setTextColor(...muted);
  doc.text('Prepared for Nomads & Nobles', 18, 285);
  doc.text(String(page).padStart(2, '0'), 192, 285, {align: 'right'});
}

function addWrappedText(doc: jsPDF, value: string, x: number, y: number, width: number, lineHeight = 5) {
  const lines = doc.splitTextToSize(ascii(value), width) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

export function createProposalPdf(input: ProposalPdfInput) {
  const doc = new jsPDF({unit: 'mm', format: 'a4'});

  doc.setFillColor(...cream);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...red);
  doc.setFontSize(9);
  doc.text('PROJECT PROPOSAL', 18, 24);
  doc.setTextColor(...ink);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  doc.text(['Classified shoe', 'development.'], 18, 57, {lineHeightFactor: 0.92});
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...muted);
  addWrappedText(doc, `A configured development estimate for ${input.approach}.`, 18, 92, 105, 6);

  doc.setDrawColor(205, 198, 189);
  doc.line(18, 122, 192, 122);
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  doc.text('SELECTED APPROACH', 18, 135);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...ink);
  doc.text(ascii(input.approach), 18, 147);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...muted);
  addWrappedText(doc, input.approachDescription, 18, 158, 150, 5);

  doc.setFillColor(...ink);
  doc.roundedRect(18, 206, 174, 45, 1, 1, 'F');
  doc.setFontSize(8);
  doc.setTextColor(225, 218, 209);
  doc.text('CONFIGURED PLANNING RANGE', 28, 220);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(233, 107, 88);
  doc.text(ascii(input.estimatedTotal), 28, 238);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(225, 218, 209);
  doc.text('Before marketing, fulfillment, returns, and ongoing operations', 28, 245);
  drawFooter(doc, 1);

  doc.addPage();
  drawHeader(doc, 'Configured scope');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...ink);
  doc.text('Selected services', 18, 38);
  let y = 52;
  const selectedRows = [
    ...input.services.map((service) => ({
      name: service.name,
      meta: `${service.duration} | ${service.fee}`,
      summary: service.summary,
    })),
    ...input.additionalServices.map((service) => ({
      name: service.name,
      meta: service.fee,
      summary: 'Optional specialist support added to the configured program.',
    })),
  ];

  selectedRows.forEach((service, index) => {
    doc.setDrawColor(220, 215, 207);
    doc.line(18, y - 4, 192, y - 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...red);
    doc.text(String(index + 1).padStart(2, '0'), 18, y + 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...ink);
    doc.text(ascii(service.name), 31, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...muted);
    doc.text(ascii(service.meta), 192, y + 3, {align: 'right'});
    y = addWrappedText(doc, service.summary, 31, y + 11, 145, 4.5) + 8;
  });

  doc.setDrawColor(220, 215, 207);
  doc.line(18, y - 4, 192, y - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...ink);
  doc.text('Ali Ahmed services total', 18, y + 7);
  doc.setTextColor(...red);
  doc.text(ascii(input.aliServicesTotal), 192, y + 7, {align: 'right'});
  drawFooter(doc, 2);

  doc.addPage();
  drawHeader(doc, 'Timeline and estimate');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(...ink);
  doc.text('Development timeline', 18, 38);
  y = 52;
  input.timeline.forEach((item, index) => {
    doc.setDrawColor(220, 215, 207);
    doc.line(18, y - 4, 192, y - 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...red);
    doc.text(ascii(item.period).toUpperCase(), 18, y + 3);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...ink);
    doc.text(ascii(item.name), 57, y + 3);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...muted);
    y = addWrappedText(doc, item.output, 57, y + 10, 126, 4.3) + 7;
  });

  const estimateY = Math.max(y + 6, 170);
  doc.setFillColor(248, 246, 241);
  doc.rect(18, estimateY, 174, 76, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...ink);
  doc.text('Basic estimate', 27, estimateY + 13);
  const estimateRows = [
    ['Ali Ahmed services', input.aliServicesTotal],
    ['External development and tooling', input.developmentTooling],
    ['Initial inventory', input.initialInventory],
    ['Approximate total before marketing', input.estimatedTotal],
  ];
  estimateRows.forEach(([label, value], index) => {
    const rowY = estimateY + 27 + index * 12;
    doc.setFont('helvetica', index === 3 ? 'bold' : 'normal');
    doc.setFontSize(index === 3 ? 10 : 9);
    doc.setTextColor(...(index === 3 ? ink : muted));
    doc.text(label, 27, rowY);
    doc.setTextColor(...(index === 3 ? red : ink));
    doc.text(ascii(value), 183, rowY, {align: 'right'});
  });
  drawFooter(doc, 3);

  return doc;
}

export function downloadProposalPdf(input: ProposalPdfInput) {
  createProposalPdf(input).save('Nomads-and-Nobles-Development-Proposal.pdf');
}
