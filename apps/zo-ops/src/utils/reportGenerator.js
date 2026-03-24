// jsPDF is loaded dynamically to avoid SSR issues (it uses browser APIs)
// Callers must call loadJsPDF() before using the generators
let jsPDF = null;
export async function loadJsPDF() {
  if (jsPDF) return;
  const mod = await import("jspdf");
  jsPDF = mod.default || mod.jsPDF || mod;
  // jspdf-autotable patches jsPDF.prototype but only auto-applies when
  // window.jsPDF exists. With dynamic imports in Next.js/Webpack, jsPDF
  // isn't on window, so we must explicitly apply the plugin.
  const autoTableMod = await import("jspdf-autotable");
  if (typeof autoTableMod.applyPlugin === "function") {
    autoTableMod.applyPlugin(jsPDF);
  }
}

// ─── Color palette (dark theme inspired) ───
const COLORS = {
  black: [24, 24, 24],
  darkGray: [40, 40, 40],
  medGray: [80, 80, 80],
  lightGray: [160, 160, 160],
  white: [255, 255, 255],
  primary: [178, 223, 59],    // lime green accent
  green: [76, 175, 80],
  red: [244, 67, 54],
  orange: [255, 152, 0],
  blue: [66, 165, 245],
};

// ─── Helpers ───
const fmt = (n, decimals = 1) => {
  if (n == null || isNaN(n)) return "N/A";
  return Number(n).toFixed(decimals);
};

const fmtPct = (n) => {
  if (n == null || isNaN(n)) return "N/A";
  return `${Number(n).toFixed(1)}%`;
};

const fmtDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const fmtDateShort = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
};

// ─── Page setup helpers ───
const PAGE_WIDTH = 210; // A4 mm
const PAGE_HEIGHT = 297;
const MARGIN = 15;
const CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN;

