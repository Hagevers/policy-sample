// services/ReportService.ts
import { ComparisonResult, ReportOptions, Policy } from "../types";

export class ReportService {
  /**
   * Generate a markdown report from comparison results
   * @param comparison The comparison result to generate a report for
   * @param options Report generation options
   * @returns Markdown report as a string
   */
  generateMarkdownReport(
    comparison: ComparisonResult,
    policyA: Policy,
    policyB: Policy,
    options: ReportOptions = { format: "markdown" }
  ): string {
    // Start with the title and identification
    let report = `# השוואת פוליסות ביטוח בריאות\n\n`;

    report += `## זיהוי הפוליסות\n\n`;
    report += `פוליסה A: ${comparison.policyAName || comparison.policyAId} (${
      policyA.issuer || "לא צוין"
    })\n\n`;
    report += `פוליסה B: ${comparison.policyBName || comparison.policyBId} (${
      policyB.issuer || "לא צוין"
    })\n\n`;

    // Add summary if requested
    if (options.includeSummary !== false && comparison.summary) {
      report += `## סיכום השוואה\n\n`;
      report += `${comparison.summary}\n\n`;
    }

    // Add significant differences section
    if (
      comparison.significantDifferences &&
      comparison.significantDifferences.length > 0
    ) {
      report += `## הבדלים מהותיים\n\n`;

      comparison.significantDifferences.forEach((diff, index) => {
        report += `### ${index + 1}. ${diff.aspect}\n\n`;
        report += `**פרק**: ${diff.chapter}\n\n`;
        report += `**השפעה כספית**: ${diff.financialImpact}\n\n`;
        report += `**השלכה מעשית**: ${diff.practicalImplication}\n\n`;
        report += `**פוליסה עדיפה**: ${
          diff.betterPolicy === "A"
            ? "פוליסה A"
            : diff.betterPolicy === "B"
            ? "פוליסה B"
            : "שוויון"
        }\n\n`;
      });
    }

    // Add chapter comparisons
    report += `## השוואת פרקי הפוליסה\n\n`;

    // Sort chapters by name
    const sortedChapters = Object.keys(comparison.chapterComparisons).sort();

    for (const chapterTitle of sortedChapters) {
      const chapterComparison = comparison.chapterComparisons[chapterTitle];

      report += `### ${chapterTitle}\n\n`;

      // Add chapter summary if available
      if (chapterComparison.summary) {
        report += `${chapterComparison.summary}\n\n`;
      }

      // Create comparison table
      report += `| כיסוי | פוליסה A | פוליסה B | הערות השוואתיות |\n`;
      report += `|-------|---------|---------|-------------------|\n`;

      // Add each coverage comparison
      for (const [questionId, coverageComparison] of Object.entries(
        chapterComparison.coverageComparisons
      )) {
        report += `| ${coverageComparison.policyA.split(":")[0]} | ${
          coverageComparison.policyA.includes(":")
            ? coverageComparison.policyA.split(":")[1].trim()
            : coverageComparison.policyA
        } | ${
          coverageComparison.policyB.includes(":")
            ? coverageComparison.policyB.split(":")[1].trim()
            : coverageComparison.policyB
        } | ${coverageComparison.difference}; ${
          coverageComparison.analysis
        } |\n`;
      }

      // Add missing in A
      for (const questionId of chapterComparison.missingInA) {
        report += `| ${questionId} | לא קיים | קיים | חסר בפוליסה A |\n`;
      }

      // Add missing in B
      for (const questionId of chapterComparison.missingInB) {
        report += `| ${questionId} | קיים | לא קיים | חסר בפוליסה B |\n`;
      }

      report += `\n`;
    }

    return report;
  }

