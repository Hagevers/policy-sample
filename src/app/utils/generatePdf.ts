import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const cleanTableRows = (tableContent) => {
  const rows = tableContent
    .split("\n")
    .map((row) => row.trim())
    .filter((row) => row && row.includes("|"))
    .map((row) => {
      if (row.includes("---")) return null;
      return row
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);
    })
    .filter((row) => row !== null);

  return rows;
};

export async function generatePDF(answer) {
  if (!answer) return;

  const sections = answer.split(/(?=\n###|\n####)/).filter(Boolean);
  const content = [];

  sections.forEach((section) => {
    const lines = section.split("\n").filter(Boolean);
    const title = lines[0].replace(/^#+\s*/, "").trim();
    const contentLines = lines.slice(1).join("\n");

    content.push({ text: title, style: "header", alignment: "right" });

    if (contentLines.includes("|")) {
      const rows = cleanTableRows(contentLines);
      const [header, ...dataRows] = rows;

      content.push({
        table: {
          headerRows: 1,
          widths: Array(header.length).fill("auto"),
          body: [
            header.map((cell) => ({ text: cell, style: "tableHeader" })),
            ...dataRows,
          ],
        },
        layout: "lightHorizontalLines",
      });
    } else {
      content.push({ text: contentLines, alignment: "right", margin: [0, 5] });
    }
  });

  const docDefinition = {
    content,
    styles: {
      header: { fontSize: 16, bold: true },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: "white",
        fillColor: "#4F81BD",
      },
    },
    defaultStyle: {
      font: "Helvetica",
    },
  };

  pdfMake.createPdf(docDefinition).download("policy_comparison.pdf");
}

export default generatePDF;