function addPageHeader(doc, title, dateRangeStr, pageNum) {
  // Header bar
  doc.setFillColor(...COLORS.darkGray);
  doc.rect(0, 0, PAGE_WIDTH, 18, "F");
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(title, MARGIN, 12);
  doc.setTextColor(...COLORS.lightGray);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(dateRangeStr, PAGE_WIDTH - MARGIN, 12, { align: "right" });
  // Page number
  doc.setTextColor(...COLORS.medGray);
  doc.setFontSize(7);
  doc.text(`Page ${pageNum}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 8, { align: "center" });
}

function addSectionTitle(doc, y, text) {
  doc.setFillColor(...COLORS.primary);
  doc.rect(MARGIN, y, 3, 8, "F");
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(text, MARGIN + 6, y + 6.5);
  return y + 14;
}

function addSubsectionTitle(doc, y, text) {
  doc.setTextColor(...COLORS.medGray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text(text, MARGIN, y + 4);
  return y + 8;
}

function drawKpiCard(doc, x, y, width, label, value, change, isGood) {
  // Card background
  doc.setFillColor(248, 248, 248);
  doc.roundedRect(x, y, width, 28, 2, 2, "F");
  // Value
  doc.setTextColor(...COLORS.black);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(String(value), x + width / 2, y + 12, { align: "center" });
  // Label
  doc.setTextColor(...COLORS.medGray);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text(label, x + width / 2, y + 18, { align: "center" });
  // Change indicator
  if (change != null && change !== "" && change !== "N/A") {
    const color = isGood ? COLORS.green : COLORS.red;
    const arrow = isGood ? "\u25B2" : "\u25BC";
    doc.setTextColor(...color);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(`${arrow} ${change}`, x + width / 2, y + 24, { align: "center" });
  }
}

function wrapText(doc, text, maxWidth) {
  if (!text) return [];
  return doc.splitTextToSize(String(text), maxWidth);
}

// ─── Check if we need a new page ───
function checkPage(doc, y, needed, pageNum, title, dateRangeStr) {
  if (y + needed > PAGE_HEIGHT - 20) {
    doc.addPage();
    pageNum++;
    addPageHeader(doc, title, dateRangeStr, pageNum);
    return { y: 25, pageNum };
  }
  return { y, pageNum };
}


// ═══════════════════════════════════════════════════════════════════════════
//  CHAIN-WIDE REPORT (Operations Head view)
// ═══════════════════════════════════════════════════════════════════════════
export function generateChainReport({
  dateRange,
  reviewsData,
  trendData,
  propertyInsightsData,
  attentionProperties,
  actionItems,
  weightedDeltas,
  propertyRankMap,
  chainAverageData,
  chainTagSummary,
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const startDate = fmtDate(dateRange[0]);
  const endDate = fmtDate(dateRange[1]);
  const dateRangeStr = `${startDate} — ${endDate}`;
  const reportTitle = "Reviews Dashboard — Chain Report";
  let pageNum = 1;
  let y = 0;

  // ─── PAGE 1: Executive Snapshot ───
  // Title block
  doc.setFillColor(...COLORS.black);
  doc.rect(0, 0, PAGE_WIDTH, 45, "F");
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Reviews Report", MARGIN, 20);
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Chain-wide Performance Summary", MARGIN, 28);
  doc.setTextColor(...COLORS.lightGray);
  doc.setFontSize(9);
  doc.text(dateRangeStr, MARGIN, 36);
  doc.text(`Generated: ${fmtDate(new Date())}`, PAGE_WIDTH - MARGIN, 36, { align: "right" });

  y = 52;
  y = addSectionTitle(doc, y, "Executive Snapshot");

  // KPI Cards
  const reviews = reviewsData || {};
  const prev = reviews.previous_period || {};
  const totalReviews = reviews.count || 0;
  const totalCheckouts = reviews.total_guests || reviews.checkouts || 0;
  const avgRating = totalReviews > 0
    ? reviews.reviews?.reduce((s, r) => s + Number(r.review_rating || 0), 0) / totalReviews
    : 0;
  const prevAvgRating = prev.count > 0
    ? prev.reviews?.reduce((s, r) => s + Number(r.review_rating || 0), 0) / prev.count
    : 0;
  const reviewRate = totalCheckouts > 0 ? (totalReviews / totalCheckouts) * 100 : 0;
  const prevReviewRate = prev.total_guests > 0 ? (prev.count / prev.total_guests) * 100 : 0;
  const ratingChange = prevAvgRating > 0 ? (avgRating - prevAvgRating).toFixed(2) : null;
  const reviewCountChange = prev.count > 0 ? `${((totalReviews - prev.count) / prev.count * 100).toFixed(0)}%` : null;
  const reviewRateChange = prevReviewRate > 0 ? `${(reviewRate - prevReviewRate).toFixed(1)}%` : null;
  const checkoutChange = prev.total_guests > 0 ? `${(((totalCheckouts - prev.total_guests) / prev.total_guests) * 100).toFixed(0)}%` : null;

  const cardW = (CONTENT_WIDTH - 9) / 4;
  drawKpiCard(doc, MARGIN, y, cardW, "AVG RATING", fmt(avgRating), ratingChange, ratingChange >= 0);
  drawKpiCard(doc, MARGIN + cardW + 3, y, cardW, "TOTAL REVIEWS", totalReviews, reviewCountChange, reviewCountChange && !reviewCountChange.startsWith("-"));
  drawKpiCard(doc, MARGIN + (cardW + 3) * 2, y, cardW, "REVIEW RATE", fmtPct(reviewRate), reviewRateChange, reviewRateChange && !reviewRateChange.startsWith("-"));
  drawKpiCard(doc, MARGIN + (cardW + 3) * 3, y, cardW, "TOTAL GUESTS", totalCheckouts, checkoutChange, checkoutChange && !checkoutChange.startsWith("-"));
  y += 34;

  // Rating Trend Table
  if (trendData?.length) {
    y = addSubsectionTitle(doc, y, "Rating Trend");
    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Period", "Avg Rating", "Reviews", "Review Rate", "Guests"]],
      body: trendData.map((t) => [
        t.dateRange || "",
        fmt(t.avgRating),
        t.reviewCount || 0,
        fmtPct(t.reviewRate),
        t.checkouts || 0,
      ]),
      styles: { fontSize: 8, cellPadding: 2, textColor: COLORS.black },
      headStyles: { fillColor: COLORS.darkGray, textColor: COLORS.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ─── PAGE 2: Property Rankings ───
  let pg = checkPage(doc, y, 60, pageNum, reportTitle, dateRangeStr);
  y = pg.y; pageNum = pg.pageNum;
  if (pageNum === 1) { doc.addPage(); pageNum++; }
  addPageHeader(doc, reportTitle, dateRangeStr, pageNum);
  y = 25;

  y = addSectionTitle(doc, y, "Property Rankings (Bayesian Average)");

  const props = propertyInsightsData?.properties || [];
  if (props.length) {
    const rankedProps = [...props].sort((a, b) =>
      (propertyRankMap[a.property] || 999) - (propertyRankMap[b.property] || 999)
    );

    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Rank", "Property", "Avg Rating", "Reviews", "Review Rate", "Guests", "Missed Reviews"]],
      body: rankedProps.map((p) => {
        const rank = propertyRankMap[p.property] || "-";
        const guests = p.total_guests || p.total_checkouts || 0;
        const missed = Math.max(0, guests - (p.reviews || 0));
        return [
          rank,
          p.property,
          fmt(p.avgRating),
          p.reviews || 0,
          fmtPct(p.reviewRate),
          guests,
          missed,
        ];
      }),
      styles: { fontSize: 7, cellPadding: 1.5, textColor: COLORS.black, overflow: "ellipsize" },
      headStyles: { fillColor: COLORS.darkGray, textColor: COLORS.white, fontStyle: "bold", fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 48 },
        2: { cellWidth: 18, halign: "center" },
        3: { cellWidth: 16, halign: "center" },
        4: { cellWidth: 20, halign: "center" },
        5: { cellWidth: 16, halign: "center" },
        6: { cellWidth: 22, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 0) {
          const rank = data.cell.raw;
          if (rank <= 5) data.cell.styles.textColor = COLORS.green;
          else if (rank > rankedProps.length - 5) data.cell.styles.textColor = COLORS.red;
        }
      },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // Missed Reviews Highlight
  if (props.length) {
    pg = checkPage(doc, y, 30, pageNum, reportTitle, dateRangeStr);
    y = pg.y; pageNum = pg.pageNum;

    y = addSubsectionTitle(doc, y, "Biggest Missed Review Gaps");
    const missedSorted = [...props]
      .map((p) => ({
        name: p.property,
        guests: p.total_guests || p.total_checkouts || 0,
        reviews: p.reviews || 0,
        missed: Math.max(0, (p.total_guests || p.total_checkouts || 0) - (p.reviews || 0)),
        rate: p.reviewRate,
      }))
      .sort((a, b) => b.missed - a.missed)
      .slice(0, 5);

    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Property", "Guests", "Reviews", "Missed", "Review Rate"]],
      body: missedSorted.map((p) => [p.name, p.guests, p.reviews, p.missed, fmtPct(p.rate)]),
      styles: { fontSize: 8, cellPadding: 2, textColor: COLORS.black },
      headStyles: { fillColor: [183, 28, 28], textColor: COLORS.white, fontStyle: "bold" },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ─── PAGE 3: Properties Needing Attention ───
  if (attentionProperties?.length) {
    pg = checkPage(doc, y, 50, pageNum, reportTitle, dateRangeStr);
    y = pg.y; pageNum = pg.pageNum;
    if (y < 30) { /* already on fresh page */ } else {
      doc.addPage(); pageNum++;
      addPageHeader(doc, reportTitle, dateRangeStr, pageNum);
      y = 25;
    }

    y = addSectionTitle(doc, y, "Properties Needing Attention");

    // Pre-format issues into multi-line strings (one issue per line) to avoid
    // jsPDF's linebreak mode stretching characters across the cell width.
    const attentionBody = attentionProperties.map((p) => [
      p.property_name,
      fmt(p.avg_rating),
      p.total_reviews || 0,
      (p.severity || "").toUpperCase(),
      (p.issues || []).join("\n"),
    ]);

    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Property", "Avg\nRating", "Reviews", "Severity", "Issues"]],
      body: attentionBody,
      styles: { fontSize: 7, cellPadding: 2, textColor: COLORS.black },
      headStyles: { fillColor: COLORS.orange, textColor: COLORS.white, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 36 },
        1: { cellWidth: 14, halign: "center" },
        2: { cellWidth: 14, halign: "center" },
        3: { cellWidth: 18, halign: "center" },
        4: { cellWidth: 98 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 3) {
          const sev = String(data.cell.raw).toLowerCase();
          if (sev === "critical") data.cell.styles.textColor = COLORS.red;
          else if (sev === "warning") data.cell.styles.textColor = COLORS.orange;
        }
      },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ─── Top Issues Across Properties (tag summary) ───
  if (chainTagSummary?.issues?.length) {
    doc.addPage(); pageNum++;
    addPageHeader(doc, reportTitle, dateRangeStr, pageNum);
    y = 25;

    y = addSectionTitle(doc, y, "Top Issues Across Properties");

    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Issue", "Mentions", "Most Affected Properties"]],
      body: chainTagSummary.issues.map((item) => [
        item.tag,
        item.totalCount,
        item.topProperties.map((p) => `${p.name} (${p.count})`).join(", "),
      ]),
      styles: { fontSize: 7.5, cellPadding: 2, textColor: COLORS.black, overflow: "linebreak" },
      headStyles: { fillColor: [183, 28, 28], textColor: COLORS.white, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 28, fontStyle: "bold" },
        1: { cellWidth: 18, halign: "center" },
        2: { cellWidth: 0 },
      },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 10;

    // Positive themes summary
    if (chainTagSummary?.positives?.length) {
      pg = checkPage(doc, y, 40, pageNum, reportTitle, dateRangeStr);
      y = pg.y; pageNum = pg.pageNum;

      y = addSubsectionTitle(doc, y, "Top Positive Themes Across Properties");

      doc.autoTable({
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [["Theme", "Mentions", "Top Properties"]],
        body: chainTagSummary.positives.slice(0, 8).map((item) => [
          item.tag,
          item.totalCount,
          item.topProperties.map((p) => `${p.name} (${p.count})`).join(", "),
        ]),
        styles: { fontSize: 7.5, cellPadding: 2, textColor: COLORS.black, overflow: "linebreak" },
        headStyles: { fillColor: COLORS.green, textColor: COLORS.white, fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 28, fontStyle: "bold" },
          1: { cellWidth: 18, halign: "center" },
          2: { cellWidth: 0 },
        },
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 8;
    }
  }

  // ─── Action Items ───
  const openItems = (actionItems || []).filter((i) => i.status !== "done");
  const doneItems = (actionItems || []).filter((i) => i.status === "done");
  if (openItems.length || doneItems.length) {
    pg = checkPage(doc, y, 50, pageNum, reportTitle, dateRangeStr);
    y = pg.y; pageNum = pg.pageNum;
    if (y > 30) {
      doc.addPage(); pageNum++;
      addPageHeader(doc, reportTitle, dateRangeStr, pageNum);
      y = 25;
    }

    y = addSectionTitle(doc, y, "Action Items");

    // Summary line
    const overdueCount = openItems.filter((i) => i.due_date && new Date(i.due_date) < new Date()).length;
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    let summaryText = `${openItems.length} open, ${doneItems.length} completed`;
    if (overdueCount > 0) summaryText += `, ${overdueCount} overdue`;
    doc.text(summaryText, MARGIN, y + 4);
    y += 10;

    // Per-property action items breakdown
    const propertyActionMap = {};
    (actionItems || []).forEach((item) => {
      const prop = item.property_name || "Unknown";
      if (!propertyActionMap[prop]) propertyActionMap[prop] = { total: 0, open: 0, done: 0, overdue: 0 };
      propertyActionMap[prop].total++;
      if (item.status === "done") propertyActionMap[prop].done++;
      else {
        propertyActionMap[prop].open++;
        if (item.due_date && new Date(item.due_date) < new Date()) propertyActionMap[prop].overdue++;
      }
    });

    const propertyActionBreakdown = Object.entries(propertyActionMap)
      .map(([name, stats]) => ({
        name,
        ...stats,
        completionRate: stats.total > 0 ? ((stats.done / stats.total) * 100).toFixed(0) : "0",
      }))
      .sort((a, b) => b.total - a.total);

    if (propertyActionBreakdown.length > 1) {
      y = addSubsectionTitle(doc, y, "Action Items by Property");

      doc.autoTable({
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [["Property", "Total", "Open", "Completed", "Overdue", "Completion %"]],
        body: propertyActionBreakdown.map((p) => [
          p.name,
          p.total,
          p.open,
          p.done,
          p.overdue,
          `${p.completionRate}%`,
        ]),
        styles: { fontSize: 7, cellPadding: 1.5, textColor: COLORS.black },
        headStyles: { fillColor: COLORS.darkGray, textColor: COLORS.white, fontStyle: "bold", fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 45 },
          1: { cellWidth: 14, halign: "center" },
          2: { cellWidth: 14, halign: "center" },
          3: { cellWidth: 20, halign: "center" },
          4: { cellWidth: 16, halign: "center" },
          5: { cellWidth: 22, halign: "center" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 4) {
            if (Number(data.cell.raw) > 0) data.cell.styles.textColor = COLORS.red;
          }
          if (data.section === "body" && data.column.index === 5) {
            const pct = parseInt(data.cell.raw);
            if (pct >= 80) data.cell.styles.textColor = COLORS.green;
            else if (pct < 50) data.cell.styles.textColor = COLORS.red;
          }
        },
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 8;

      pg = checkPage(doc, y, 30, pageNum, reportTitle, dateRangeStr);
      y = pg.y; pageNum = pg.pageNum;
    }

    y = addSubsectionTitle(doc, y, "Open Action Items");

    // Sort: overdue first, then by priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sortedItems = [...openItems].sort((a, b) => {
      const aOverdue = a.due_date && new Date(a.due_date) < new Date() ? 0 : 1;
      const bOverdue = b.due_date && new Date(b.due_date) < new Date() ? 0 : 1;
      if (aOverdue !== bOverdue) return aOverdue - bOverdue;
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });

    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Pri.", "Property", "Action Item", "Assignee", "Due Date", "Status"]],
      body: sortedItems.map((item) => {
        const isOverdue = item.due_date && new Date(item.due_date) < new Date();
        return [
          (item.priority || "medium").toUpperCase(),
          item.property_name || "",
          item.action || item.text || "",
          item.assignee || "Unassigned",
          item.due_date ? fmtDateShort(item.due_date) + (isOverdue ? " !" : "") : "-",
          item.status || "open",
        ];
      }),
      styles: { fontSize: 7, cellPadding: 1.5, textColor: COLORS.black, overflow: "ellipsize" },
      headStyles: { fillColor: COLORS.darkGray, textColor: COLORS.white, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { cellWidth: 32 },
        2: { cellWidth: 55 },
        3: { cellWidth: 22 },
        4: { cellWidth: 20, halign: "center" },
        5: { cellWidth: 16, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 0) {
          const pri = String(data.cell.raw).toLowerCase();
          if (pri === "critical" || pri === "high") data.cell.styles.textColor = COLORS.red;
        }
        if (data.section === "body" && data.column.index === 4) {
          if (String(data.cell.raw).includes("!")) data.cell.styles.textColor = COLORS.red;
        }
      },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 8;

    // Completion summary
    if (doneItems.length > 0) {
      pg = checkPage(doc, y, 15, pageNum, reportTitle, dateRangeStr);
      y = pg.y; pageNum = pg.pageNum;
      doc.setFillColor(232, 245, 233);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 10, 1, 1, "F");
      doc.setTextColor(...COLORS.green);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${doneItems.length} action items completed this period`, MARGIN + 4, y + 6.5);
      y += 14;
    }
  }

  // Footer
  doc.setTextColor(...COLORS.medGray);
  doc.setFontSize(7);
  doc.text(`Page ${pageNum}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 8, { align: "center" });

  return doc;
}


// ═══════════════════════════════════════════════════════════════════════════
//  PROPERTY-SPECIFIC REPORT (Property Manager view)
// ═══════════════════════════════════════════════════════════════════════════
export function generatePropertyReport({
  selectedProperty,
  dateRange,
  reviewsData,
  trendData,
  propertyInsightsData,
  actionItems,
  propertyRankMap,
  chainAverageData,
  tags,
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const startDate = fmtDate(dateRange[0]);
  const endDate = fmtDate(dateRange[1]);
  const dateRangeStr = `${startDate} — ${endDate}`;
  const reportTitle = `${selectedProperty} — Review Report`;
  let pageNum = 1;
  let y = 0;

  // ─── PAGE 1: Property Summary ───
  doc.setFillColor(...COLORS.black);
  doc.rect(0, 0, PAGE_WIDTH, 45, "F");
  doc.setTextColor(...COLORS.primary);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text(selectedProperty, MARGIN, 18);
  doc.setTextColor(...COLORS.white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Property Performance Report", MARGIN, 28);
  doc.setTextColor(...COLORS.lightGray);
  doc.setFontSize(9);
  doc.text(dateRangeStr, MARGIN, 36);
  doc.text(`Generated: ${fmtDate(new Date())}`, PAGE_WIDTH - MARGIN, 36, { align: "right" });

  // Rank badge (prominent colored)
  const rank = propertyRankMap?.[selectedProperty];
  const totalProps = Object.keys(propertyRankMap || {}).length;
  const percentile = rank && totalProps > 0 ? Math.round(((totalProps - rank + 1) / totalProps) * 100) : null;
  if (rank) {
    const badgeColor = percentile >= 75 ? COLORS.green : percentile >= 50 ? COLORS.orange : COLORS.red;
    doc.setFillColor(...badgeColor);
    doc.roundedRect(PAGE_WIDTH - MARGIN - 38, 5, 38, 16, 2, 2, "F");
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`#${rank} / ${totalProps}`, PAGE_WIDTH - MARGIN - 19, 12, { align: "center" });
    doc.setFontSize(7);
    doc.text(`Top ${percentile}%`, PAGE_WIDTH - MARGIN - 19, 18, { align: "center" });
  }

  y = 52;
  y = addSectionTitle(doc, y, "Performance Summary");

  // KPIs
  const reviews = reviewsData || {};
  const prev = reviews.previous_period || {};
  const totalReviews = reviews.count || 0;
  const totalGuests = reviews.total_guests || reviews.checkouts || 0;
  const avgRating = totalReviews > 0
    ? reviews.reviews?.reduce((s, r) => s + Number(r.review_rating || 0), 0) / totalReviews
    : 0;
  const prevAvgRating = prev.count > 0
    ? prev.reviews?.reduce((s, r) => s + Number(r.review_rating || 0), 0) / prev.count
    : 0;
  const reviewRate = totalGuests > 0 ? (totalReviews / totalGuests) * 100 : 0;
  const prevReviewRate = prev.total_guests > 0 ? (prev.count / prev.total_guests) * 100 : 0;
  const ratingChange = prevAvgRating > 0 ? (avgRating - prevAvgRating).toFixed(2) : null;
  const reviewRateChange = prevReviewRate > 0 ? `${(reviewRate - prevReviewRate).toFixed(1)}%` : null;

  const cardW = (CONTENT_WIDTH - 9) / 4;
  drawKpiCard(doc, MARGIN, y, cardW, "AVG RATING", fmt(avgRating), ratingChange, ratingChange >= 0);
  drawKpiCard(doc, MARGIN + cardW + 3, y, cardW, "REVIEWS", totalReviews, prev.count ? `was ${prev.count}` : null, totalReviews >= (prev.count || 0));
  drawKpiCard(doc, MARGIN + (cardW + 3) * 2, y, cardW, "REVIEW RATE", fmtPct(reviewRate), reviewRateChange, reviewRateChange && !reviewRateChange.startsWith("-"));
  drawKpiCard(doc, MARGIN + (cardW + 3) * 3, y, cardW, "RANK", rank ? `#${rank} of ${totalProps}` : "N/A", percentile ? `Top ${percentile}%` : null, percentile ? percentile >= 50 : null);
  y += 34;

  // Rating Trend
  if (trendData?.length) {
    let pg = checkPage(doc, y, 30, pageNum, reportTitle, dateRangeStr);
    y = pg.y; pageNum = pg.pageNum;

    y = addSubsectionTitle(doc, y, "Rating Trend");
    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Period", "Avg Rating", "Reviews", "Review Rate", "Guests"]],
      body: trendData.map((t) => [
        t.dateRange || "",
        fmt(t.avgRating),
        t.reviewCount || 0,
        fmtPct(t.reviewRate),
        t.checkouts || 0,
      ]),
      styles: { fontSize: 8, cellPadding: 2, textColor: COLORS.black },
      headStyles: { fillColor: COLORS.darkGray, textColor: COLORS.white, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ─── PAGE 2: What Guests Are Saying (keyword-based tags) ───
  const hasTags = tags && (tags.positiveCounts?.size > 0 || tags.negativeCounts?.size > 0);

  if (hasTags) {
    let pg = checkPage(doc, y, 50, pageNum, reportTitle, dateRangeStr);
    y = pg.y; pageNum = pg.pageNum;
    if (y > 30) {
      doc.addPage(); pageNum++;
      addPageHeader(doc, reportTitle, dateRangeStr, pageNum);
      y = 25;
    }

    y = addSectionTitle(doc, y, "What Guests Are Saying");

    // Positive themes
    if (tags.positiveCounts?.size > 0) {
      y = addSubsectionTitle(doc, y, "Positive Themes");
      const posData = [...tags.positiveCounts].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag, count]) => [tag, `Mentioned ${count} times`]);

      doc.autoTable({
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [["Theme", "Details"]],
        body: posData,
        styles: { fontSize: 8, cellPadding: 2, textColor: COLORS.black },
        headStyles: { fillColor: COLORS.green, textColor: COLORS.white, fontStyle: "bold" },
        columnStyles: { 0: { cellWidth: 35, fontStyle: "bold" } },
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 6;
    }

    // Negative themes
    if (tags.negativeCounts?.size > 0) {
      pg = checkPage(doc, y, 30, pageNum, reportTitle, dateRangeStr);
      y = pg.y; pageNum = pg.pageNum;

      y = addSubsectionTitle(doc, y, "Areas for Improvement");
      const negData = [...tags.negativeCounts].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([tag, count]) => [tag, `Mentioned ${count} times`]);

      doc.autoTable({
        startY: y,
        margin: { left: MARGIN, right: MARGIN },
        head: [["Issue", "Details"]],
        body: negData,
        styles: { fontSize: 8, cellPadding: 2, textColor: COLORS.black },
        headStyles: { fillColor: [183, 28, 28], textColor: COLORS.white, fontStyle: "bold" },
        columnStyles: { 0: { cellWidth: 35, fontStyle: "bold" } },
        theme: "grid",
      });
      y = doc.lastAutoTable.finalY + 6;
    }
  }

  // ─── Room-level Breakdown ───
  const roomMap = {};
  (reviews.reviews || []).forEach((r) => {
    const room = r.room_name || "Unknown";
    if (!roomMap[room]) roomMap[room] = { total: 0, count: 0 };
    roomMap[room].total += Number(r.review_rating || 0);
    roomMap[room].count += 1;
  });
  const roomBreakdown = Object.entries(roomMap)
    .filter(([, v]) => v.count >= 2)
    .map(([name, v]) => ({ name, avg: v.total / v.count, count: v.count }))
    .sort((a, b) => a.avg - b.avg);

  if (roomBreakdown.length > 1) {
    let pg = checkPage(doc, y, 30, pageNum, reportTitle, dateRangeStr);
    y = pg.y; pageNum = pg.pageNum;

    y = addSubsectionTitle(doc, y, "Room-level Breakdown");
    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Room / Inventory", "Avg Rating", "Reviews"]],
      body: roomBreakdown.map((r) => [r.name, fmt(r.avg), r.count]),
      styles: { fontSize: 8, cellPadding: 2, textColor: COLORS.black },
      headStyles: { fillColor: COLORS.blue, textColor: COLORS.white, fontStyle: "bold" },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 1) {
          const val = parseFloat(data.cell.raw);
          if (val < 3.5) data.cell.styles.textColor = COLORS.red;
          else if (val >= 4.5) data.cell.styles.textColor = COLORS.green;
        }
      },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  // ─── PAGE 3: Action Items ───
  const propItems = (actionItems || []).filter((i) => i.property_name === selectedProperty);
  const openItems = propItems.filter((i) => i.status !== "done");
  const doneItems = propItems.filter((i) => i.status === "done");

  if (openItems.length || doneItems.length) {
    let pg = checkPage(doc, y, 40, pageNum, reportTitle, dateRangeStr);
    y = pg.y; pageNum = pg.pageNum;
    if (y > 30) {
      doc.addPage(); pageNum++;
      addPageHeader(doc, reportTitle, dateRangeStr, pageNum);
      y = 25;
    }

    y = addSectionTitle(doc, y, "Action Items");

    const overdueCount = openItems.filter((i) => i.due_date && new Date(i.due_date) < new Date()).length;
    const totalItems = propItems.length;
    const completionRate = totalItems > 0 ? Math.round((doneItems.length / totalItems) * 100) : 0;

    // Mini stat cards row
    const miniCardW = (CONTENT_WIDTH - 12) / 5;
    const miniStats = [
      { label: "TOTAL", value: totalItems, color: COLORS.black },
      { label: "OPEN", value: openItems.length, color: COLORS.orange },
      { label: "COMPLETED", value: doneItems.length, color: COLORS.green },
      { label: "OVERDUE", value: overdueCount, color: overdueCount > 0 ? COLORS.red : COLORS.medGray },
      { label: "COMPLETION", value: `${completionRate}%`, color: completionRate >= 70 ? COLORS.green : COLORS.red },
    ];

    miniStats.forEach((stat, i) => {
      const sx = MARGIN + i * (miniCardW + 3);
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(sx, y, miniCardW, 16, 1, 1, "F");
      doc.setTextColor(...stat.color);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(String(stat.value), sx + miniCardW / 2, y + 7, { align: "center" });
      doc.setTextColor(...COLORS.medGray);
      doc.setFontSize(6);
      doc.setFont("helvetica", "normal");
      doc.text(stat.label, sx + miniCardW / 2, y + 13, { align: "center" });
    });
    y += 20;

    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const sorted = [...openItems].sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

    doc.autoTable({
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [["Pri.", "Action Item", "Assignee", "Due Date", "Status"]],
      body: sorted.map((item) => {
        const isOverdue = item.due_date && new Date(item.due_date) < new Date();
        return [
          (item.priority || "medium").toUpperCase(),
          item.action || item.text || "",
          item.assignee || "Unassigned",
          item.due_date ? fmtDateShort(item.due_date) + (isOverdue ? " OVERDUE" : "") : "-",
          item.status || "open",
        ];
      }),
      styles: { fontSize: 7.5, cellPadding: 2, textColor: COLORS.black, overflow: "ellipsize" },
      headStyles: { fillColor: COLORS.darkGray, textColor: COLORS.white, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 14, halign: "center" },
        1: { cellWidth: 70 },
        2: { cellWidth: 28 },
        3: { cellWidth: 25, halign: "center" },
        4: { cellWidth: 18, halign: "center" },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 0) {
          const pri = String(data.cell.raw).toLowerCase();
          if (pri === "critical" || pri === "high") data.cell.styles.textColor = COLORS.red;
        }
        if (data.section === "body" && data.column.index === 3) {
          if (String(data.cell.raw).includes("OVERDUE")) data.cell.styles.textColor = COLORS.red;
        }
      },
      theme: "grid",
    });
    y = doc.lastAutoTable.finalY + 6;

    if (doneItems.length > 0) {
      pg = checkPage(doc, y, 12, pageNum, reportTitle, dateRangeStr);
      y = pg.y; pageNum = pg.pageNum;
      doc.setFillColor(232, 245, 233);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 10, 1, 1, "F");
      doc.setTextColor(...COLORS.green);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${doneItems.length} action items completed this period`, MARGIN + 4, y + 6.5);
      y += 14;
    }
  }

  // ─── Critical Review Quotes (tied to key issues from page 2) ───
  const negTags = tags?.negativeCounts ? [...tags.negativeCounts].sort((a, b) => b[1] - a[1]).slice(0, 6) : [];
  const taggedReviews = tags?.taggedReviews || {};

  if (negTags.length > 0) {
    let pg = checkPage(doc, y, 40, pageNum, reportTitle, dateRangeStr);
    y = pg.y; pageNum = pg.pageNum;
    if (y > 30) {
      doc.addPage(); pageNum++;
      addPageHeader(doc, reportTitle, dateRangeStr, pageNum);
      y = 25;
    }

    y = addSectionTitle(doc, y, "What Guests Are Saying About Key Issues");

    // Actionable review stats
    const totalReviewCount = (reviews.reviews || []).length;
    const negativeReviewCount = (reviews.reviews || []).filter((r) => Math.round(Number(r.review_rating)) <= 3).length;
    doc.setTextColor(...COLORS.black);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${negativeReviewCount} of ${totalReviewCount} reviews (${totalReviewCount > 0 ? Math.round((negativeReviewCount / totalReviewCount) * 100) : 0}%) were rated 3 or below`,
      MARGIN, y + 4
    );
    y += 12;

    for (const [tagName, count] of negTags) {
      pg = checkPage(doc, y, 28, pageNum, reportTitle, dateRangeStr);
      y = pg.y; pageNum = pg.pageNum;

      // Tag header bar
      doc.setFillColor(255, 235, 238);
      doc.roundedRect(MARGIN, y, CONTENT_WIDTH, 6, 1, 1, "F");
      doc.setTextColor(...COLORS.red);
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.text(`${tagName}  (${count} mentions)`, MARGIN + 3, y + 4);
      y += 8;

      // Find a representative quote for this tag
      const tagRevs = taggedReviews[tagName] || [];
      const bestQuote = tagRevs.find((r) => r.comment && r.comment.length > 20);
      if (bestQuote) {
        doc.setTextColor(...COLORS.black);
        doc.setFontSize(7.5);
        doc.setFont("helvetica", "italic");
        const snippet = bestQuote.comment.length > 180 ? bestQuote.comment.slice(0, 180) + "..." : bestQuote.comment;
        const lines = wrapText(doc, `"${snippet}"`, CONTENT_WIDTH - 10);
        doc.text(lines, MARGIN + 5, y + 3);
        y += lines.length * 3.5 + 2;
        // Attribution
        doc.setTextColor(...COLORS.lightGray);
        doc.setFontSize(6.5);
        doc.setFont("helvetica", "normal");
        doc.text(
          `-- ${bestQuote.guest_name || "Guest"}, ${fmt(Number(bestQuote.rating))} / 5, ${fmtDateShort(bestQuote.date)}`,
          MARGIN + 5, y + 2
        );
        y += 6;
      }
      y += 4;
    }
  }

  // Footer on last page
  doc.setTextColor(...COLORS.medGray);
  doc.setFontSize(7);
  doc.text(`Page ${pageNum}`, PAGE_WIDTH / 2, PAGE_HEIGHT - 8, { align: "center" });

  return doc;
}