  /**
   * Generate an HTML report from comparison results
   * @param comparison The comparison result to generate a report for
   * @param options Report generation options
   * @returns HTML report as a string
   */
  generateHtmlReport(
    comparison: ComparisonResult,
    policyA: Policy,
    policyB: Policy,
    options: ReportOptions = { format: "html" }
  ): string {
    // Create HTML header with RTL direction and styling
    let report = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>השוואת פוליסות ביטוח בריאות</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      direction: rtl;
    }
    h1, h2, h3 {
      color: #2c3e50;
    }
    h1 {
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }
    h2 {
      margin-top: 30px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 12px;
      text-align: right;
    }
    th {
      background-color: #f8f9fa;
      font-weight: bold;
    }
    tr:nth-child(even) {
      background-color: #f8f9fa;
    }
    .highlight {
      background-color: #ffffcc;
    }
    .better-a {
      color: #27ae60;
      font-weight: bold;
    }
    .better-b {
      color: #2980b9;
      font-weight: bold;
    }
    .significant {
      border-left: 4px solid #e74c3c;
      padding-left: 15px;
      margin-bottom: 20px;
    }
    .summary {
      background-color: #f8f9fa;
      border: 1px solid #ddd;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
  </style>
</head>
<body>
  <h1>השוואת פוליסות ביטוח בריאות</h1>
  
  <h2>זיהוי הפוליסות</h2>
  <p><strong>פוליסה A:</strong> ${
    comparison.policyAName || comparison.policyAId
  } (${policyA.issuer || "לא צוין"})</p>
  <p><strong>פוליסה B:</strong> ${
    comparison.policyBName || comparison.policyBId
  } (${policyB.issuer || "לא צוין"})</p>
`;

    // Add summary if requested
    if (options.includeSummary !== false && comparison.summary) {
      report += `
  <h2>סיכום השוואה</h2>
  <div class="summary">
    <p>${comparison.summary}</p>
  </div>
`;
    }

    // Add significant differences section
    if (
      comparison.significantDifferences &&
      comparison.significantDifferences.length > 0
    ) {
      report += `
  <h2>הבדלים מהותיים</h2>
`;
      comparison.significantDifferences.forEach((diff, index) => {
        report += `
  <div class="significant">
    <h3>${index + 1}. ${diff.aspect}</h3>
    <p><strong>פרק:</strong> ${diff.chapter}</p>
    <p><strong>השפעה כספית:</strong> ${diff.financialImpact}</p>
    <p><strong>השלכה מעשית:</strong> ${diff.practicalImplication}</p>
    <p><strong>פוליסה עדיפה:</strong> ${
      diff.betterPolicy === "A"
        ? '<span class="better-a">פוליסה A</span>'
        : diff.betterPolicy === "B"
        ? '<span class="better-b">פוליסה B</span>'
        : "שוויון"
    }</p>
  </div>
`;
      });
    }

    // Add chapter comparisons
    report += `
  <h2>השוואת פרקי הפוליסה</h2>
`;

    // Sort chapters by name
    const sortedChapters = Object.keys(comparison.chapterComparisons).sort();

    for (const chapterTitle of sortedChapters) {
      const chapterComparison = comparison.chapterComparisons[chapterTitle];

      report += `
  <h3>${chapterTitle}</h3>
`;

      // Add chapter summary if available
      if (chapterComparison.summary) {
        report += `
  <div class="summary">
    <p>${chapterComparison.summary}</p>
  </div>
`;
      }

      // Create comparison table
      report += `
  <table>
    <thead>
      <tr>
        <th>כיסוי</th>
        <th>פוליסה A</th>
        <th>פוליסה B</th>
        <th>הערות השוואתיות</th>
      </tr>
    </thead>
    <tbody>
`;

      // Add each coverage comparison
      for (const [questionId, coverageComparison] of Object.entries(
        chapterComparison.coverageComparisons
      )) {
        const betterClass =
          coverageComparison.betterPolicy === "A"
            ? "better-a"
            : coverageComparison.betterPolicy === "B"
            ? "better-b"
            : "";

        const isHighlighted =
          options.highlightSignificantDifferences &&
          comparison.significantDifferences.some(
            (diff) =>
              diff.chapter === chapterTitle &&
              diff.aspect.includes(coverageComparison.policyA.split(":")[0])
          );

        report += `
      <tr${isHighlighted ? ' class="highlight"' : ""}>
        <td>${coverageComparison.policyA.split(":")[0]}</td>
        <td class="${
          coverageComparison.betterPolicy === "A" ? "better-a" : ""
        }">${
          coverageComparison.policyA.includes(":")
            ? coverageComparison.policyA.split(":")[1].trim()
            : coverageComparison.policyA
        }</td>
        <td class="${
          coverageComparison.betterPolicy === "B" ? "better-b" : ""
        }">${
          coverageComparison.policyB.includes(":")
            ? coverageComparison.policyB.split(":")[1].trim()
            : coverageComparison.policyB
        }</td>
        <td>${coverageComparison.difference}; ${
          coverageComparison.analysis
        }</td>
      </tr>
`;
      }

      // Add missing in A
      for (const questionId of chapterComparison.missingInA) {
        report += `
      <tr>
        <td>${questionId}</td>
        <td>לא קיים</td>
        <td class="better-b">קיים</td>
        <td>חסר בפוליסה A</td>
      </tr>
`;
      }

      // Add missing in B
      for (const questionId of chapterComparison.missingInB) {
        report += `
      <tr>
        <td>${questionId}</td>
        <td class="better-a">קיים</td>
        <td>לא קיים</td>
        <td>חסר בפוליסה B</td>
      </tr>
`;
      }

      report += `
    </tbody>
  </table>
`;
    }

    // Close HTML
    report += `
</body>
</html>
`;

    return report;
  }

  /**
   * Generate a comparison report
   * @param comparison The comparison result to generate a report for
   * @param policyA First policy
   * @param policyB Second policy
   * @param options Report generation options
   * @returns Report in the requested format
   */
  generateReport(
    comparison: ComparisonResult,
    policyA: Policy,
    policyB: Policy,
    options: ReportOptions = { format: "markdown" }
  ): string {
    switch (options.format) {
      case "html":
        return this.generateHtmlReport(comparison, policyA, policyB, options);
      case "markdown":
      default:
        return this.generateMarkdownReport(
          comparison,
          policyA,
          policyB,
          options
        );
    }
  }
}
